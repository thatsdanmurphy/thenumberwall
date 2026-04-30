import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import './AppHeader.css'

export default function AppHeader({ back = null, title = 'THE NUMBER WALL', tagline = 'Legends live here.', badge = null }) {
  const navigate = useNavigate()

  return (
    <header className="app-header">
      {/* Brand row — always present: wordmark + tagline left, nav right */}
      <div className="app-header__brand-row">
        <div className="app-header__brand">
          <Link to="/" className="app-header__wordmark-link">
            <span className="app-header__wordmark">{title}</span>
          </Link>
          {badge && <span className="app-header__badge">{badge}</span>}
          {tagline && <span className="app-header__tagline">{tagline}</span>}
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

      {/* Back row — only on sub-pages, sits below the brand row */}
      {back && (
        <div className="app-header__back-row">
          <button
            className="app-header__back"
            onClick={back.onClick}
            aria-label="Go back"
          >
            <ArrowLeft size={14} /> {back.label}
          </button>
        </div>
      )}
    </header>
  )
}
