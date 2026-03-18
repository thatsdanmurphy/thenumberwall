import { Link } from 'react-router-dom'
import EmailCapture from './EmailCapture.jsx'
import './AppFooter.css'

/**
 * AppFooter — Minimal. About link lives here, not the header.
 * Jersey icon is ornamental — #42 (Jackie Robinson, MLB-wide retired).
 */
function JerseyIcon() {
  return (
    <svg
      className="app-footer__jersey"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 140"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {/* collar */}
      <path
        d="M46 8 C46 8 50 20 60 20 C70 20 74 8 74 8"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      />
      {/* body + sleeves */}
      <path
        d="M46 8 L18 28 L8 52 L24 56 L30 38 L30 124 L90 124 L90 38 L96 56 L112 52 L102 28 L74 8"
        stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"
      />
      {/* number */}
      <text
        x="60" y="88"
        textAnchor="middle" dominantBaseline="middle"
        fontFamily="'Archivo Black', 'Arial Black', sans-serif"
        fontSize="32" fontWeight="900"
        fill="currentColor"
        letterSpacing="-1"
      >42</text>
    </svg>
  )
}

export default function AppFooter() {
  return (
    <footer className="app-footer">
      <JerseyIcon />
      <EmailCapture variant="footer" />
      <div className="app-footer__row">
        <span className="app-footer__copy">© The Number Wall</span>
        <Link to="/about" className="app-footer__link">About</Link>
      </div>
    </footer>
  )
}
