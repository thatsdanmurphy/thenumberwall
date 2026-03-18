import { Link } from 'react-router-dom'
import './AppFooter.css'

/**
 * AppFooter — Minimal. About link lives here, not the header.
 */
export default function AppFooter() {
  return (
    <footer className="app-footer">
      <span className="app-footer__copy">© The Number Wall</span>
      <Link to="/about" className="app-footer__link">About</Link>
    </footer>
  )
}
