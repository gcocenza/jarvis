/**
 * One runnable check for the ticketed streaming path.
 *
 * The page no longer downloads a sentence before playing it: it posts the text,
 * gets a ticket, and points an <audio> element at a GET that streams. Three
 * things have to hold, and none is visible from the code alone.
 *
 *   - the ticket endpoint answers immediately, before any generation
 *   - the stream endpoint actually streams (first byte well before the last)
 *   - a ticket is single-use, because it stands for one sentence about to be
 *     spoken, not a URL anyone may replay
 *
 *   node scripts/check-stream.mjs        (needs the bridge running)
 */

import assert from 'node:assert/strict'

const BASE = process.env.JARVIS_BRIDGE_URL ?? 'http://localhost:8787'
const TEXT =
  'Senhor, são doze e cinquenta. A bateria está em onze por cento e há três mensagens não lidas.'

const health = await fetch(`${BASE}/health`).catch(() => null)
if (!health?.ok) {
  console.error(`no bridge at ${BASE} — start it with \`npm run bridge\` first`)
  process.exit(1)
}
if (!(await health.json()).tts) {
  console.log('OK — no cloud voice configured, nothing to stream')
  process.exit(0)
}

const t0 = performance.now()
const prep = await fetch(`${BASE}/tts/prepare`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ text: TEXT, lang: 'pt', speed: 1 }),
})
assert.ok(prep.ok, `/tts/prepare answered ${prep.status}`)
const { id } = await prep.json()
assert.ok(id, 'no ticket returned')
const prepareMs = performance.now() - t0

// The ticket must cost nothing: it hands back an id, it does not synthesise.
assert.ok(prepareMs < 500, `/tts/prepare took ${Math.round(prepareMs)}ms — it should not generate`)

const t1 = performance.now()
const stream = await fetch(`${BASE}/tts/stream/${id}`)
assert.ok(stream.ok, `/tts/stream answered ${stream.status}`)
const firstByteMs = performance.now() - t1
let bytes = 0
for await (const chunk of stream.body) bytes += chunk.length
const totalMs = performance.now() - t1

assert.ok(bytes > 1000, `expected audio, got ${bytes} bytes`)
assert.ok(
  firstByteMs < totalMs,
  `first byte at ${Math.round(firstByteMs)}ms, last at ${Math.round(totalMs)}ms — not streaming`,
)

const replay = await fetch(`${BASE}/tts/stream/${id}`)
assert.equal(replay.status, 404, 'a ticket must not be reusable')

console.log(
  `OK — ticket in ${Math.round(prepareMs)}ms, first byte ${Math.round(firstByteMs)}ms, ` +
    `all ${bytes} bytes by ${Math.round(totalMs)}ms, ticket spent`,
)
