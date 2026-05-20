import { useNavigate, useLocation, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import './AppHeader.css'

/**
 * AppHeader — sticky nav bar. THE NUMBER WALL + tagline always present.
 *
 * Brand row: wordmark + "Legends live here." left, nav right — on every page.
 * Back row:  ← back label below the brand — only on sub-pages.
 * Live strip: thin heat bar below nav — only when liveCount > 0, hidden on /live itself.
 *
 * Props:
 *   back      { label, onClick } | null  — shows back row beneath brand
 *   badge     string | null              — small badge beneath wordmark
 *   title     string | null              — accepted but ignored; pages own their headings
 *   liveCount number                     — active wall-weight games tonight (0 = hidden)
 */
export default function AppHeader({  // eslint-disable-line no-unused-vars
  back = null,
  badge = null,
  title = null,
  liveCount = 0,
}) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const showLiveStrip = liveCount > 0 && location.pathname !== '/live'

  return (
    <header className={`app-header${back ? ' app-header--sub' : ''}${showLiveStrip ? ' app-header--has-strip' : ''}`}>

      {/* ── Brand row — always present ───────────────────────────────────── */}
      <div className="app-header__brand-row">
        <div className="app-header__brand">
          <Link to="/" className="app-header__wordmark-link">
            <span className="app-header__wordmark">THE NUMBER WALL</span>
          </Link>
          {badge && <span className="app-header__badge">{badge}</span>}
          <span className="app-header__tagline">Legends live here.</span>
        </div>

        <nav className="app-header__nav">
          <button className="app-header__nav-link" onClick={() => navigate('/my-wall')}>
            My Walls
          </button>
        </nav>
      </div>

      {/* ── Back row — sub-pages only ────────────────────────────────────── */}
      {back && (
        <div className="app-header__back-row">
          <button
            className="app-header__back"
            onClick={back.onClick}
            aria-label="Go back"
          >
            <ArrowLeft size={12} strokeWidth={2.5} /> {back.label}
          </button>
        </div>
      )}

      {/* ── Live strip — tonight's games, site-wide teaser ──────────────── */}
      {showLiveStrip && (
        <Link to="/live" className="app-header__live-strip" aria-label={`${liveCount} wall-weight games live tonight`}>
          <span className="app-header__live-strip-dot" aria-hidden="true" />
          <span className="app-header__live-strip-label">LIVE</span>
          <span className="app-header__live-strip-count">
            {liveCount} game{liveCount !== 1 ? 's' : ''} on the wall tonight
          </span>
          <span className="app-header__live-strip-cta">Tonight on the Wall →</span>
        </Link>
      )}

    </header>
  )
}
