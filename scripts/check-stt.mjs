/**
 * One runnable check for the /stt provider chain.
 *
 * The bug this guards against was invisible from the outside: a cloud key that
 * was present but could not transcribe, no fallback behind it, and every
 * utterance dying on a 401 that only the network tab ever saw. So the check is
 * exactly that scenario — boot the bridge with deliberately broken cloud keys
 * and assert it still returns words, which it can only do by falling through to
 * the local worker.
 *
 *   node scripts/check-stt.mjs
 *
 * macOS only (uses `say` to synthesise the fixture). Needs faster-whisper.
 */

import { spawn, spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const PORT = 8791
const SPOKEN = 'Jarvis, what is the weather in London'

const dir = mkdtempSync(join(tmpdir(), 'jarvis-stt-check-'))
const wav = join(dir, 'speech.wav')
const said = spawnSync('say', ['-o', wav, '--data-format=LEI16@16000', SPOKEN])
if (said.status !== 0) {
  console.error('could not synthesise the fixture — `say` is macOS only')
  process.exit(1)
}

const bridge = spawn('node', ['bridge/server.mjs'], {
  cwd: ROOT,
  // Its own process group: the bridge spawns a Python worker, and killing only
  // the parent leaves that worker orphaned and holding a model in memory.
  detached: true,
  env: {
    ...process.env,
    JARVIS_BRIDGE_PORT: String(PORT),
    // Both cloud providers configured and both broken. This is the case that
    // used to leave JARVIS deaf while /health insisted it was listening.
    GROQ_API_KEY: 'gsk_deliberately_invalid',
    ELEVENLABS_API_KEY: 'sk_deliberately_invalid',
  },
  stdio: ['ignore', 'pipe', 'inherit'],
})

let log = ''
bridge.stdout.on('data', (d) => {
  log += d.toString()
  process.stdout.write(d)
})

const base = `http://localhost:${PORT}`
const until = async (label, fn, ms = 90_000) => {
  const deadline = Date.now() + ms
  for (;;) {
    try {
      if (await fn()) return
    } catch {
      /* not up yet */
    }
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${label}`)
    await new Promise((r) => setTimeout(r, 500))
  }
}

try {
  // The local worker loads its model after boot, so wait for the chain to be
  // genuinely complete rather than racing it.
  await until('local STT worker', () => log.includes('local STT ready'))

  const health = await (await fetch(`${base}/health`)).json()
  assert.equal(health.stt, true, '/health should report stt with only a local worker')

  const res = await fetch(`${base}/stt`, {
    method: 'POST',
    headers: { 'content-type': 'audio/wav' },
    body: readFileSync(wav),
  })
  // Read the body once: an assert message that calls res.text() would consume
  // it on the success path too, and then res.json() has nothing left to parse.
  const body = await res.text()
  assert.equal(res.status, 200, `/stt returned ${res.status}: ${body}`)
  const { text } = JSON.parse(body)
  assert.match(text, /jarvis/i, `expected the spoken words back, got ${JSON.stringify(text)}`)

  // Silence must still short-circuit rather than reach a provider.
  const quiet = await fetch(`${base}/stt`, {
    method: 'POST',
    headers: { 'content-type': 'audio/wav' },
    body: Buffer.alloc(64),
  })
  assert.deepEqual(await quiet.json(), { text: '' }, 'a tiny clip should return empty')

  console.log(`\nOK — fell back to the local worker with both cloud keys broken: "${text}"`)
} finally {
  try {
    process.kill(-bridge.pid, 'SIGKILL')
  } catch {
    /* already gone */
  }
}
