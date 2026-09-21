/**
 * One runnable check for the speaking-rate clamp.
 *
 * Every provider takes a different range — ElevenLabs refuses anything outside
 * 0.7 to 1.2 with a 422, Fish takes 0.5 to 2.0 — so the single number the
 * browser sends has to be narrowed per provider. Forward it raw and the slider
 * silently stops producing audio at one end of its travel, which reads as
 * "the voice broke" rather than "that value was out of range".
 *
 * So: ask for absurd rates and require speech back anyway.
 *
 *   node scripts/check-speed.mjs        (needs the bridge running)
 */

import assert from 'node:assert/strict'

const BASE = process.env.JARVIS_BRIDGE_URL ?? 'http://localhost:8787'
const TEXT = 'Senhor, a bateria está em onze por cento.'

const health = await fetch(`${BASE}/health`).catch(() => null)
if (!health?.ok) {
  console.error(`no bridge at ${BASE} — start it with \`npm run bridge\` first`)
  process.exit(1)
}
if (!(await health.json()).tts) {
  console.log('OK — no cloud voice configured, nothing to clamp')
  process.exit(0)
}

const ask = async (speed) => {
  const res = await fetch(`${BASE}/tts`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text: TEXT, lang: 'pt', ...(speed === undefined ? {} : { speed }) }),
  })
  if (res.headers.get('x-jarvis-tts') === 'quota') return 'quota'
  // Read the body once: an assert message that reads it would consume it on
  // the success path too, and then there is nothing left to measure.
  const bytes = await res.arrayBuffer()
  assert.ok(
    res.ok,
    `speed ${speed} was refused: ${res.status} ${Buffer.from(bytes).toString('utf8').slice(0, 120)}`,
  )
  return bytes.byteLength
}

// Both ends of the slider, and well past them: all must come back as audio.
for (const speed of [undefined, 0.7, 1, 1.6, 0.01, 99]) {
  const out = await ask(speed)
  if (out === 'quota') {
    console.log('OK — out of credit, so the clamp cannot be exercised today')
    process.exit(0)
  }
  assert.ok(out > 1000, `speed ${speed} returned ${out} bytes, not audio`)
}

// Garbage must be ignored rather than forwarded.
for (const speed of [null, 'fast', 0, -1, Number.NaN]) {
  const out = await ask(speed)
  assert.ok(out === 'quota' || out > 1000, `speed ${JSON.stringify(speed)} broke synthesis`)
}

console.log('OK — every rate from 0.01 to 99, and junk, still produces speech')
