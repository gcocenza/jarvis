/**
 * One runnable check for the speech-budget endpoint and the quota signal.
 *
 * Two things have to hold for the automute to work, and neither is obvious
 * from reading the code: /credits has to report a number the bar can use, and
 * a refusal for being out of credit has to be distinguishable from a refusal
 * for a bad key. ElevenLabs answers 401 to both, so the bridge marks the first
 * with a header — and if that header ever stops arriving, the voice silently
 * falls back to a voice the user rejected instead of muting.
 *
 *   node scripts/check-credits.mjs        (needs the bridge running)
 */

import assert from 'node:assert/strict'

const BASE = process.env.JARVIS_BRIDGE_URL ?? 'http://localhost:8787'

const health = await fetch(`${BASE}/health`).catch(() => null)
if (!health?.ok) {
  console.error(`no bridge at ${BASE} — start it with \`npm run bridge\` first`)
  process.exit(1)
}

const res = await fetch(`${BASE}/credits`)
assert.equal(res.status, 200, '/credits should answer 200 even with nothing to report')
const body = await res.json()

if (body.provider === null) {
  console.log('OK — no metered speech engine configured, nothing to report')
  process.exit(0)
}

if (body.unavailable !== undefined) {
  console.log(
    `OK — ${body.provider} configured but the quota is not readable (${body.unavailable}); ` +
      'the key needs the user_read scope for the budget bar to appear',
  )
  process.exit(0)
}

assert.equal(typeof body.used, 'number', 'used must be a number')
assert.equal(typeof body.limit, 'number', 'limit must be a number')
assert.ok(body.limit > 0, 'limit must be positive for the bar to mean anything')
assert.ok(body.used >= 0, 'used must not be negative')

const spent = body.used >= body.limit
console.log(
  `/credits: ${body.used.toLocaleString()} / ${body.limit.toLocaleString()} used` +
    (body.resetAt ? ` · resets ${new Date(body.resetAt).toLocaleDateString()}` : ''),
)

// Only meaningful once the budget is actually spent: ask for speech and check
// the bridge labels the refusal as a quota problem rather than a key problem.
if (spent) {
  const tts = await fetch(`${BASE}/tts`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text: 'teste', lang: 'pt' }),
  })
  assert.ok(!tts.ok, 'a spent budget must not return audio')
  assert.equal(
    tts.headers.get('x-jarvis-tts'),
    'quota',
    'a refusal for spent credit must be labelled, or the app cannot tell it from a bad key',
  )
  console.log('OK — budget spent, and the refusal is labelled `x-jarvis-tts: quota`')
} else {
  console.log('OK — budget readable; the quota label is only exercised once it runs out')
}
