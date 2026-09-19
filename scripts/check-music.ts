/**
 * One runnable check for the cue-restart rule.
 *
 * The bug this guards against is subtle and audible: ducking asks for the
 * ambient bed's level every time JARVIS stops speaking, and an ended media
 * element is also a paused one — so "start it if it is paused" restarted the
 * opening music once per sentence. The guard has to refuse a spent cue while
 * still allowing the two deliberate restarts, and those two seek to zero first,
 * which is asynchronous: `ended` can still read true a line later.
 *
 * There is no DOM here, so this exercises the decision itself against a stub
 * that reproduces exactly that timing.
 *
 *   npx tsx scripts/check-music.ts
 */

import assert from 'node:assert/strict'

/** The rule as music.ts applies it, kept in one expression on both sides. */
const shouldPlay = (s: {
  to: number
  paused: boolean
  ended: boolean
  finished: boolean
  restart: boolean
}) => {
  const spent = !s.restart && (s.ended || s.finished)
  return s.to > 0 && s.paused && !spent
}

const base = { to: 0.3, paused: true, ended: false, finished: false, restart: false }

// A bed that should be running and simply is not: start it.
assert.equal(shouldPlay(base), true, 'a paused, unspent cue should start')

// Already playing: leave it alone.
assert.equal(shouldPlay({ ...base, paused: false }), false)

// Fading to silence never starts anything.
assert.equal(shouldPlay({ ...base, to: 0 }), false)

// The bug: ended and paused, asked for its level again on an unduck.
assert.equal(
  shouldPlay({ ...base, ended: true }),
  false,
  'an ended cue must not be restarted by a level request',
)

// The old guard still works where the event was observed.
assert.equal(shouldPlay({ ...base, finished: true }), false)

// And the case the old guard missed: the event never fired, so `finished` is
// empty, but the element knows it is done.
assert.equal(
  shouldPlay({ ...base, ended: true, finished: false }),
  false,
  'ended must be enough on its own — this is the regression',
)

// A deliberate replay wins over both, including while the seek to zero has not
// landed yet and `ended` still reads true.
assert.equal(
  shouldPlay({ ...base, ended: true, finished: true, restart: true }),
  true,
  'an explicit restart must not be blocked by a pending seek',
)

console.log('OK — spent cues stay silent, deliberate restarts still play')
