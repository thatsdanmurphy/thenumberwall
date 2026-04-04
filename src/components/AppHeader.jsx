import { useNavigate } from 'react-router-dom'
import './AppHeader.css'

export default function AppHeader({ back = null, title = 'THE NUMBER WALL', tagline = 'Legends live here.' }) {
  const navigate = useNavigate()

  return (
    <header className="app-header">
      <div className="app-header__back-row">
        {back ? (
          <button
            className="app-header__back"
            onClick={back.onClick}
            aria-label="Go back"
          >
            ← {back.label}
          </button>
        ) : <span />}
        <nav className="app-header__nav">
          <button className="app-header__nav-link" onClick={() => navigate('/my-wall')}>
            My Wall <span className="app-header__new-badge">NEW</span>
          </button>
          <button className="app-header__nav-link" onClick={() => navigate('/about')}>
            About
          </button>
        </nav>
      </div>
      <div className="app-header__brand">
        <span className="app-header__wordmark">{title}</span>
        <span className="app-header__tagline">{tagline}</span>
      </div>
    </header>
  )
}
