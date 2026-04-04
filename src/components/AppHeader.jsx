import './AppHeader.css'

export default function AppHeader({ back = null, title = 'THE NUMBER WALL', tagline = 'Legends live here.' }) {
  return (
    <header className="app-header">
      <div className="app-header__back-row">
        {back && (
          <button
            className="app-header__back"
            onClick={back.onClick}
            aria-label="Go back"
          >
            ← {back.label}
          </button>
        )}
      </div>
      <div className="app-header__brand">
        <span className="app-header__wordmark">{title}</span>
        <span className="app-header__tagline">{tagline}</span>
      </div>
    </header>
  )
}
