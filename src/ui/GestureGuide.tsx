import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../store'
import { t as translate, type StringKey } from '../lib/i18n'

/**
 * What your hands can do.
 *
 * A touchless interface has the same problem a voice interface has: no menus,
 * no buttons, nothing on screen that tells you what is possible. The
 * suggestions strip solves that for speech, and this is its equivalent for
 * hands. It stays up for the whole time the camera / hand mode is on, because
 * the moves are easy to forget and there is nothing else on screen naming them;
 * it leaves the instant hand mode is turned off.
 */

const MOVES: { gesture: string; hand: string; does: StringKey }[] = [
  { gesture: 'point', hand: '☝', does: 'gesturePoint' },
  { gesture: 'pinch', hand: '🤏', does: 'gesturePinch' },
  { gesture: 'open', hand: '🖐', does: 'gestureOpen' },
  { gesture: 'peace', hand: '✌', does: 'gesturePeace' },
  { gesture: 'frame', hand: '📐', does: 'gestureFrame' },
]

export function GestureGuide({ live }: { live: boolean }) {
  const lang = useStore((s) => s.lang)
  return (
    <AnimatePresence>
      {live && (
        <motion.div
          className="gguide"
          initial={{ opacity: 0, y: 10, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: 8, filter: 'blur(6px)', transition: { duration: 0.5 } }}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
        >
          <div className="gguide-head">{translate(lang, 'handControl')}</div>
          {MOVES.map((m) => (
            <div key={m.gesture} className="gguide-row">
              <span className="gguide-icon">{m.hand}</span>
              <span className="gguide-name">{m.gesture}</span>
              <span className="gguide-does">{translate(lang, m.does)}</span>
            </div>
          ))}
          <div className="gguide-foot">
            grab a blade by its bar · <kbd>G</kbd> to stop
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
