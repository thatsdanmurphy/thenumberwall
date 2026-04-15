/**
 * BEHIND THE CURTAINS — landing
 *
 * One card per section. "Live" means the page ships real content. "Sketch"
 * means the intent is captured but the work isn't built yet — these are
 * promissory notes, placed on purpose so nothing falls out of view.
 */

import { Link } from 'react-router-dom'
import { SECTIONS } from './BehindTheCurtainsLayout.jsx'

// Only /design is live in v1. The rest are sketches — on purpose.
const LIVE = new Set([
  '/behindthecurtains/design',
  '/behindthecurtains/sitemap',
  '/behindthecurtains/flows',
])

export default function BehindTheCurtainsHome() {
  return (
    <div className="btc-home">
      <div className="btc-home__eyebrow">Internal · not in nav</div>
      <h1 className="btc-home__title">BEHIND THE CURTAINS</h1>
      <p className="btc-home__sub">Everything worth keeping track of.</p>
      <p className="btc-home__lede">
        A home for the intentions, systems, and data that keep The Number Wall
        coherent as it grows. Everything here is public but unlisted. It's not
        the product — it's how the product is made. If a screen, flow, token,
        or insight belongs to the making of this, it belongs here.
      </p>

      <div className="btc-home__grid">
        {SECTIONS.map(s => {
          const isLive = LIVE.has(s.to)
          return (
            <Link key={s.to} to={s.to} className="btc-home__card">
              <span className="btc-home__card-label">{s.label}</span>
              <span className="btc-home__card-note">{s.note}</span>
              <span className={`btc-home__card-status ${isLive ? 'is-live' : ''}`}>
                {isLive ? 'LIVE' : 'SKETCH'}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
