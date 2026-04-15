/**
 * FLOWS — /behindthecurtains/flows
 *
 * The handful of user motions this product is built around. Each flow is
 * a named sequence of intent → screen → action, with the moment that
 * carries weight called out. Same honesty principle as the sitemap: if a
 * flow isn't here, it isn't a flow; if it drifts, it gets revised or cut.
 *
 * Living artefact: FLOWS is the source of truth. New flow earns a card.
 * A flow that doesn't survive contact with real users gets demoted, not
 * quietly deleted — we keep the record of what we tried.
 */

import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import './flows.css'

// ── Flow catalogue ──────────────────────────────────────────────────────────
// Each step is { action, state, note? }:
//   action — what the user does
//   state  — what the product becomes
//   note   — (optional) why this step carries weight

const FLOWS = [
  {
    id: 'tile-tap',
    name: 'The Tile Tap',
    intent: 'The core product interaction. Everything else extends this.',
    status: 'SHIPPED',
    entry: { path: '/', label: 'Start on the wall' },
    steps: [
      { action: 'Land on the wall', state: '00–99 grid, heat tells you where to look.' },
      { action: 'Scan',              state: 'Eye picks up bright tiles first — sacred blue, inferno orange.' },
      { action: 'Tap a number',      state: 'Tile goes white-ringed. PlayerPanel slides in.' },
      { action: 'Read',              state: 'Number echoed, subtitle, one or more PlayerCards ranked by tier + stat weight.',
        note: 'This is the moment of discovery — "oh, THAT\'s whose number it is." Everything the product promises pays off here.' },
    ],
    weight: 'The first tap. Under a second from grid to name. If this ever feels slow, the product is broken.',
  },
  {
    id: 'debate',
    name: 'The Debate',
    intent: 'Take a stance on a contested number. See the crowd.',
    status: 'SHIPPED',
    entry: { path: '/', label: 'Start on the wall' },
    steps: [
      { action: 'Pick a sport filter',  state: 'Wall shrinks to one league. Contested tiles start pulsing.' },
      { action: 'Tap a contested tile', state: 'Panel opens with "WHO REALLY OWNS THIS NUMBER?" prompt above cards.' },
      { action: 'Pick a legend',        state: 'Chip taps, fades in a split bar.' },
      { action: 'See the verdict',      state: 'Wall agrees / differs copy + crowd percentages. Top legend stays amber.',
        note: 'Pick is permanent. No reset, no re-vote. Protects the integrity of the scoreboard.' },
    ],
    weight: 'The "wall agrees / wall differs" moment. The product having an opinion is what makes it a product, not a tool.',
  },
  {
    id: 'timeline-drill',
    name: 'The Timeline Drill',
    intent: 'Go from a number to a career. Glow-scored, game by game.',
    status: 'PARTIAL',
    entry: { path: '/timeline/brady_tom', label: 'Open Brady\'s timeline' },
    steps: [
      { action: 'Tap #12 on the wall', state: 'Panel opens. Brady card shows a "View career timeline" CTA.' },
      { action: 'Open the timeline',    state: 'Route changes to /timeline/brady_tom. Waveform fades in.' },
      { action: 'Move through eras',    state: 'Chapter labels overlay the waveform. Glow goes indigo void → sacred gold.' },
      { action: 'Land on a moment',     state: 'Sacred-gold marker for rings, records, defining games.',
        note: 'The void is what gives the gold meaning. Torn ACL → Tampa ring reads as a shape, not just a stat.' },
    ],
    weight: 'Brady is the only subject today. The flow exists; the library does not. Expansion here is the single biggest leverage point in the product.',
  },
  {
    id: 'alumni-lookup',
    name: 'The Alumni Lookup',
    intent: 'Find your school, see your team\'s lineage, add to it.',
    status: 'SHIPPED',
    entry: { path: '/walls', label: 'Start at the team walls hub' },
    steps: [
      { action: 'Land on /walls',      state: 'USA map. Boston pulses as the seed when empty; dots light up elsewhere as walls are built.' },
      { action: 'Pick a town',         state: '/walls/town/:townSlug — all walls in that town, stacked.' },
      { action: 'Pick a school + sport', state: '/walls/:schoolSlug/:sport — the team\'s year-by-year wall.' },
      { action: 'Fill in a year',      state: 'Add a legend to an open number. Gretzky-style lineage starts to form.',
        note: 'Alumni recognition is the hook. "My jersey is on here" is the reason to come back.' },
    ],
    weight: 'The leap from "a Boston product" to "a product with many walls" happens here. Until non-Boston schools have walls, this flow is mostly theoretical.',
  },
  {
    id: 'identity-claim',
    name: 'The Identity Claim',
    intent: 'Claim a number. Make a wall of your own.',
    status: 'SHIPPED',
    entry: { path: '/my-wall', label: 'Start at My Walls' },
    steps: [
      { action: 'Open /my-wall',       state: 'Three lanes: built, on, follow. Login gate only here.' },
      { action: 'Tap "new"',            state: 'NewWallModal. Name + template + first number pick.' },
      { action: 'Name it',             state: 'Wall gets a slug. /wall/:slug is live.' },
      { action: 'Build',               state: 'Add legends, pick a palette, make it yours.',
        note: 'The only place identity matters. Rest of the product is anonymous by design.' },
    ],
    weight: 'Login friction is the cost. If a person can\'t see why to log in before the modal, they won\'t.',
  },
  {
    id: 'share',
    name: 'The Share',
    intent: 'Send one number. Recipient lands on it.',
    status: 'SHIPPED',
    entry: { path: '/number/12', label: 'See a deep-link in action' },
    steps: [
      { action: 'Open a number panel', state: 'Share button is in the header, next to Close.' },
      { action: 'Tap share',           state: 'Native share sheet on mobile, clipboard copy on desktop. Confirmation tick.' },
      { action: 'Recipient opens link', state: '/number/:num loads the wall with that tile pre-selected.',
        note: 'Deep-link is the unit of spread — not the homepage, not a blog post. One number, one argument.' },
    ],
    weight: 'Every shared link is a small bet on the product. Measuring which numbers get shared is probably a better signal than raw traffic.',
  },
]

const STATUS_COPY = {
  SHIPPED: 'Shipped',
  PARTIAL: 'Partial',
  UNBUILT: 'Unbuilt',
}

function counts(flows) {
  return {
    total:   flows.length,
    shipped: flows.filter(f => f.status === 'SHIPPED').length,
    partial: flows.filter(f => f.status === 'PARTIAL').length,
    unbuilt: flows.filter(f => f.status === 'UNBUILT').length,
  }
}

// ── Flow card ──────────────────────────────────────────────────────────────

function FlowCard({ flow }) {
  return (
    <article id={flow.id} className={`fl-flow fl-flow--${flow.status.toLowerCase()}`}>
      <header className="fl-flow__head">
        <div className="fl-flow__title-row">
          <h2 className="fl-flow__name">{flow.name}</h2>
          <span className={`fl-flow__status fl-flow__status--${flow.status.toLowerCase()}`}>
            {STATUS_COPY[flow.status]}
          </span>
        </div>
        <p className="fl-flow__intent">{flow.intent}</p>
      </header>

      <ol className="fl-flow__steps">
        {flow.steps.map((step, i) => (
          <li key={i} className="fl-flow__step">
            <span className="fl-flow__step-n">{String(i + 1).padStart(2, '0')}</span>
            <div className="fl-flow__step-body">
              <div className="fl-flow__step-line">
                <span className="fl-flow__action">{step.action}</span>
                <ArrowRight size={14} className="fl-flow__arrow" />
                <span className="fl-flow__state">{step.state}</span>
              </div>
              {step.note && (
                <p className="fl-flow__step-note">{step.note}</p>
              )}
            </div>
          </li>
        ))}
      </ol>

      <footer className="fl-flow__foot">
        <div className="fl-flow__weight">
          <span className="fl-flow__weight-label">WHAT CARRIES WEIGHT</span>
          <p className="fl-flow__weight-line">{flow.weight}</p>
        </div>
        <a
          className="fl-flow__start"
          href={flow.entry.path}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>{flow.entry.label}</span>
          <ArrowUpRight size={14} />
        </a>
      </footer>
    </article>
  )
}

// ── The page ───────────────────────────────────────────────────────────────

export default function Flows() {
  const c = counts(FLOWS)

  return (
    <div className="fl-page">
      <header className="fl-banner">
        <div className="fl-banner__eyebrow">03 · Flows</div>
        <h1 className="fl-banner__title">THE JOURNEYS THAT MATTER</h1>
        <p className="fl-banner__lede">
          A flow is a user moving through screens <em>with intent</em>. These are
          the motions The Number Wall is built around — not every possible path,
          just the ones that carry weight.
        </p>
        <p className="fl-banner__lede">
          Each flow is honest about status. <em>Shipped</em> means the motion
          works end-to-end with real content. <em>Partial</em> means the flow
          exists but the content or the audience doesn't yet match it.
        </p>

        <div className="fl-pulse">
          <span className="fl-pulse__num">{c.total}</span>
          <span className="fl-pulse__label">flows</span>
          <span className="fl-pulse__sep">·</span>
          <span className="fl-pulse__num fl-pulse__num--shipped">{c.shipped}</span>
          <span className="fl-pulse__label">shipped</span>
          <span className="fl-pulse__sep">·</span>
          <span className="fl-pulse__num fl-pulse__num--partial">{c.partial}</span>
          <span className="fl-pulse__label">partial</span>
        </div>

        <nav className="fl-toc" aria-label="Jump to flow">
          {FLOWS.map(f => (
            <a key={f.id} href={`#${f.id}`}>{f.name}</a>
          ))}
          <Link to="/behindthecurtains" className="fl-toc__home">← Behind the curtains</Link>
        </nav>
      </header>

      <div className="fl-stack">
        {FLOWS.map(flow => <FlowCard key={flow.id} flow={flow} />)}
      </div>

      <footer className="fl-footer">
        <p className="fl-footer__line">
          A flow that never ships is just a wish. A flow that drifts is a lie.
        </p>
      </footer>
    </div>
  )
}
