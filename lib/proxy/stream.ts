// Pass an upstream server-sent-event stream straight through to the client
// while collecting the events, so usage can be priced once the stream ends.

export function parseSseEvents(text: string): Record<string, unknown>[] {
  const events: Record<string, unknown>[] = []
  for (const line of text.split('\n')) {
    if (!line.startsWith('data:')) continue
    const payload = line.slice(5).trim()
    if (!payload || payload === '[DONE]') continue
    try {
      events.push(JSON.parse(payload))
    } catch {
      // partial or non-JSON line; ignore
    }
  }
  return events
}

// The text a model has produced so far in a stream, across the dialects we
// proxy: Chat Completions chunks, Anthropic content_block_delta events and the
// Responses API's *.delta events.
export function streamedText(events: Record<string, unknown>[]): string {
  let out = ''
  const add = (v: unknown) => { if (typeof v === 'string') out += v }
  for (const e of events) {
    const delta = e.delta as Record<string, unknown> | string | undefined
    if (typeof delta === 'string') add(delta)
    else if (delta) { add(delta.text); add(delta.thinking); add(delta.partial_json) }
    for (const choice of (Array.isArray(e.choices) ? e.choices : []) as Array<{ delta?: Record<string, unknown> }>) {
      add(choice.delta?.content)
      for (const call of (Array.isArray(choice.delta?.tool_calls) ? choice.delta.tool_calls : []) as Array<{ function?: { arguments?: unknown } }>) {
        add(call.function?.arguments)
      }
    }
  }
  return out
}

// onDone runs exactly once, however the stream ends. `cut` is true when it
// ended early: the client hung up, upstream broke, or `deadline` (epoch ms)
// passed. A cut stream is cancelled upstream and still settled, so stopping a
// generation, or outlasting the function's time limit, never makes it free.
export function teeSse(
  upstream: ReadableStream<Uint8Array>,
  onDone: (events: Record<string, unknown>[], cut: boolean) => Promise<void>,
  deadline = Infinity
): ReadableStream<Uint8Array> {
  const reader = upstream.getReader()
  const decoder = new TextDecoder()
  let collected = ''
  let finished = false

  const finish = async (cut: boolean) => {
    if (finished) return
    finished = true
    collected += decoder.decode()
    try {
      await onDone(parseSseEvents(collected), cut)
    } catch (err) {
      console.error('Stream accounting failed:', err)
    }
  }
  const cutShort = async () => {
    await reader.cancel().catch(() => undefined)
    await finish(true)
  }

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      let timer: ReturnType<typeof setTimeout> | undefined
      const timedOut = new Promise<null>(resolve => {
        if (deadline !== Infinity) timer = setTimeout(() => resolve(null), Math.max(0, deadline - Date.now()))
      })
      try {
        const next = await Promise.race([reader.read(), timedOut])
        if (!next) {
          await cutShort()
          controller.close()
        } else if (next.done) {
          await finish(false)
          controller.close()
        } else {
          collected += decoder.decode(next.value, { stream: true })
          controller.enqueue(next.value)
        }
      } catch (err) {
        await finish(true)
        controller.error(err)
      } finally {
        clearTimeout(timer)
      }
    },
    cancel: cutShort,
  })
}
