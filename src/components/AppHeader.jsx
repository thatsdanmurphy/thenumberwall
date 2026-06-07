import { useNavigate, useLocation, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import './AppHeader.css'

/**
 * AppHeader — sticky nav bar. THE NUMBER WALL + tagline always present.
 *
 * Brand row: wordmark + "Legends live here." left, nav right — on every page.
 * Back row:  ← back label below the brand — only on sub-pages.
 *
 * When liveCount > 0 and not on /live, the nav shows a "Live" text link
 * beside "My Walls" — lightweight, no banner.
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
  const navigate   = useNavigate()
  const location   = useLocation()
  const isOnLive   = location.pathname === '/live'
  const isOnMyWall = location.pathname.startsWith('/my-wall')
  const hasLive    = liveCount > 0

  return (
    <header className={`app-header${back ? ' app-header--sub' : ''}`}>

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
          {/* Live link hidden — page exists at /live for testing but not publicly linked */}
          <button
            className={`app-header__nav-link${isOnMyWall ? ' app-header__nav-link--active' : ''}`}
            onClick={() => navigate('/my-wall')}
            aria-current={isOnMyWall ? 'page' : undefined}
          >
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

    </header>
  )
}
