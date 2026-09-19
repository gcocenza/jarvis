/**
 * One runnable check for the microphone watchdog.
 *
 * The rule that actually needs guarding is the negative one: muting must never
 * be reported as a broken microphone. Muting disables the track, which feeds
 * exact digital silence to every consumer — byte for byte what a dead device
 * produces — so the only thing separating the two is `capturing`, and a
 * regression there turns the warning into noise the user learns to ignore.
 *
 *   npx tsx scripts/check-mic-watchdog.ts
 */

import assert from 'node:assert/strict'
import { micIsDead } from '../src/lib/vad'

const QUIET = 60_000 // comfortably past the warning window
const SILENT = 0 // what a disabled or dead track reads

// Muted, hidden, or ended: silence is expected, so it is never a fault.
assert.equal(
  micIsDead({ capturing: false, energy: SILENT, quietForMs: QUIET }),
  false,
  'a muted microphone must never be reported as dead',
)

// Open, unmuted, and delivering nothing for long enough: that is the fault.
assert.equal(
  micIsDead({ capturing: true, energy: SILENT, quietForMs: QUIET }),
  true,
  'an open microphone delivering hard zeros should be reported',
)

// A quiet room still reads well above zero, and must not trip it.
assert.equal(
  micIsDead({ capturing: true, energy: 0.002, quietForMs: QUIET }),
  false,
  'a quiet room is not a dead microphone',
)

// Not yet long enough to be sure.
assert.equal(
  micIsDead({ capturing: true, energy: SILENT, quietForMs: 5_000 }),
  false,
  'a short silence must not trip the warning',
)

console.log('OK — watchdog fires only on an open, unmuted, silent microphone')
