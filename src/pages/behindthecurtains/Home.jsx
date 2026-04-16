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
  '/behindthecurtains/engineering',
  '/behindthecurtains/workflow',
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

      <div className="btc-home__north-star">
        The Number Wall exists because jersey numbers mean something and nobody's built a place for that meaning to live. The product wins when a 12-year-old gets assigned #12 and can instantly see every legend who wore it — and feel like they're part of something bigger than a roster.
      </div>

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

      <div className="btc-home__roadmap">
        <h2 className="btc-home__roadmap-title">WHAT'S NEXT</h2>
        <p className="btc-home__roadmap-line">
          <strong>Team walls are the growth thesis.</strong> Alumni sharing their high school wall is how the product spreads —
          not marketing, not SEO. If a BC High alum sends their wall to five teammates, that's five people who
          discover the global wall through the back door.
        </p>
        <p className="btc-home__roadmap-line">
          <strong>Timeline depth is the retention thesis.</strong> The wall gets you in. The legend timeline — game-by-game
          career waveforms — is what makes you stay. Brady's career as a glow score is something you can't get anywhere else.
        </p>
        <p className="btc-home__roadmap-line">
          <strong>The things we're not building:</strong> social features, comments, user profiles, gamification.
          The product is a shrine, not a social network. Adding a follow button would be like putting a chat room in a museum.
        </p>
      </div>
    </div>
  )
}
