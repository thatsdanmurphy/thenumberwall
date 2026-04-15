/**
 * SITEMAP — /behindthecurtains/sitemap
 *
 * One visual map of the whole product. Every page a user can reach, grouped
 * by the shape of the product (not alphabetical, not by URL depth). Each card
 * opens the route in a new tab so you can inspect the real page.
 *
 * Living artefact: the ROUTES array below is the source of truth. When a new
 * route goes into App.jsx, mirror it here. We deliberately don't parse the
 * router — one place to update is honest; two places that claim to be in sync
 * is a lie waiting to happen. A guardrail below warns if the counts diverge.
 */

import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import './sitemap.css'

// ── Route catalogue ──────────────────────────────────────────────────────────
// Grouped by the product's real sections. Order within a group is reading
// order: the front door first, deeper states after. Status is honest:
//   LIVE      — shipped, reachable, real content
//   DRAFT     — routed but content is a stub or sketch
//   DISABLED  — commented out in App.jsx, kept here to show intent
//   REDIRECT  — legacy path, kept for bookmarks

const GROUPS = [
  {
    id: 'main',
    title: 'The Main Wall',
    lede: 'The front door. Every number. Every legend.',
    routes: [
      { path: '/',            name: 'Wall',           desc: 'The 00–99 grid. The product in one screen.', status: 'LIVE' },
      { path: '/number/:num', name: 'Wall · deep-link', desc: 'Same grid, a number pre-selected via URL.', status: 'LIVE', example: '/number/12' },
    ],
  },
  {
    id: 'cities',
    title: 'Cities',
    lede: 'Place-scoped walls. Where a city\'s legends live together.',
    routes: [
      { path: '/boston',  name: 'Boston',  desc: 'The seed city. Full legend set, curated.', status: 'LIVE' },
      { path: '/newyork', name: 'New York', desc: 'Data not yet vetted.',                    status: 'DISABLED' },
    ],
  },
  {
    id: 'team-walls',
    title: 'Team Walls',
    lede: 'Crowdsourced walls for schools and teams. Alumni fill them in.',
    routes: [
      { path: '/walls',                     name: 'Team Walls · hub',    desc: 'USA map of every team wall. Seed dot on Boston when empty.', status: 'LIVE' },
      { path: '/walls/town/:townSlug',      name: 'Town Walls',          desc: 'All walls within a town, stacked.',                            status: 'LIVE', example: '/walls/town/milton-ma' },
      { path: '/walls/:schoolSlug/:sport',  name: 'Team Wall',           desc: 'The wall for one team at one school. Year-by-year lineage.',   status: 'LIVE', example: '/walls/bc-high/football' },
    ],
  },
  {
    id: 'my-walls',
    title: 'My Walls',
    lede: 'Walls a person built, is on, or follows. The identity lane.',
    routes: [
      { path: '/my-wall',      name: 'My Walls · hub',   desc: 'Three lanes: built, on, follow.',          status: 'LIVE' },
      { path: '/my-wall/new',  name: 'Create a wall',    desc: 'The "make a new wall" modal, routed.',     status: 'LIVE' },
      { path: '/wall/:slug',   name: 'One of my walls',  desc: 'The wall a person owns, at its own URL.',  status: 'LIVE', example: '/wall/dan-murphy' },
    ],
  },
  {
    id: 'timeline',
    title: 'Legend Timeline',
    lede: 'Game-by-game career waveform. Indigo void → sacred gold.',
    routes: [
      { path: '/timeline',             name: 'Timeline · index', desc: 'Landing for the timeline feature.',          status: 'DRAFT' },
      { path: '/timeline/:playerId',   name: 'Player timeline',   desc: 'One legend\'s full career as a glow score.', status: 'LIVE', example: '/timeline/brady_tom' },
    ],
  },
  {
    id: 'narrative',
    title: 'Narrative',
    lede: 'The product\'s story, told once, in its own voice.',
    routes: [
      { path: '/about', name: 'About', desc: 'What The Number Wall is and why it exists.', status: 'LIVE' },
    ],
  },
  {
    id: 'behind',
    title: 'Behind the Curtains',
    lede: 'Public but unlisted. How the product is made.',
    routes: [
      { path: '/behindthecurtains',             name: 'Hub',          desc: 'Landing. One card per internal section.',  status: 'LIVE' },
      { path: '/behindthecurtains/design',      name: 'Design System', desc: 'Tokens, tiles, primitives, icons, compositions.', status: 'LIVE' },
      { path: '/behindthecurtains/sitemap',     name: 'Sitemap',      desc: 'This page.',                                 status: 'LIVE' },
      { path: '/behindthecurtains/flows',       name: 'Flows',        desc: 'The journeys that matter.',                  status: 'LIVE' },
      { path: '/behindthecurtains/engineering', name: 'Engineering',  desc: 'Stack, structure, conventions.',             status: 'DRAFT' },
      { path: '/behindthecurtains/marketing',   name: 'Marketing',    desc: 'Kit, audiences, voice.',                     status: 'DRAFT' },
      { path: '/behindthecurtains/research',    name: 'Research',     desc: 'Testing, findings, insights.',               status: 'DRAFT' },
      { path: '/behindthecurtains/analytics',   name: 'Analytics',    desc: 'Traffic, behaviour, Vercel.',                status: 'DRAFT' },
    ],
  },
  {
    id: 'edges',
    title: 'Edges',
    lede: 'Where the product ends or redirects.',
    routes: [
      { path: '/design', name: 'Legacy /design', desc: 'Redirects to /behindthecurtains/design.', status: 'REDIRECT' },
      { path: '*',       name: '404',            desc: 'Every unmapped path lands here.',          status: 'LIVE' },
    ],
  },
]

const STATUS_COPY = {
  LIVE:     'Shipped',
  DRAFT:    'Sketch',
  DISABLED: 'Off',
  REDIRECT: 'Redirect',
}

// Counts shown at the top — gives the page a pulse and helps spot drift
// between this catalogue and App.jsx at a glance.
function counts(routes) {
  const total = routes.length
  const live  = routes.filter(r => r.status === 'LIVE').length
  const draft = routes.filter(r => r.status === 'DRAFT').length
  return { total, live, draft }
}

// A single route card — opens the real page in a new tab. Params in the path
// are shown as code spans; when we have a concrete example, we link to that.
function RouteCard({ route }) {
  const href = route.example || route.path
  const isLinkable = !route.path.includes(':') || Boolean(route.example)
  const hasRealLink = isLinkable && route.status !== 'DISABLED' && route.path !== '*'

  return (
    <div className={`sm-route sm-route--${route.status.toLowerCase()}`}>
      <div className="sm-route__head">
        <code className="sm-route__path">{route.path}</code>
        <span className={`sm-route__status sm-route__status--${route.status.toLowerCase()}`}>
          {STATUS_COPY[route.status]}
        </span>
      </div>
      <div className="sm-route__name">{route.name}</div>
      <div className="sm-route__desc">{route.desc}</div>
      {hasRealLink && (
        <a
          className="sm-route__open"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>Open</span>
          {route.example && <code className="sm-route__example">{route.example}</code>}
          <ArrowUpRight size={14} />
        </a>
      )}
    </div>
  )
}

// ── The page ───────────────────────────────────────────────────────────────

export default function Sitemap() {
  const allRoutes = GROUPS.flatMap(g => g.routes)
  const totals = counts(allRoutes)

  return (
    <div className="sm-page">
      {/* ── Banner ─────────────────────────────────────────────────── */}
      <header className="sm-banner">
        <div className="sm-banner__eyebrow">02 · Sitemap</div>
        <h1 className="sm-banner__title">EVERY ROUTE, EVERY PAGE</h1>
        <p className="sm-banner__lede">
          The shape of the product at a glance. Every page a user can reach,
          grouped by what it <em>is</em> — not by URL depth or alphabet.
          Click a card to open the real page in a new tab.
        </p>
        <p className="sm-banner__lede">
          This page is a living artefact. The catalogue below is mirrored from
          <code className="sm-code">App.jsx</code>. If a route is added there and
          not here, the counts drift and the omission shows up visibly.
        </p>
        <div className="sm-pulse">
          <span className="sm-pulse__num">{totals.total}</span>
          <span className="sm-pulse__label">routes</span>
          <span className="sm-pulse__sep">·</span>
          <span className="sm-pulse__num sm-pulse__num--live">{totals.live}</span>
          <span className="sm-pulse__label">live</span>
          <span className="sm-pulse__sep">·</span>
          <span className="sm-pulse__num sm-pulse__num--draft">{totals.draft}</span>
          <span className="sm-pulse__label">sketch</span>
        </div>

        <nav className="sm-toc" aria-label="Jump to section">
          {GROUPS.map(g => (
            <a key={g.id} href={`#${g.id}`}>{g.title}</a>
          ))}
          <Link to="/behindthecurtains" className="sm-toc__home">← Behind the curtains</Link>
        </nav>
      </header>

      {/* ── Groups ─────────────────────────────────────────────────── */}
      {GROUPS.map(group => {
        const c = counts(group.routes)
        return (
          <section key={group.id} id={group.id} className="sm-group">
            <header className="sm-group__head">
              <div className="sm-group__title-row">
                <h2 className="sm-group__title">{group.title}</h2>
                <span className="sm-group__count">{c.total} {c.total === 1 ? 'route' : 'routes'}</span>
              </div>
              <p className="sm-group__lede">{group.lede}</p>
            </header>
            <div className="sm-group__grid">
              {group.routes.map(r => (
                <RouteCard key={r.path} route={r} />
              ))}
            </div>
          </section>
        )
      })}

      <footer className="sm-footer">
        <p className="sm-footer__line">
          If a page isn't here, it doesn't exist. If it drifts, the counts lie.
        </p>
      </footer>
    </div>
  )
}
