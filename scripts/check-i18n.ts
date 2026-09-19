/**
 * One runnable check for the two-language table.
 *
 * TypeScript already forces every English key to exist in Portuguese, so the
 * gaps it cannot see are the ones worth testing: a key left as the English
 * string because nobody translated it, an empty string, and filler pools that
 * have drifted out of alignment — the pickers choose one index and read it from
 * whichever language is live, so a pool with four lines in one language and
 * three in the other reads the wrong line or none.
 *
 *   npx tsx scripts/check-i18n.ts
 */

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { t, iso, type Lang, type StringKey } from '../src/lib/i18n'
import { working, acknowledge, attention, forTool } from '../src/lib/fillers'

const source = readFileSync(new URL('../src/lib/i18n.ts', import.meta.url), 'utf8')
const keys = [...source.matchAll(/^  ([a-zA-Z]+):/gm)].map((m) => m[1] as StringKey)
assert.ok(keys.length > 40, `expected the whole table, found ${keys.length} keys`)

const LANGS: Lang[] = ['en', 'pt']

/** Words that are the same in both languages, or proper nouns. */
const SHARED = new Set(['ONLINE', 'JARVIS'])

for (const key of new Set(keys)) {
  for (const lang of LANGS) {
    const value = t(lang, key)
    assert.ok(value && value.trim(), `${lang}.${key} is empty`)
  }
  const en = t('en', key)
  const pt = t('pt', key)
  if (!SHARED.has(en)) {
    assert.notEqual(pt, en, `${key} was never translated — still "${en}"`)
  }
}

// The pickers must answer in the language asked for, every time. Drawing
// repeatedly also shakes out a pool whose two halves are different lengths.
for (let i = 0; i < 60; i++) {
  for (const lang of LANGS) {
    for (const [name, line] of [
      ['working', working(lang)],
      ['acknowledge', acknowledge(lang)],
      ['attention', attention(lang)],
      ['forTool/search', forTool(lang, 'mcp__tavily__search')],
      ['forTool/unknown', forTool(lang, 'Bash')],
    ] as const) {
      assert.ok(line && line.trim(), `${name} returned nothing for ${lang}`)
    }
  }
}

// A Portuguese draw must never be an English line, and the other way round.
const ptLines = new Set<string>()
const enLines = new Set<string>()
for (let i = 0; i < 200; i++) {
  ptLines.add(working('pt')).add(acknowledge('pt')).add(attention('pt'))
  enLines.add(working('en')).add(acknowledge('en')).add(attention('en'))
}
for (const line of ptLines) {
  assert.ok(!enLines.has(line), `"${line}" is drawn in both languages`)
}

assert.equal(iso('pt'), 'pt')
assert.equal(iso('en'), 'en')

console.log(`OK — ${new Set(keys).size} keys translated, fillers answer in both languages`)
