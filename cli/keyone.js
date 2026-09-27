#!/usr/bin/env node
/*
 * keyone-cli — route a codebase's AI calls through key.one, deterministically.
 *
 *   npx keyone-cli setup            interactive: asks for the project key, writes env, rewires SDKs, test call
 *   npx keyone-cli setup --apply    also edits the SDK constructor calls it recognises
 *   npx keyone-cli test             one test call with the key in the env file
 *
 * The key is read, in order, from --key, $KEYONE_API_KEY, the env file, the
 * clipboard (--from-clipboard), or a hidden prompt. It is never printed.
 * No dependencies, Node 18+. Also served at https://getkeyone.com/setup.js so
 * it runs without npm:  curl -fsSL https://getkeyone.com/setup.js | node - setup
 */
'use strict'
const fs = require('fs')
const path = require('path')
const readline = require('readline')
const { execSync } = require('child_process')

const DEFAULT_BASE = process.env.KEYONE_BASE_URL || 'https://getkeyone.com'
const ENV_NAMES = ['KEYONE_API_KEY', 'KEYONE_OPENAI_BASE_URL', 'KEYONE_ANTHROPIC_BASE_URL', 'KEYONE_PERPLEXITY_BASE_URL']
const SKIP_DIRS = new Set(['node_modules', '.git', '.next', 'dist', 'build', 'out', '.venv', 'venv', '__pycache__', 'coverage', '.turbo', 'vendor'])

// ---------------------------------------------------------------- args
const argv = process.argv.slice(2)
const command = argv.find(a => !a.startsWith('-')) || 'setup'
const flag = name => argv.includes(`--${name}`)
const opt = name => { const i = argv.indexOf(`--${name}`); return i >= 0 ? argv[i + 1] : undefined }
const cwd = process.cwd()
const base = (opt('base-url') || DEFAULT_BASE).replace(/\/+$/, '')

const log = (...a) => console.log(...a)
const ok = m => log(`  ✓ ${m}`)
const warn = m => log(`  ! ${m}`)
const fail = m => { console.error(`  ✗ ${m}`); process.exit(1) }

// ---------------------------------------------------------------- env file
function findEnvFile() {
  for (const name of ['.env.local', '.env']) if (fs.existsSync(path.join(cwd, name))) return name
  return fs.existsSync(path.join(cwd, 'next.config.js')) || fs.existsSync(path.join(cwd, 'next.config.mjs')) || fs.existsSync(path.join(cwd, 'next.config.ts')) ? '.env.local' : '.env'
}
function readEnv(file) {
  const out = {}
  if (!fs.existsSync(file)) return out
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
  return out
}
function writeEnv(file, vars) {
  let text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''
  const lines = text.split('\n')
  const seen = new Set()
  const out = lines.map(line => {
    const m = line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=/)
    if (m && vars[m[1]] !== undefined) { seen.add(m[1]); return `${m[1]}=${vars[m[1]]}` }
    return line
  })
  while (out.length && out[out.length - 1] === '') out.pop()
  const missing = Object.keys(vars).filter(k => !seen.has(k))
  if (missing.length) {
    if (out.length) out.push('')
    out.push('# key.one: one project key for every model (https://getkeyone.com)')
    for (const k of missing) out.push(`${k}=${vars[k]}`)
  }
  fs.writeFileSync(file, out.join('\n') + '\n')
}
function ensureGitignored(file) {
  const gi = path.join(cwd, '.gitignore')
  if (!fs.existsSync(path.join(cwd, '.git'))) return
  const current = fs.existsSync(gi) ? fs.readFileSync(gi, 'utf8') : ''
  const covered = current.split('\n').some(l => { const p = l.trim(); return p === file || p === `/${file}` || p === '.env*' || p === '.env.*' && file !== '.env' || p === '*.local' && file.endsWith('.local') })
  if (covered) return
  fs.writeFileSync(gi, (current && !current.endsWith('\n') ? current + '\n' : current) + `${file}\n`)
  ok(`added ${file} to .gitignore`)
}
function updateEnvExample() {
  const ex = path.join(cwd, '.env.example')
  if (!fs.existsSync(ex)) return
  let text = fs.readFileSync(ex, 'utf8')
  const missing = ENV_NAMES.filter(k => !new RegExp(`^${k}=`, 'm').test(text))
  if (!missing.length) return
  text = text.replace(/\n*$/, '\n') + `\n# key.one\n` + missing.map(k => `${k}=`).join('\n') + '\n'
  fs.writeFileSync(ex, text)
  ok('listed the variable names in .env.example')
}

// ---------------------------------------------------------------- key
async function hiddenPrompt(question) {
  if (!process.stdin.isTTY) return null
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true })
    const write = rl._writeToOutput
    process.stdout.write(question)
    rl._writeToOutput = () => {}
    rl.question('', answer => { rl._writeToOutput = write; process.stdout.write('\n'); rl.close(); resolve(answer.trim()) })
  })
}
function clipboard() {
  try {
    if (process.platform === 'darwin') return execSync('pbpaste', { encoding: 'utf8' }).trim()
    if (process.platform === 'win32') return execSync('powershell -command Get-Clipboard', { encoding: 'utf8' }).trim()
    return execSync('xclip -selection clipboard -o 2>/dev/null || xsel --clipboard --output', { encoding: 'utf8', shell: '/bin/sh' }).trim()
  } catch { return '' }
}
async function resolveKey(envFile) {
  const candidates = [opt('key'), process.env.KEYONE_API_KEY, readEnv(envFile).KEYONE_API_KEY]
  if (flag('from-clipboard')) candidates.push(clipboard())
  for (const c of candidates) if (c && c.startsWith('kone_live_')) return c
  const typed = await hiddenPrompt('  Paste the project key from key.one (kone_live_…), it stays hidden: ')
  if (typed && typed.startsWith('kone_live_')) return typed
  const clip = clipboard()
  if (clip.startsWith('kone_live_')) { ok('took the project key from the clipboard'); return clip }
  return null
}

// ---------------------------------------------------------------- sdk detection
function readJson(p) { try { return JSON.parse(fs.readFileSync(p, 'utf8')) } catch { return null } }
function detectSdks() {
  const found = new Set()
  const pkg = readJson(path.join(cwd, 'package.json'))
  const deps = Object.assign({}, pkg && pkg.dependencies, pkg && pkg.devDependencies)
  if (deps.openai) found.add('openai')
  if (deps['@anthropic-ai/sdk']) found.add('anthropic')
  if (deps['@ai-sdk/openai']) found.add('ai-sdk-openai')
  if (deps['@ai-sdk/anthropic']) found.add('ai-sdk-anthropic')
  if (deps['@langchain/openai']) found.add('langchain-openai')
  if (deps['@langchain/anthropic']) found.add('langchain-anthropic')
  for (const f of ['requirements.txt', 'pyproject.toml', 'Pipfile']) {
    const p = path.join(cwd, f); if (!fs.existsSync(p)) continue
    const t = fs.readFileSync(p, 'utf8')
    if (/^\s*openai\b/m.test(t) || /"openai/.test(t)) found.add('py-openai')
    if (/^\s*anthropic\b/m.test(t) || /"anthropic/.test(t)) found.add('py-anthropic')
    if (/langchain[-_]openai/.test(t)) found.add('py-langchain-openai')
    if (/langchain[-_]anthropic/.test(t)) found.add('py-langchain-anthropic')
  }
  return found
}
function walk(dir, out, depth = 0) {
  if (depth > 8) return out
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name) && !e.name.startsWith('.')) walk(path.join(dir, e.name), out, depth + 1) }
    else if (/\.(js|mjs|cjs|ts|tsx|jsx|py)$/.test(e.name)) out.push(path.join(dir, e.name))
  }
  return out
}

// Constructor sites we know how to rewire. Each has a regex for the call
// and the env names to inject. JS/TS: object-literal options. Python: kwargs.
const SITES = [
  { lang: 'js', re: /\bnew\s+OpenAI\s*\(/g, label: 'new OpenAI(…)', url: 'KEYONE_OPENAI_BASE_URL', urlKey: 'baseURL', keyKey: 'apiKey' },
  { lang: 'js', re: /\bnew\s+Anthropic\s*\(/g, label: 'new Anthropic(…)', url: 'KEYONE_ANTHROPIC_BASE_URL', urlKey: 'baseURL', keyKey: 'apiKey' },
  { lang: 'js', re: /\bcreateOpenAI\s*\(/g, label: 'createOpenAI(…)', url: 'KEYONE_OPENAI_BASE_URL', urlKey: 'baseURL', keyKey: 'apiKey' },
  { lang: 'js', re: /\bcreateAnthropic\s*\(/g, label: 'createAnthropic(…)', url: 'KEYONE_ANTHROPIC_BASE_URL', urlKey: 'baseURL', keyKey: 'apiKey' },
  { lang: 'js', re: /\bnew\s+ChatOpenAI\s*\(/g, label: 'new ChatOpenAI(…)', url: 'KEYONE_OPENAI_BASE_URL', urlKey: 'configuration: { baseURL', keyKey: 'apiKey', langchain: true },
  { lang: 'js', re: /\bnew\s+ChatAnthropic\s*\(/g, label: 'new ChatAnthropic(…)', url: 'KEYONE_ANTHROPIC_BASE_URL', urlKey: 'anthropicApiUrl', keyKey: 'apiKey' },
  { lang: 'py', re: /(?<![\w.])(?:Async)?OpenAI\s*\(/g, label: 'OpenAI(…)', url: 'KEYONE_OPENAI_BASE_URL', urlKey: 'base_url', keyKey: 'api_key' },
  { lang: 'py', re: /(?<![\w.])(?:Async)?Anthropic\s*\(/g, label: 'Anthropic(…)', url: 'KEYONE_ANTHROPIC_BASE_URL', urlKey: 'base_url', keyKey: 'api_key' },
  { lang: 'py', re: /\bChatOpenAI\s*\(/g, label: 'ChatOpenAI(…)', url: 'KEYONE_OPENAI_BASE_URL', urlKey: 'base_url', keyKey: 'api_key' },
  { lang: 'py', re: /\bChatAnthropic\s*\(/g, label: 'ChatAnthropic(…)', url: 'KEYONE_ANTHROPIC_BASE_URL', urlKey: 'anthropic_api_url', keyKey: 'api_key' },
]

// Find the matching ')' for the '(' at index i (string-aware, good enough for constructor calls)
function closeParen(src, i) {
  let depth = 0, quote = null
  for (let j = i; j < src.length; j++) {
    const c = src[j]
    if (quote) { if (c === '\\') j++; else if (c === quote) quote = null; continue }
    if (c === '"' || c === "'" || c === '`') quote = c
    else if (c === '(' || c === '{' || c === '[') depth++
    else if (c === ')' || c === '}' || c === ']') { depth--; if (depth === 0) return j }
  }
  return -1
}

function rewriteFile(file, apply) {
  const src = fs.readFileSync(file, 'utf8')
  const lang = file.endsWith('.py') ? 'py' : 'js'
  let out = src, changes = [], needsOs = false
  for (const site of SITES.filter(s => s.lang === lang)) {
    let m
    site.re.lastIndex = 0
    const positions = []
    while ((m = site.re.exec(out))) positions.push(m.index + m[0].length - 1)
    for (const open of positions.reverse()) {
      const close = closeParen(out, open)
      if (close < 0) continue
      const inner = out.slice(open + 1, close)
      if (inner.includes('KEYONE_') ) continue                       // already wired
      if (lang === 'js' && /baseURL|anthropicApiUrl/.test(inner)) { changes.push({ site, note: 'has a base URL already, left alone' }); continue }
      if (lang === 'py' && /base_url|anthropic_api_url/.test(inner)) { changes.push({ site, note: 'has a base_url already, left alone' }); continue }
      let replacement
      if (lang === 'js') {
        const inject = site.langchain
          ? `apiKey: process.env.KEYONE_API_KEY, configuration: { baseURL: process.env.${site.url} }`
          : `${site.urlKey}: process.env.${site.url}, ${site.keyKey}: process.env.KEYONE_API_KEY`
        const trimmed = inner.trim()
        if (trimmed === '') replacement = `{ ${inject} }`
        else if (trimmed.startsWith('{')) {
          const body = trimmed.slice(1, trimmed.lastIndexOf('}')).trim()
          const keep = body.replace(/(^|,)\s*apiKey\s*:[^,}]*/g, '$1').replace(/^,|,$/g, '').trim()
          replacement = `{ ${inject}${keep ? `, ${keep}` : ''} }`
        } else { changes.push({ site, note: 'options are not an object literal, edit by hand' }); continue }
      } else {
        const inject = `${site.urlKey}=os.environ["${site.url}"], ${site.keyKey}=os.environ["KEYONE_API_KEY"]`
        const keep = inner.replace(/(^|,)\s*api_key\s*=[^,)]*/g, '$1').replace(/^\s*,|,\s*$/g, '').trim()
        replacement = `${inject}${keep ? `, ${keep}` : ''}`
        needsOs = true
      }
      out = out.slice(0, open + 1) + replacement + out.slice(close)
      changes.push({ site, note: 'rewired' })
    }
  }
  if (needsOs && !/^\s*import os\b/m.test(out)) out = `import os\n${out}`
  if (apply && out !== src) fs.writeFileSync(file, out)
  return changes
}

// ---------------------------------------------------------------- test call
async function testCall(key) {
  const r = await fetch(`${base}/api/proxy/openai`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'cheapest', max_tokens: 300, messages: [{ role: 'user', content: 'Reply with the word "connected".' }] }),
  })
  const text = await r.text()
  let data = {}; try { data = JSON.parse(text) } catch {}
  if (!r.ok) throw new Error(data.message || (data.error && data.error.message) || data.error || `HTTP ${r.status}`)
  const reply = data.choices && data.choices[0] && data.choices[0].message ? String(data.choices[0].message.content || '').trim() : ''
  const status = await fetch(`${base}/api/proxy/status`, { headers: { Authorization: `Bearer ${key}` } }).then(x => x.ok ? x.json() : null).catch(() => null)
  return { reply, cost: r.headers.get('x-cost-usd'), model: (r.headers.get('x-model-resolved') || '').split('->').pop().trim() || data.model, status }
}

// ---------------------------------------------------------------- commands
async function setup() {
  log(`\nkey.one setup · ${base}\n`)
  const envFile = findEnvFile()
  const key = await resolveKey(envFile)
  if (!key) fail('no project key. Get one from the key.one dashboard (a project\'s page), then run again with --key, KEYONE_API_KEY, or --from-clipboard.')

  // 1. env
  writeEnv(envFile, {
    KEYONE_API_KEY: key,
    KEYONE_OPENAI_BASE_URL: `${base}/api/proxy/openai/v1`,
    KEYONE_ANTHROPIC_BASE_URL: `${base}/api/proxy/anthropic`,
    KEYONE_PERPLEXITY_BASE_URL: `${base}/api/proxy/perplexity`,
  })
  ok(`wrote ${ENV_NAMES.length} variables to ${envFile}`)
  ensureGitignored(envFile)
  updateEnvExample()

  // 2. SDKs
  const sdks = detectSdks()
  const apply = flag('apply')
  if (sdks.size) ok(`SDKs in this project: ${[...sdks].join(', ')}`)
  else warn('no OpenAI / Anthropic SDK found in package.json or requirements; skipping the code scan')
  if (sdks.size) {
    const files = walk(cwd, [])
    let rewired = 0, manual = []
    for (const f of files) {
      const changes = rewriteFile(f, apply)
      for (const c of changes) {
        const rel = path.relative(cwd, f)
        if (c.note === 'rewired') { rewired++; log(`    ${apply ? 'rewired' : 'would rewire'}  ${rel}  ${c.site.label}`) }
        else manual.push(`${rel}: ${c.site.label} ${c.note}`)
      }
    }
    if (rewired && !apply) warn(`run again with --apply to make those edits, or set them by hand:`)
    if ((rewired && !apply) || manual.length) {
      log(`      OpenAI:    baseURL: process.env.KEYONE_OPENAI_BASE_URL, apiKey: process.env.KEYONE_API_KEY`)
      log(`      Anthropic: baseURL: process.env.KEYONE_ANTHROPIC_BASE_URL, apiKey: process.env.KEYONE_API_KEY`)
      log(`      Python:    base_url=os.environ["KEYONE_OPENAI_BASE_URL"], api_key=os.environ["KEYONE_API_KEY"]`)
    }
    for (const m of manual) warn(m)
    if (!rewired && !manual.length) ok('no constructor sites to change (or everything already points at key.one)')
  }

  // 3. test call
  await runTest(key)
  log(`\n  Production hosts (Vercel etc.) need the same ${ENV_NAMES.length} variables set by hand.\n`)
}

async function runTest(key) {
  process.stdout.write('  … test call on the cheapest model ')
  try {
    const t = await testCall(key)
    const where = t.status && t.status.project ? ` · ${t.status.client ? t.status.client.name + ' / ' : ''}${t.status.project.name}` : ''
    log(`\n  ✓ connected: "${t.reply.slice(0, 40)}" · ${t.model} · $${Number(t.cost || 0).toFixed(6)}${where}`)
  } catch (e) {
    log('')
    fail(`test call failed: ${e.message}`)
  }
}

async function test() {
  const envFile = findEnvFile()
  const key = await resolveKey(envFile)
  if (!key) fail('no project key found')
  await runTest(key)
}

;(async () => {
  if (flag('help') || command === 'help') {
    log('usage: keyone-cli [setup|test] [--key kone_live_…] [--from-clipboard] [--apply] [--base-url https://getkeyone.com]')
    return
  }
  if (command === 'setup') await setup()
  else if (command === 'test') await test()
  else fail(`unknown command ${command}`)
})().catch(e => fail(e.message))
