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

export function teeSse(
  upstream: ReadableStream<Uint8Array>,
  onDone: (events: Record<string, unknown>[]) => Promise<void>
): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder()
  let collected = ''

  return upstream.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        collected += decoder.decode(chunk, { stream: true })
        controller.enqueue(chunk)
      },
      async flush() {
        collected += decoder.decode()
        try {
          await onDone(parseSseEvents(collected))
        } catch (err) {
          console.error('Stream accounting failed:', err)
        }
      },
    })
  )
}
