import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import './AppHeader.css'

/**
 * AppHeader — sticky nav bar. THE NUMBER WALL + tagline always present.
 *
 * Brand row: wordmark + "Legends live here." left, nav right — on every page.
 * Back row:  ← back label below the brand — only on sub-pages.
 *
 * Props:
 *   back   { label, onClick } | null  — shows back row beneath brand
 *   badge  string | null              — small badge beneath wordmark
 *   title  string | null              — accepted but ignored; pages own their headings
 */
export default function AppHeader({ back = null, badge = null, title = null }) {  // eslint-disable-line no-unused-vars
  const navigate = useNavigate()

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
          <button className="app-header__nav-link" onClick={() => navigate('/my-wall')}>
            My Walls
          </button>
          <button className="app-header__nav-link" onClick={() => navigate('/walls')}>
            Team Walls
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
