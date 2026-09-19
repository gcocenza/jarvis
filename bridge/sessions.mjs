/**
 * The conversations JARVIS has held, as a small file of its own.
 *
 * Auto-resume (see RESUME_FILE in server.mjs) already brings back the last
 * conversation, which covers a bridge restart but not the case that actually
 * comes up: several conversations on the go, and wanting the one from this
 * morning rather than the one from ten minutes ago.
 *
 * This list is written from what JARVIS itself started rather than scraped out
 * of Claude Code's transcript directory. That directory is keyed by working
 * directory, so in isolated mode every session run from the home directory
 * lands in the same folder whether JARVIS opened it or not, and there is no
 * honest way to tell them apart from the outside. Keeping our own list costs
 * one small file and is never wrong about whose session it is.
 *
 * It lives here rather than in server.mjs so it can be checked without booting
 * a bridge — see scripts/check-sessions.mjs.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

/** Past this, the list is a graveyard rather than a menu. */
export const SESSIONS_KEPT = 20

/** Every recorded conversation, newest first. Never throws: a missing or
 *  corrupt file is simply no history, which is a fine thing to start from. */
export function readSessions(file) {
  try {
    const parsed = JSON.parse(readFileSync(file, 'utf8'))
    return Array.isArray(parsed)
      ? parsed.filter((x) => x && typeof x.id === 'string')
      : []
  } catch {
    return []
  }
}

/**
 * Record that a session exists, or update the one already recorded.
 *
 * `patch` carries whatever is known at the time: nothing at all when the SDK
 * first announces an id, a title once the user has actually said something.
 * Merging rather than replacing is what lets the title arrive a turn later
 * without losing anything, and every call refreshes `at`, so the conversation
 * being had now sorts to the top where it belongs.
 *
 * Returns the new list, so a caller can hand it straight to the browser.
 */
export function noteSession(file, id, patch = {}) {
  if (!id) return readSessions(file)
  const existing = readSessions(file)
  const prev = existing.find((x) => x.id === id) ?? {}
  const entry = { ...prev, ...patch, id, at: Date.now() }
  // The title is whatever opened the conversation, not whatever was said in it
  // last — a list that renames itself every turn is not one you can find
  // anything in.
  if (prev.title) entry.title = prev.title
  const next = [entry, ...existing.filter((x) => x.id !== id)].slice(0, SESSIONS_KEPT)
  try {
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, JSON.stringify(next))
  } catch (err) {
    console.warn('[jarvis] could not record the session:', err?.message ?? err)
  }
  return next
}
