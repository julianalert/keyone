/**
 * key.one compatibility suite.
 *
 * Sends real traffic through the proxy using the client libraries customers
 * actually use, then checks the call log to confirm each call was attributed
 * and priced. Run locally against the dev server or in CI against production.
 *
 *   KEYONE_TEST_BASE_URL     e.g. http://localhost:3001 or https://getkeyone.com
 *   KEYONE_TEST_PROJECT_KEY  a project key on a throwaway test project
 *   KEYONE_TEST_ADMIN_KEY    an agency key of the same agency (reads the log, toggles controls)
 *
 * Every call is tiny; a full run costs a fraction of a cent.
 */
import fs from 'node:fs'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { generateText, streamText, tool, jsonSchema } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { ChatOpenAI } from '@langchain/openai'
import { ChatAnthropic } from '@langchain/anthropic'

// ---------- env ----------
for (const f of ['.env.test.local', '.env.test']) {
  if (fs.existsSync(f)) for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}
const BASE = (process.env.KEYONE_TEST_BASE_URL ?? 'http://localhost:3001').replace(/\/+$/, '')
const KEY = process.env.KEYONE_TEST_PROJECT_KEY ?? ''
const ADMIN = process.env.KEYONE_TEST_ADMIN_KEY ?? ''
if (!KEY) { console.error('KEYONE_TEST_PROJECT_KEY is required'); process.exit(2) }

const OPENAI_BASE = `${BASE}/api/proxy/openai/v1`
const ANTHROPIC_BASE = `${BASE}/api/proxy/anthropic`
const CHEAP_OPENAI = 'gpt-4o-mini'
const CHEAP_ANTHROPIC = 'claude-haiku-4-5'

// ---------- log verification ----------
interface LoggedCall { id: string; created_at: string; status: string; model: string | null; cost_usd: number; input_tokens: number | null; output_tokens: number | null; blocked_reason: string | null; catalog_api_id: string }
let projectId = ''
async function status() {
  const r = await fetch(`${BASE}/api/proxy/status`, { headers: { Authorization: `Bearer ${KEY}` } })
  if (!r.ok) throw new Error(`status ${r.status}`)
  return r.json() as Promise<{ project: { id: string; name: string; monthly_budget_usd: number | null; allowed_models: string[] | null }; wallet_balance_usd: number }>
}
async function recentCalls(): Promise<LoggedCall[]> {
  if (!ADMIN) return []
  const r = await fetch(`${BASE}/api/analytics/projects/${projectId}`, { headers: { Authorization: `Bearer ${ADMIN}` } })
  if (!r.ok) throw new Error(`analytics ${r.status}`)
  return ((await r.json()).recent_calls ?? []) as LoggedCall[]
}
// Wait for a logged call created after t0 matching the predicate (streams settle a moment after the client finishes)
async function expectLogged(t0: number, pred: (c: LoggedCall) => boolean, label: string): Promise<LoggedCall> {
  if (!ADMIN) throw new Error('KEYONE_TEST_ADMIN_KEY needed to verify the log')
  for (let i = 0; i < 20; i++) {
    const hit = (await recentCalls()).find(c => new Date(c.created_at).getTime() >= t0 - 2000 && pred(c))
    if (hit) return hit
    await new Promise(r => setTimeout(r, 500))
  }
  throw new Error(`no logged call matched: ${label}`)
}
const completedAndPriced = (c: LoggedCall) => c.status === 'completed' && Number(c.cost_usd) > 0 && Number(c.input_tokens ?? 0) > 0
async function patchProject(body: Record<string, unknown>) {
  const r = await fetch(`${BASE}/api/projects/${projectId}`, { method: 'PATCH', headers: { Authorization: `Bearer ${ADMIN}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (!r.ok) throw new Error(`patch project ${r.status}`)
}

// ---------- cases ----------
type Case = { name: string; run: () => Promise<string> }
const cases: Case[] = []
const add = (name: string, run: () => Promise<string>) => cases.push({ name, run })

const oa = new OpenAI({ baseURL: OPENAI_BASE, apiKey: KEY })
const an = new Anthropic({ baseURL: ANTHROPIC_BASE, apiKey: KEY })
const weatherTool = { name: 'get_weather', description: 'Get the weather for a city', parameters: { type: 'object', properties: { city: { type: 'string' } }, required: ['city'], additionalProperties: false } as const }

add('status endpoint', async () => {
  const s = await status(); projectId = s.project.id
  return `project "${s.project.name}", wallet $${s.wallet_balance_usd.toFixed(2)}`
})

// --- OpenAI official SDK: Chat Completions ---
add('openai sdk · chat completions · buffered', async () => {
  const t0 = Date.now()
  const r = await oa.chat.completions.create({ model: CHEAP_OPENAI, max_tokens: 20, messages: [{ role: 'user', content: 'Say hi' }] })
  if (!r.choices[0]?.message?.content) throw new Error('no content')
  const c = await expectLogged(t0, c => completedAndPriced(c) && c.model === CHEAP_OPENAI, 'chat buffered')
  return `"${r.choices[0].message.content.trim().slice(0, 30)}" · ${c.input_tokens}+${c.output_tokens} tok · $${Number(c.cost_usd).toFixed(6)}`
})
add('openai sdk · chat completions · streamed', async () => {
  const t0 = Date.now()
  const stream = await oa.chat.completions.create({ model: CHEAP_OPENAI, max_tokens: 20, stream: true, messages: [{ role: 'user', content: 'Count to three' }] })
  let text = '', sawUsage = false
  for await (const chunk of stream) { text += chunk.choices[0]?.delta?.content ?? ''; if (chunk.usage) sawUsage = true }
  if (!text) throw new Error('no streamed text')
  const c = await expectLogged(t0, completedAndPriced, 'chat streamed')
  return `${text.trim().slice(0, 30)} · usage chunk ${sawUsage ? 'seen' : 'MISSING'} · $${Number(c.cost_usd).toFixed(6)}`
})
add('openai sdk · chat completions · tool call', async () => {
  const t0 = Date.now()
  const r = await oa.chat.completions.create({ model: CHEAP_OPENAI, max_tokens: 60, messages: [{ role: 'user', content: 'What is the weather in Lisbon? Use the tool.' }], tools: [{ type: 'function', function: weatherTool }] })
  const call = r.choices[0]?.message?.tool_calls?.[0]
  if (!call) throw new Error('no tool call returned')
  await expectLogged(t0, completedAndPriced, 'chat tools')
  return `tool ${call.type === 'function' ? call.function.name : call.type}(${call.type === 'function' ? call.function.arguments : ''})`
})

// --- OpenAI official SDK: Responses API ---
add('openai sdk · responses · buffered', async () => {
  const t0 = Date.now()
  const r = await oa.responses.create({ model: CHEAP_OPENAI, max_output_tokens: 30, input: 'Say hi' })
  if (!r.output_text) throw new Error('no output_text')
  const c = await expectLogged(t0, completedAndPriced, 'responses buffered')
  return `"${r.output_text.trim().slice(0, 30)}" · $${Number(c.cost_usd).toFixed(6)}`
})
add('openai sdk · responses · streamed', async () => {
  const t0 = Date.now()
  const stream = await oa.responses.create({ model: CHEAP_OPENAI, max_output_tokens: 30, input: 'Count to three', stream: true })
  let text = '', completed = false
  for await (const ev of stream) { if (ev.type === 'response.output_text.delta') text += ev.delta; if (ev.type === 'response.completed') completed = true }
  if (!text || !completed) throw new Error(`text=${!!text} completed=${completed}`)
  const c = await expectLogged(t0, completedAndPriced, 'responses streamed')
  return `${text.trim().slice(0, 30)} · $${Number(c.cost_usd).toFixed(6)}`
})
add('openai sdk · responses · tool call', async () => {
  const t0 = Date.now()
  const r = await oa.responses.create({ model: CHEAP_OPENAI, max_output_tokens: 60, input: 'What is the weather in Lisbon? Use the tool.', tools: [{ type: 'function', name: weatherTool.name, description: weatherTool.description, parameters: weatherTool.parameters, strict: true }] })
  const call = r.output.find(o => o.type === 'function_call')
  if (!call) throw new Error('no function_call in output')
  await expectLogged(t0, completedAndPriced, 'responses tools')
  return `tool ${(call as { name: string }).name}`
})

// --- Anthropic official SDK ---
add('anthropic sdk · messages · buffered', async () => {
  const t0 = Date.now()
  const r = await an.messages.create({ model: CHEAP_ANTHROPIC, max_tokens: 20, messages: [{ role: 'user', content: 'Say hi' }] })
  const text = r.content.find(b => b.type === 'text')
  if (!text || text.type !== 'text' || !text.text) throw new Error('no text block')
  const c = await expectLogged(t0, c => completedAndPriced(c) && (c.model ?? '').startsWith('claude'), 'anthropic buffered')
  return `"${text.text.trim().slice(0, 30)}" · $${Number(c.cost_usd).toFixed(6)}`
})
add('anthropic sdk · messages · streamed', async () => {
  const t0 = Date.now()
  const msg = await an.messages.stream({ model: CHEAP_ANTHROPIC, max_tokens: 20, messages: [{ role: 'user', content: 'Count to three' }] }).finalMessage()
  const text = msg.content.find(b => b.type === 'text')
  if (!text || text.type !== 'text' || !text.text) throw new Error('no text')
  if (!msg.usage?.output_tokens) throw new Error('no usage on final message')
  const c = await expectLogged(t0, completedAndPriced, 'anthropic streamed')
  return `${text.text.trim().slice(0, 30)} · ${c.input_tokens}+${c.output_tokens} tok`
})
add('anthropic sdk · messages · tool use', async () => {
  const t0 = Date.now()
  const r = await an.messages.create({ model: CHEAP_ANTHROPIC, max_tokens: 100, messages: [{ role: 'user', content: 'What is the weather in Lisbon? Use the tool.' }], tools: [{ name: weatherTool.name, description: weatherTool.description, input_schema: weatherTool.parameters as never }] })
  const use = r.content.find(b => b.type === 'tool_use')
  if (!use) throw new Error('no tool_use block')
  await expectLogged(t0, completedAndPriced, 'anthropic tools')
  return `tool_use ${(use as { name: string }).name}`
})
add('anthropic sdk · adaptive thinking (sonnet 5)', async () => {
  const t0 = Date.now()
  const r = await an.messages.create({ model: 'claude-sonnet-5', max_tokens: 300, thinking: { type: 'adaptive' } as never, messages: [{ role: 'user', content: 'What is 17 × 23? Answer with the number only.' }] })
  const text = r.content.find(b => b.type === 'text')
  if (!text || text.type !== 'text') throw new Error('no text')
  const c = await expectLogged(t0, c => completedAndPriced(c) && c.model === 'claude-sonnet-5', 'thinking')
  return `"${text.text.trim().slice(0, 20)}" · ${c.output_tokens} out tok (thinking billed as output)`
})

// --- Vercel AI SDK ---
const vOpenAI = createOpenAI({ baseURL: OPENAI_BASE, apiKey: KEY })
const vAnthropic = createAnthropic({ baseURL: ANTHROPIC_BASE, apiKey: KEY })
add('vercel ai sdk · openai · generateText (responses api)', async () => {
  const t0 = Date.now()
  const r = await generateText({ model: vOpenAI(CHEAP_OPENAI), prompt: 'Say hi', maxOutputTokens: 30 })
  if (!r.text) throw new Error('no text')
  const c = await expectLogged(t0, completedAndPriced, 'ai sdk openai')
  return `"${r.text.trim().slice(0, 30)}" · $${Number(c.cost_usd).toFixed(6)}`
})
add('vercel ai sdk · openai · streamText', async () => {
  const t0 = Date.now()
  const r = streamText({ model: vOpenAI(CHEAP_OPENAI), prompt: 'Count to three', maxOutputTokens: 30 })
  let text = ''; for await (const part of r.textStream) text += part
  if (!text) throw new Error('no streamed text')
  const c = await expectLogged(t0, completedAndPriced, 'ai sdk openai stream')
  return `${text.trim().slice(0, 30)} · $${Number(c.cost_usd).toFixed(6)}`
})
add('vercel ai sdk · openai · tool call', async () => {
  const t0 = Date.now()
  const r = await generateText({
    model: vOpenAI(CHEAP_OPENAI), prompt: 'What is the weather in Lisbon? Use the tool.', maxOutputTokens: 60,
    tools: { get_weather: tool({ description: weatherTool.description, inputSchema: jsonSchema<{ city: string }>(weatherTool.parameters as never) }) },
  })
  if (!r.toolCalls?.length) throw new Error('no tool calls')
  await expectLogged(t0, completedAndPriced, 'ai sdk tools')
  return `tool ${r.toolCalls[0].toolName}`
})
add('vercel ai sdk · anthropic · generateText', async () => {
  const t0 = Date.now()
  const r = await generateText({ model: vAnthropic(CHEAP_ANTHROPIC), prompt: 'Say hi', maxOutputTokens: 30 })
  if (!r.text) throw new Error('no text')
  const c = await expectLogged(t0, completedAndPriced, 'ai sdk anthropic')
  return `"${r.text.trim().slice(0, 30)}" · $${Number(c.cost_usd).toFixed(6)}`
})
add('vercel ai sdk · anthropic · streamText', async () => {
  const t0 = Date.now()
  const r = streamText({ model: vAnthropic(CHEAP_ANTHROPIC), prompt: 'Count to three', maxOutputTokens: 30 })
  let text = ''; for await (const part of r.textStream) text += part
  if (!text) throw new Error('no streamed text')
  await expectLogged(t0, completedAndPriced, 'ai sdk anthropic stream')
  return text.trim().slice(0, 30)
})

// --- LangChain ---
add('langchain · ChatOpenAI', async () => {
  const t0 = Date.now()
  const llm = new ChatOpenAI({ model: CHEAP_OPENAI, apiKey: KEY, maxTokens: 20, configuration: { baseURL: OPENAI_BASE } })
  const r = await llm.invoke('Say hi')
  const text = typeof r.content === 'string' ? r.content : JSON.stringify(r.content)
  if (!text) throw new Error('no content')
  await expectLogged(t0, completedAndPriced, 'langchain openai')
  return `"${text.trim().slice(0, 30)}"`
})
add('langchain · ChatAnthropic', async () => {
  const t0 = Date.now()
  const llm = new ChatAnthropic({ model: CHEAP_ANTHROPIC, apiKey: KEY, maxTokens: 20, anthropicApiUrl: ANTHROPIC_BASE })
  const r = await llm.invoke('Say hi')
  const text = typeof r.content === 'string' ? r.content : JSON.stringify(r.content)
  if (!text) throw new Error('no content')
  await expectLogged(t0, completedAndPriced, 'langchain anthropic')
  return `"${text.trim().slice(0, 30)}"`
})

// --- proxy semantics ---
add('model shortcut "cheapest" resolves and is priced', async () => {
  const t0 = Date.now()
  const r = await fetch(`${BASE}/api/proxy/openai`, { method: 'POST', headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'cheapest', max_tokens: 20, messages: [{ role: 'user', content: 'hi' }] }) })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  const resolved = r.headers.get('x-model-resolved')
  if (!resolved) throw new Error('no X-Model-Resolved header')
  await expectLogged(t0, completedAndPriced, 'shortcut')
  return resolved
})
add('provider error is logged as failed and not charged', async () => {
  const t0 = Date.now()
  const r = await fetch(`${BASE}/api/proxy/openai`, { method: 'POST', headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'gpt-does-not-exist', max_tokens: 5, messages: [{ role: 'user', content: 'hi' }] }) })
  if (r.ok) throw new Error('expected a provider error')
  const c = await expectLogged(t0, c => c.status === 'failed' && c.model === 'gpt-does-not-exist', 'failed call')
  return `HTTP ${r.status} · logged failed · $${Number(c.cost_usd).toFixed(6)}`
})
add('allowed-models control blocks and unblocks', async () => {
  if (!ADMIN) throw new Error('needs KEYONE_TEST_ADMIN_KEY')
  await patchProject({ allowed_models: ['gpt-4o-mini'] })
  try {
    const r = await fetch(`${BASE}/api/proxy/anthropic`, { method: 'POST', headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: CHEAP_ANTHROPIC, max_tokens: 5, messages: [{ role: 'user', content: 'hi' }] }) })
    const body = await r.json()
    if (r.status !== 403 || body.status !== 'BLOCKED' || body.reason !== 'project_allowed_models') throw new Error(`expected 403 BLOCKED project_allowed_models, got ${r.status} ${body.reason}`)
    return `403 ${body.reason} · "${String(body.message).slice(0, 50)}…"`
  } finally {
    await patchProject({ allowed_models: [] })
  }
})
add('rejects a bad key', async () => {
  const r = await fetch(`${BASE}/api/proxy/openai`, { method: 'POST', headers: { Authorization: 'Bearer kone_live_nope', 'Content-Type': 'application/json' }, body: '{}' })
  if (r.status !== 401) throw new Error(`expected 401, got ${r.status}`)
  return '401'
})

// ---------- runner ----------
;(async () => {
  console.log(`key.one compatibility suite → ${BASE}\n`)
  let failed = 0
  const t = Date.now()
  for (const c of cases) {
    const start = Date.now()
    try {
      const detail = await c.run()
      console.log(`  PASS  ${c.name.padEnd(52)} ${detail}  (${Date.now() - start}ms)`)
    } catch (err) {
      failed++
      console.log(`  FAIL  ${c.name.padEnd(52)} ${err instanceof Error ? err.message : String(err)}`)
    }
  }
  console.log(`\n${cases.length - failed}/${cases.length} passed in ${((Date.now() - t) / 1000).toFixed(1)}s`)
  process.exit(failed ? 1 : 0)
})()
