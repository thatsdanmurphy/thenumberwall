import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import './AppHeader.css'

/**
 * AppHeader — persistent compact nav bar.
 *
 * THE NUMBER WALL wordmark always shows — never replaced by a page title.
 * On the homepage (no back prop): wordmark + tagline stacked left, nav right.
 * On sub-pages (back prop set): single compact row — wordmark · ← back label  nav.
 * Sticky so the mark persists as the user scrolls.
 *
 * Props:
 *   back     { label, onClick } | null  — shows inline back link
 *   tagline  string             — only renders when no back (homepage)
 *   badge    string | null      — small badge beneath wordmark (e.g. "BETA")
 *   title    string | null      — accepted but ignored; pages own their headings
 */
export default function AppHeader({
  back    = null,
  tagline = 'Legends live here.',
  badge   = null,
  title   = null,  // eslint-disable-line no-unused-vars
}) {
  const navigate = useNavigate()

  return (
    <header className={`app-header${back ? ' app-header--sub' : ''}`}>
      <div className="app-header__row">

        {/* ── Brand block — wordmark always, tagline on homepage only ── */}
        <div className="app-header__brand">
          <Link to="/" className="app-header__wordmark-link">
            <span className="app-header__wordmark">THE NUMBER WALL</span>
          </Link>
          {badge && <span className="app-header__badge">{badge}</span>}
          {!back && tagline && (
            <span className="app-header__tagline">{tagline}</span>
          )}
        </div>

        {/* ── Back link — inline, sub-pages only ──────────────────────── */}
        {back && (
          <>
            <span className="app-header__sep" aria-hidden="true">·</span>
            <button
              className="app-header__back"
              onClick={back.onClick}
              aria-label="Go back"
            >
              <ArrowLeft size={12} strokeWidth={2.5} />
              {back.label}
            </button>
          </>
        )}

        {/* ── Flex spacer ──────────────────────────────────────────────── */}
        <div className="app-header__flex" />

        {/* ── Nav ─────────────────────────────────────────────────────── */}
        <nav className="app-header__nav">
          <button className="app-header__nav-link" onClick={() => navigate('/my-wall')}>
            My Walls
          </button>
          <button className="app-header__nav-link" onClick={() => navigate('/walls')}>
            Team Walls
          </button>
        </nav>

      </div>
    </header>
  )
}
