/**
 * One runnable check for the conversation history.
 *
 * The rules worth guarding are the ones that make the list usable rather than
 * merely present: the conversation you are having sorts first, and its name is
 * the question that opened it rather than the last thing you happened to say.
 * Get the second one wrong and every entry renames itself every turn, which is
 * a list you cannot find anything in.
 *
 *   node scripts/check-sessions.mjs
 */

import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { readSessions, noteSession, SESSIONS_KEPT } from '../bridge/sessions.mjs'

const dir = mkdtempSync(join(tmpdir(), 'jarvis-sessions-'))
const file = join(dir, 'nested', 'sessions.json')

try {
  // No file yet is no history, not a crash.
  assert.deepEqual(readSessions(file), [], 'a missing file should read as no history')

  // An id with no question yet still gets recorded.
  noteSession(file, 'aaa')
  assert.equal(readSessions(file).length, 1)
  assert.equal(readSessions(file)[0].title, undefined)

  // The first question names it.
  noteSession(file, 'aaa', { title: 'what is the weather' })
  assert.equal(readSessions(file)[0].title, 'what is the weather')

  // Later questions must not rename it.
  noteSession(file, 'aaa', { title: 'turn the lights off' })
  assert.equal(
    readSessions(file)[0].title,
    'what is the weather',
    'the title is the opening question, not the latest one',
  )

  // A second conversation takes the top spot while it is the live one...
  noteSession(file, 'bbb', { title: 'book a table' })
  assert.deepEqual(readSessions(file).map((x) => x.id), ['bbb', 'aaa'])

  // ...and going back to the first one puts it back on top, still named.
  noteSession(file, 'aaa')
  const back = readSessions(file)
  assert.deepEqual(back.map((x) => x.id), ['aaa', 'bbb'])
  assert.equal(back[0].title, 'what is the weather', 'resuming must not lose the name')

  // The list is capped, newest kept.
  for (let i = 0; i < SESSIONS_KEPT + 5; i++) noteSession(file, `s${i}`)
  const capped = readSessions(file)
  assert.equal(capped.length, SESSIONS_KEPT, 'the list must stay capped')
  assert.equal(capped[0].id, `s${SESSIONS_KEPT + 4}`, 'newest first')

  console.log('OK — history orders by last use and keeps each conversation its opening name')
} finally {
  rmSync(dir, { recursive: true, force: true })
}
