/**
 * SITEMAP — /behindthecurtains/sitemap
 *
 * A mapping view of the product. Routes drawn as boxes, parent→child
 * relationships drawn as arrows. Groups stay as panels so the shape of the
 * product reads at a glance: Main Wall → Cities → Team Walls → …
 *
 * Living artefact: the GROUPS tree below is the source of truth. When a
 * route is added to App.jsx, mirror it here. Counts show at the top so
 * drift is visible.
 */

import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import './sitemap.css'

// ── Route catalogue ──────────────────────────────────────────────────────────
// `roots` is an array of tree roots per group. A root can have `children`,
// which can themselves have `children`. Depth-first render draws connectors
// automatically. Status is honest:
//   LIVE      — shipped, reachable, real content
//   DRAFT     — routed but content is a stub or sketch
//   DISABLED  — commented out in App.jsx, kept here to show intent
//   REDIRECT  — legacy path, kept for bookmarks

const GROUPS = [
  {
    id: 'main',
    title: 'The Main Wall',
    lede: 'The front door. Every number. Every legend.',
    roots: [
      {
        path: '/', name: 'Wall',
        desc: 'The 00–99 grid. The product in one screen.',
        status: 'LIVE',
        children: [
          { path: '/number/:num', name: 'Deep-link', desc: 'Same grid, a number pre-selected via URL.', status: 'LIVE', example: '/number/12' },
        ],
      },
    ],
  },
  {
    id: 'cities',
    title: 'Cities',
    lede: 'Place-scoped walls.',
    roots: [
      { path: '/boston',  name: 'Boston',  desc: 'Seed city. Full legend set, curated.', status: 'LIVE' },
      { path: '/newyork', name: 'New York', desc: 'Data not yet vetted.',                 status: 'DISABLED' },
    ],
  },
  {
    id: 'team-walls',
    title: 'Team Walls',
    lede: 'Crowdsourced walls for schools and teams.',
    roots: [
      {
        path: '/walls', name: 'Team Walls · hub',
        desc: 'USA map of every team wall.',
        status: 'LIVE',
        children: [
          {
            path: '/walls/town/:townSlug', name: 'Town',
            desc: 'All walls in a town, stacked.',
            status: 'LIVE',
            children: [
              { path: '/walls/:schoolSlug/:sport', name: 'Team Wall', desc: 'One team at one school. Year-by-year lineage.', status: 'LIVE' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'my-walls',
    title: 'My Walls',
    lede: 'Walls a person built, is on, or follows.',
    roots: [
      {
        path: '/my-wall', name: 'My Walls · hub',
        desc: 'Three lanes: built, on, follow.',
        status: 'LIVE',
        children: [
          { path: '/my-wall/new', name: 'Create',     desc: '"Make a new wall" modal, routed.',         status: 'LIVE' },
          { path: '/wall/:slug',  name: 'One of mine', desc: 'A wall a person owns, at its own URL.',  status: 'LIVE' },
        ],
      },
    ],
  },
  {
    id: 'timeline',
    title: 'Legend Timeline',
    lede: 'Game-by-game career waveform.',
    roots: [
      {
        path: '/timeline', name: 'Timeline · index',
        desc: 'Landing for the timeline feature.',
        status: 'DRAFT',
        children: [
          { path: '/timeline/:playerId', name: 'Player timeline', desc: 'A legend\'s full career as a glow score.', status: 'LIVE', example: '/timeline/brady_tom' },
        ],
      },
    ],
  },
  {
    id: 'narrative',
    title: 'Narrative',
    lede: 'The product\'s story, in its own voice.',
    roots: [
      { path: '/about', name: 'About', desc: 'What The Number Wall is and why.', status: 'LIVE' },
    ],
  },
  {
    id: 'behind',
    title: 'Behind the Curtains',
    lede: 'Public but unlisted. How the product is made.',
    roots: [
      {
        path: '/behindthecurtains', name: 'Hub',
        desc: 'Landing. One card per internal section.',
        status: 'LIVE',
        children: [
          { path: '/behindthecurtains/design',      name: 'Design System', desc: 'Tokens, tiles, primitives, icons.',        status: 'LIVE' },
          { path: '/behindthecurtains/sitemap',     name: 'Sitemap',      desc: 'This page.',                                 status: 'LIVE' },
          { path: '/behindthecurtains/flows',       name: 'Flows',        desc: 'The journeys that matter.',                  status: 'LIVE' },
          { path: '/behindthecurtains/engineering', name: 'Engineering',  desc: 'Stack, structure, conventions.',             status: 'DRAFT' },
          { path: '/behindthecurtains/marketing',   name: 'Marketing',    desc: 'Kit, audiences, voice.',                     status: 'DRAFT' },
          { path: '/behindthecurtains/research',    name: 'Research',     desc: 'Testing, findings, insights.',               status: 'DRAFT' },
          { path: '/behindthecurtains/analytics',   name: 'Analytics',    desc: 'Traffic, behaviour, Vercel.',                status: 'DRAFT' },
        ],
      },
    ],
  },
  {
    id: 'edges',
    title: 'Edges',
    lede: 'Where the product ends or redirects.',
    roots: [
      { path: '/design', name: 'Legacy /design', desc: 'Redirects to /behindthecurtains/design.', status: 'REDIRECT' },
      { path: '*',       name: '404',            desc: 'Every unmapped path lands here.',         status: 'LIVE' },
    ],
  },
]

const STATUS_COPY = {
  LIVE:     'Shipped',
  DRAFT:    'Sketch',
  DISABLED: 'Off',
  REDIRECT: 'Redirect',
}

// Flatten the tree for counts
function flatten(roots) {
  const out = []
  function walk(n) { out.push(n); (n.children || []).forEach(walk) }
  roots.forEach(walk)
  return out
}

function counts(routes) {
  return {
    total: routes.length,
    live:  routes.filter(r => r.status === 'LIVE').length,
    draft: routes.filter(r => r.status === 'DRAFT').length,
    off:   routes.filter(r => r.status === 'DISABLED' || r.status === 'REDIRECT').length,
  }
}

// ── Route box ──────────────────────────────────────────────────────────────

function RouteBox({ route }) {
  const href = route.example || route.path
  const isLinkable = !route.path.includes(':') || Boolean(route.example)
  const hasRealLink = isLinkable && route.status !== 'DISABLED' && route.path !== '*'

  return (
    <div className={`sm-box sm-box--${route.status.toLowerCase()}`}>
      <div className="sm-box__head">
        <code className="sm-box__path">{route.path}</code>
        <span className={`sm-box__status sm-box__status--${route.status.toLowerCase()}`} title={STATUS_COPY[route.status]}>
          {STATUS_COPY[route.status]}
        </span>
      </div>
      <div className="sm-box__name">{route.name}</div>
      <div className="sm-box__desc">{route.desc}</div>
      {hasRealLink && (
        <a
          className="sm-box__open"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${route.path}`}
        >
          <ArrowUpRight size={12} />
        </a>
      )}
    </div>
  )
}

// ── Node (recursive) ───────────────────────────────────────────────────────
// Renders a route and, if it has children, a connector + stack of child nodes.
// Layout: parent on the left, children flow in a column to the right.
// Connectors are CSS lines drawn from the children container.

function Node({ node }) {
  const hasKids = node.children && node.children.length > 0
  return (
    <div className={`sm-node${hasKids ? ' sm-node--has-kids' : ''}`}>
      <div className="sm-node__self">
        <RouteBox route={node} />
      </div>
      {hasKids && (
        <div className="sm-node__kids">
          <ArrowRight size={14} className="sm-node__arrow" aria-hidden="true" />
          <div className="sm-node__kids-list">
            {node.children.map(c => <Node key={c.path} node={c} />)}
          </div>
        </div>
      )}
    </div>
  )
}

// ── The page ───────────────────────────────────────────────────────────────

export default function Sitemap() {
  const allRoutes = GROUPS.flatMap(g => flatten(g.roots))
  const totals = counts(allRoutes)

  return (
    <div className="sm-page">
      <header className="sm-banner">
        <div className="sm-banner__eyebrow">02 · Sitemap</div>
        <h1 className="sm-banner__title">EVERY ROUTE, EVERY PAGE</h1>
        <p className="sm-banner__lede">
          The shape of the product as a map. Each box is a real page; each
          arrow is the parent→child relationship. Click a box to open the
          real page in a new tab.
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
          {totals.off > 0 && <>
            <span className="sm-pulse__sep">·</span>
            <span className="sm-pulse__num sm-pulse__num--off">{totals.off}</span>
            <span className="sm-pulse__label">off</span>
          </>}
        </div>

        <nav className="sm-toc" aria-label="Jump to group">
          {GROUPS.map(g => (
            <a key={g.id} href={`#${g.id}`}>{g.title}</a>
          ))}
          <Link to="/behindthecurtains" className="sm-toc__home">← Behind the curtains</Link>
        </nav>
      </header>

      <div className="sm-groups">
        {GROUPS.map(group => {
          const c = counts(flatten(group.roots))
          return (
            <section key={group.id} id={group.id} className="sm-group">
              <header className="sm-group__head">
                <div className="sm-group__title-row">
                  <h2 className="sm-group__title">{group.title}</h2>
                  <span className="sm-group__count">{c.total} {c.total === 1 ? 'route' : 'routes'}</span>
                </div>
                <p className="sm-group__lede">{group.lede}</p>
              </header>

              <div className="sm-group__canvas">
                {group.roots.map(root => (
                  <Node key={root.path} node={root} />
                ))}
              </div>
            </section>
          )
        })}
      </div>

      <footer className="sm-footer">
        <p className="sm-footer__line">
          If a page isn't on the map, it doesn't exist.
        </p>
      </footer>
    </div>
  )
}
