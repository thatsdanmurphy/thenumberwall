/**
 * BEHIND THE CURTAINS — /behindthecurtains
 *
 * The internal hub. One shell, many rooms. Every page a product builder
 * would want to see without shipping to the main navigation — design,
 * flows, sitemap, engineering, marketing, research, analytics.
 *
 * All routes live under /behindthecurtains/* so the URL itself is the
 * warning: you're behind the scenes, not in the product. Nothing here
 * is linked from the main nav. It's public, but you have to know.
 */

import { NavLink, Outlet, Link } from 'react-router-dom'
import './behindthecurtains.css'

const SECTIONS = [
  { to: '/behindthecurtains/design',      label: 'Design',     note: 'Tokens, tiles, primitives, icons' },
  { to: '/behindthecurtains/sitemap',     label: 'Sitemap',    note: 'Every route, every page' },
  { to: '/behindthecurtains/flows',       label: 'Flows',      note: 'Key user journeys' },
  { to: '/behindthecurtains/engineering', label: 'Engineering', note: 'Stack, structure, conventions' },
  { to: '/behindthecurtains/workflow',    label: 'Workflow',    note: 'Process, rhythm, trade-offs' },
  { to: '/behindthecurtains/marketing',   label: 'Marketing',  note: 'Kit, audiences, voice' },
  { to: '/behindthecurtains/research',    label: 'Research',   note: 'Testing, findings, insights' },
  { to: '/behindthecurtains/analytics',   label: 'Analytics',  note: 'Traffic, behaviour, Vercel' },
]

export default function BehindTheCurtainsLayout() {
  return (
    <div className="btc-shell">
      <aside className="btc-nav" aria-label="Behind the curtains navigation">
        <Link to="/behindthecurtains" className="btc-nav__brand">
          <span className="btc-nav__eyebrow">Internal · not in nav</span>
          <span className="btc-nav__title">BEHIND THE CURTAINS</span>
          <span className="btc-nav__sub">The Number Wall</span>
        </Link>

        <nav className="btc-nav__list">
          {SECTIONS.map(s => (
            <NavLink
              key={s.to}
              to={s.to}
              className={({ isActive }) => `btc-nav__item ${isActive ? 'is-active' : ''}`}
            >
              <span className="btc-nav__item-label">{s.label}</span>
              <span className="btc-nav__item-note">{s.note}</span>
            </NavLink>
          ))}
        </nav>

        <Link to="/" className="btc-nav__return">← Back to the wall</Link>
      </aside>

      <main className="btc-main">
        <Outlet />
      </main>
    </div>
  )
}

export { SECTIONS }
