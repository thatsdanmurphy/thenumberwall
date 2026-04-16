/**
 * FLOWS — /behindthecurtains/flows
 *
 * Visual mapping view. Each flow is a horizontal sequence of step-boxes
 * connected by arrows. Each step-box carries a stylized thumbnail drawn
 * in the product's own token language — a tile grid, a panel shape, a
 * waveform, a map blob — so the motion reads at a glance without leaning
 * on screenshots that will drift.
 *
 * Living artefact: FLOWS is the source of truth. New flow earns a card.
 * A flow that doesn't survive contact with real users gets demoted, not
 * quietly deleted — we keep the record of what we tried.
 */

import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import './flows.css'

// ── Stylized thumbnails ─────────────────────────────────────────────────────
// Each thumbnail is a small SVG drawn in product tokens. They are hints,
// not screenshots — the point is to evoke the screen, not mirror it.

function ThumbWall({ highlights = [] }) {
  // 10×10 grid of squares, with a few tiles "lit" to suggest heat.
  const lit = new Set(highlights)
  const cells = []
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      const i = r * 10 + c
      cells.push(
        <rect
          key={i}
          x={2 + c * 7}
          y={2 + r * 7}
          width={5}
          height={5}
          rx={0.8}
          className={lit.has(i) ? 'fl-thumb__tile fl-thumb__tile--lit' : 'fl-thumb__tile'}
        />
      )
    }
  }
  return (
    <svg viewBox="0 0 74 74" className="fl-thumb__svg" aria-hidden="true">{cells}</svg>
  )
}

function ThumbWallHeat() {
  // Wall with several tiles lit — the "scan" moment where heat reads.
  return <ThumbWall highlights={[12, 23, 34, 45, 56, 67, 78, 7, 30, 51]} />
}

function ThumbWallFiltered() {
  // Fewer tiles visible (sport filter active), 2–3 pulsing.
  return (
    <svg viewBox="0 0 74 74" className="fl-thumb__svg" aria-hidden="true">
      {Array.from({ length: 30 }).map((_, i) => {
        const r = Math.floor(i / 6), c = i % 6
        const pulse = [7, 14, 22].includes(i)
        return (
          <rect
            key={i}
            x={5 + c * 11}
            y={5 + r * 13}
            width={8}
            height={10}
            rx={1}
            className={pulse ? 'fl-thumb__tile fl-thumb__tile--pulse' : 'fl-thumb__tile'}
          />
        )
      })}
    </svg>
  )
}

function ThumbWallSelected() {
  // Same grid but with one tile circled — the "tapped" state.
  return <ThumbWall highlights={[23]} />
}

function ThumbPanel() {
  // A side panel sliding in from the right: dimmed grid on the left,
  // panel rectangle with a header bar and a card block on the right.
  return (
    <svg viewBox="0 0 74 74" className="fl-thumb__svg" aria-hidden="true">
      {/* Faint grid behind */}
      <g className="fl-thumb__ghost">
        {Array.from({ length: 36 }).map((_, i) => {
          const r = Math.floor(i / 6), c = i % 6
          return <rect key={i} x={2 + c * 6} y={2 + r * 6} width={4} height={4} rx={0.6} />
        })}
      </g>
      {/* Panel */}
      <rect x={38} y={4} width={32} height={66} rx={2} className="fl-thumb__panel" />
      <rect x={42} y={10} width={14} height={3} rx={1} className="fl-thumb__accent" />
      <rect x={42} y={18} width={24} height={2} rx={1} className="fl-thumb__line" />
      <rect x={42} y={24} width={24} height={18} rx={1.5} className="fl-thumb__card" />
      <rect x={42} y={46} width={24} height={18} rx={1.5} className="fl-thumb__card" />
    </svg>
  )
}

function ThumbScoreboard() {
  // The "wall agrees / wall differs" split — a horizontal stacked bar.
  return (
    <svg viewBox="0 0 74 74" className="fl-thumb__svg" aria-hidden="true">
      <rect x={6} y={14} width={26} height={3} rx={1} className="fl-thumb__line" />
      <rect x={6} y={22} width={62} height={14} rx={2} className="fl-thumb__panel" />
      <rect x={8} y={24} width={42} height={10} rx={1.5} className="fl-thumb__accent" />
      {/* tick chips below */}
      <rect x={6} y={44} width={14} height={8} rx={1.5} className="fl-thumb__card" />
      <rect x={24} y={44} width={14} height={8} rx={1.5} className="fl-thumb__card" />
      <rect x={42} y={44} width={14} height={8} rx={1.5} className="fl-thumb__card fl-thumb__card--picked" />
      <rect x={60} y={44} width={8} height={8} rx={1.5} className="fl-thumb__card" />
      <rect x={6} y={58} width={34} height={2} rx={1} className="fl-thumb__line" />
    </svg>
  )
}

function ThumbTimeline() {
  // A waveform sweeping left to right with a bright peak at the end.
  return (
    <svg viewBox="0 0 74 74" className="fl-thumb__svg" aria-hidden="true">
      <path
        d="M4 50 C 10 46, 14 52, 20 44 C 26 38, 30 48, 36 36 C 42 28, 46 42, 52 26 C 58 18, 62 30, 68 14"
        className="fl-thumb__wave"
        fill="none"
      />
      {/* chapter ticks */}
      <line x1={20} y1={8} x2={20} y2={70} className="fl-thumb__tick" />
      <line x1={40} y1={8} x2={40} y2={70} className="fl-thumb__tick" />
      <line x1={58} y1={8} x2={58} y2={70} className="fl-thumb__tick" />
      {/* sacred gold peak */}
      <circle cx={68} cy={14} r={3.5} className="fl-thumb__peak" />
    </svg>
  )
}

function ThumbTimelineMoment() {
  // Same waveform but zoomed into the sacred-gold moment — peak is large,
  // a label line sits beside it. Distinct from the overview waveform.
  return (
    <svg viewBox="0 0 74 74" className="fl-thumb__svg" aria-hidden="true">
      <path
        d="M4 58 C 12 54, 18 48, 26 40 C 34 32, 40 38, 48 24 C 54 16, 60 20, 68 10"
        className="fl-thumb__wave"
        fill="none"
      />
      {/* sacred gold moment — bigger, with a ring */}
      <circle cx={68} cy={10} r={6} className="fl-thumb__dot-pulse-ring" />
      <circle cx={68} cy={10} r={3.5} className="fl-thumb__peak" />
      {/* label line */}
      <rect x={38} y={6} width={22} height={2.5} rx={1} className="fl-thumb__accent" />
      {/* context ticks faded */}
      <line x1={20} y1={8} x2={20} y2={70} className="fl-thumb__tick" />
      <line x1={42} y1={8} x2={42} y2={70} className="fl-thumb__tick" />
    </svg>
  )
}

function ThumbModalFilled() {
  // Modal with a filled input and a confirm button — "Name it" state.
  return (
    <svg viewBox="0 0 74 74" className="fl-thumb__svg" aria-hidden="true">
      <rect x={0} y={0} width={74} height={74} className="fl-thumb__scrim" />
      <rect x={10} y={16} width={54} height={42} rx={3} className="fl-thumb__panel" />
      <rect x={14} y={22} width={24} height={3} rx={1} className="fl-thumb__accent" />
      {/* filled input */}
      <rect x={14} y={30} width={46} height={8} rx={1.5} className="fl-thumb__panel" />
      <rect x={16} y={32.5} width={28} height={3} rx={1} className="fl-thumb__accent" />
      {/* confirm button highlighted */}
      <rect x={14} y={44} width={20} height={8} rx={1.5} className="fl-thumb__accent" />
    </svg>
  )
}

function ThumbTeamWallEdit() {
  // Same year grid but with one cell highlighted + a plus glyph.
  return (
    <svg viewBox="0 0 74 74" className="fl-thumb__svg" aria-hidden="true">
      {Array.from({ length: 40 }).map((_, i) => {
        const r = Math.floor(i / 8), c = i % 8
        const lit = [9, 18, 27, 28, 36].includes(i)
        const isNew = i === 19
        return (
          <rect
            key={i}
            x={4 + c * 8.5}
            y={10 + r * 11}
            width={7}
            height={9}
            rx={1}
            className={isNew ? 'fl-thumb__tile fl-thumb__tile--pulse' : lit ? 'fl-thumb__tile fl-thumb__tile--lit' : 'fl-thumb__tile'}
          />
        )
      })}
      <rect x={4} y={4} width={66} height={2} rx={1} className="fl-thumb__accent" />
      {/* plus icon in the new cell */}
      <line x1={24.25} y1={35} x2={24.25} y2={41} className="fl-thumb__plus" />
      <line x1={21.25} y1={38} x2={27.25} y2={38} className="fl-thumb__plus" />
    </svg>
  )
}

function ThumbMap() {
  // A stylized USA-ish blob with a bright dot over New England.
  return (
    <svg viewBox="0 0 74 74" className="fl-thumb__svg" aria-hidden="true">
      <path
        d="M6 30 Q 10 16, 22 14 L 44 12 Q 58 14, 64 22 L 66 38 Q 60 52, 46 54 L 24 56 Q 10 52, 6 38 Z"
        className="fl-thumb__map"
      />
      {/* faint dots scattered */}
      <circle cx={30} cy={34} r={1.2} className="fl-thumb__dot" />
      <circle cx={42} cy={30} r={1.2} className="fl-thumb__dot" />
      <circle cx={50} cy={40} r={1.2} className="fl-thumb__dot" />
      {/* pulse dot — Boston */}
      <circle cx={58} cy={22} r={4} className="fl-thumb__dot-pulse-ring" />
      <circle cx={58} cy={22} r={2} className="fl-thumb__dot-pulse" />
    </svg>
  )
}

function ThumbTownStack() {
  // Three stacked team wall rows — a town's list.
  return (
    <svg viewBox="0 0 74 74" className="fl-thumb__svg" aria-hidden="true">
      {[0, 1, 2].map(i => (
        <g key={i}>
          <rect x={4} y={8 + i * 20} width={66} height={16} rx={2} className="fl-thumb__panel" />
          <rect x={8} y={12 + i * 20} width={10} height={8} rx={1} className="fl-thumb__accent" />
          <rect x={22} y={14 + i * 20} width={26} height={2} rx={1} className="fl-thumb__line" />
          <rect x={22} y={18 + i * 20} width={18} height={2} rx={1} className="fl-thumb__line" />
        </g>
      ))}
    </svg>
  )
}

function ThumbTeamWall() {
  // A small year-by-year grid — columns = years, rows = numbers.
  return (
    <svg viewBox="0 0 74 74" className="fl-thumb__svg" aria-hidden="true">
      {Array.from({ length: 40 }).map((_, i) => {
        const r = Math.floor(i / 8), c = i % 8
        const lit = [9, 18, 27, 28, 36].includes(i)
        return (
          <rect
            key={i}
            x={4 + c * 8.5}
            y={10 + r * 11}
            width={7}
            height={9}
            rx={1}
            className={lit ? 'fl-thumb__tile fl-thumb__tile--lit' : 'fl-thumb__tile'}
          />
        )
      })}
      <rect x={4} y={4} width={66} height={2} rx={1} className="fl-thumb__accent" />
    </svg>
  )
}

function ThumbHub() {
  // My Walls: three stacked lane rows.
  return (
    <svg viewBox="0 0 74 74" className="fl-thumb__svg" aria-hidden="true">
      <rect x={4} y={4} width={30} height={3} rx={1} className="fl-thumb__accent" />
      {[0, 1, 2].map(i => (
        <g key={i}>
          <rect x={4} y={14 + i * 18} width={10} height={3} rx={1} className="fl-thumb__line" />
          <rect x={4} y={20 + i * 18} width={66} height={12} rx={1.5} className="fl-thumb__panel" />
        </g>
      ))}
    </svg>
  )
}

function ThumbModal() {
  // A dimmed backdrop with a modal in the center and a form line.
  return (
    <svg viewBox="0 0 74 74" className="fl-thumb__svg" aria-hidden="true">
      <rect x={0} y={0} width={74} height={74} className="fl-thumb__scrim" />
      <rect x={10} y={16} width={54} height={42} rx={3} className="fl-thumb__panel" />
      <rect x={14} y={22} width={24} height={3} rx={1} className="fl-thumb__accent" />
      <rect x={14} y={30} width={46} height={8} rx={1.5} className="fl-thumb__card" />
      <rect x={14} y={44} width={16} height={8} rx={1.5} className="fl-thumb__accent" />
      <rect x={34} y={44} width={16} height={8} rx={1.5} className="fl-thumb__card" />
    </svg>
  )
}

function ThumbBuilt() {
  // A single named wall page — header + tile grid.
  return (
    <svg viewBox="0 0 74 74" className="fl-thumb__svg" aria-hidden="true">
      <rect x={4} y={4} width={40} height={4} rx={1} className="fl-thumb__accent" />
      <rect x={4} y={12} width={24} height={2} rx={1} className="fl-thumb__line" />
      {Array.from({ length: 36 }).map((_, i) => {
        const r = Math.floor(i / 9), c = i % 9
        const lit = [3, 10, 14, 22, 28, 31].includes(i)
        return (
          <rect
            key={i}
            x={4 + c * 7.5}
            y={20 + r * 13}
            width={6}
            height={11}
            rx={1}
            className={lit ? 'fl-thumb__tile fl-thumb__tile--lit' : 'fl-thumb__tile'}
          />
        )
      })}
    </svg>
  )
}

function ThumbShare() {
  // Panel with a share button highlighted, plus a chain link glyph.
  return (
    <svg viewBox="0 0 74 74" className="fl-thumb__svg" aria-hidden="true">
      <rect x={4} y={8} width={66} height={14} rx={2} className="fl-thumb__panel" />
      <rect x={8} y={13} width={20} height={4} rx={1} className="fl-thumb__line" />
      <rect x={54} y={12} width={12} height={6} rx={1.5} className="fl-thumb__accent" />
      {/* link glyph */}
      <g transform="translate(18 38)" className="fl-thumb__link">
        <rect x={0} y={8} width={16} height={8} rx={4} />
        <rect x={22} y={8} width={16} height={8} rx={4} />
        <rect x={12} y={10} width={14} height={4} />
      </g>
      <rect x={10} y={60} width={54} height={3} rx={1} className="fl-thumb__line" />
    </svg>
  )
}

function ThumbDeepLink() {
  // Wall grid with one tile already selected on arrival.
  return <ThumbWall highlights={[12]} />
}

const THUMBS = {
  wall:            ThumbWall,
  wallHeat:        ThumbWallHeat,
  wallFiltered:    ThumbWallFiltered,
  wallTap:         ThumbWallSelected,
  panel:           ThumbPanel,
  scoreboard:      ThumbScoreboard,
  timeline:        ThumbTimeline,
  timelineMoment:  ThumbTimelineMoment,
  map:             ThumbMap,
  townStack:       ThumbTownStack,
  teamWall:        ThumbTeamWall,
  teamWallEdit:    ThumbTeamWallEdit,
  hub:             ThumbHub,
  modal:           ThumbModal,
  modalFilled:     ThumbModalFilled,
  built:           ThumbBuilt,
  share:           ThumbShare,
  deepLink:        ThumbDeepLink,
}

// ── Flow catalogue ──────────────────────────────────────────────────────────
// Each step is { thumb, action, state, note? }. The thumb is the mental
// picture of the screen; the action/state line is what the user is doing
// and what the product becomes.

const FLOWS = [
  {
    id: 'tile-tap',
    name: 'The Tile Tap',
    intent: 'The core product interaction. Everything else extends this.',
    status: 'SHIPPED',
    entry: { path: '/', label: 'Start on the wall' },
    steps: [
      { thumb: 'wall',     action: 'Land on the wall', state: '00–99 grid. Heat tells you where to look.' },
      { thumb: 'wallHeat', action: 'Feel the heat',   state: 'Eye picks up bright tiles — sacred blue, inferno orange.' },
      { thumb: 'wallTap', action: 'Tap a number',     state: 'Tile goes white-ringed. Panel slides in.' },
      { thumb: 'panel',   action: 'Read',             state: 'Number echoed. Player cards ranked by tier.',
        note: 'This is the moment of discovery — "oh, THAT\'s whose number it is."' },
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
      { thumb: 'wallFiltered', action: 'Filter a sport',    state: 'Wall shrinks. Contested tiles start pulsing.' },
      { thumb: 'wallTap',    action: 'Tap a contested tile', state: 'Panel opens with a "who really owns this?" prompt.' },
      { thumb: 'panel',      action: 'Pick a legend',        state: 'Chip taps. A split bar fades in.' },
      { thumb: 'scoreboard', action: 'See the verdict',      state: 'Wall agrees / differs. Top legend stays amber.',
        note: 'Pick is permanent. No reset, no re-vote. Protects the scoreboard.' },
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
      { thumb: 'wallTap',  action: 'Tap #12',           state: 'Panel opens. Brady card shows a timeline CTA.' },
      { thumb: 'panel',    action: 'Open the timeline', state: 'Route changes to /timeline/brady_tom. Waveform fades in.' },
      { thumb: 'timeline', action: 'Move through eras', state: 'Chapter labels overlay the wave. Indigo void → sacred gold.' },
      { thumb: 'timelineMoment', action: 'Land on a moment',  state: 'Sacred-gold marker for a ring, record, or defining game.',
        note: 'The void is what gives the gold meaning. Torn ACL → Tampa ring reads as a shape, not a stat.' },
    ],
    weight: 'Brady is the only subject today. The flow exists; the library does not. Expansion is the single biggest leverage point.',
  },
  {
    id: 'alumni-lookup',
    name: 'The Alumni Lookup',
    intent: 'Find your school, see your team\'s lineage, add to it.',
    status: 'SHIPPED',
    entry: { path: '/walls', label: 'Start at the team walls hub' },
    steps: [
      { thumb: 'map',       action: 'Land on /walls',         state: 'USA map. Boston pulses as the seed.' },
      { thumb: 'townStack', action: 'Pick a town',            state: 'All walls in that town, stacked.' },
      { thumb: 'teamWall',  action: 'Pick a school + sport',  state: 'The team\'s year-by-year wall.' },
      { thumb: 'teamWallEdit', action: 'Fill in a year',      state: 'Add a legend to an open number. Lineage forms.',
        note: 'Alumni recognition is the hook. "My jersey is on here" is the reason to come back.' },
    ],
    weight: 'The leap from "a Boston product" to "many walls" happens here. Until non-Boston schools have walls, this flow is mostly theoretical.',
  },
  {
    id: 'identity-claim',
    name: 'The Identity Claim',
    intent: 'Claim a number. Make a wall of your own.',
    status: 'SHIPPED',
    entry: { path: '/my-wall', label: 'Start at My Walls' },
    steps: [
      { thumb: 'hub',   action: 'Open /my-wall', state: 'Three lanes: built, on, follow. Login gate only here.' },
      { thumb: 'modal', action: 'Tap "new"',     state: 'NewWallModal. Name + template + first number pick.' },
      { thumb: 'modalFilled', action: 'Name it',  state: 'Wall gets a slug. /wall/:slug is live.' },
      { thumb: 'built', action: 'Build',         state: 'Add legends, pick a palette, make it yours.',
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
      { thumb: 'panel',    action: 'Open a number panel',  state: 'Share button sits in the panel header.' },
      { thumb: 'share',    action: 'Tap share',            state: 'Native sheet on mobile, clipboard on desktop. Tick.' },
      { thumb: 'deepLink', action: 'Recipient opens link', state: '/number/:num loads the wall, tile pre-selected.',
        note: 'Deep-link is the unit of spread — not the homepage. One number, one argument.' },
    ],
    weight: 'Every shared link is a small bet on the product. Which numbers get shared is probably a better signal than raw traffic.',
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
  }
}

// ── Step box ───────────────────────────────────────────────────────────────

function StepBox({ step, index }) {
  const Thumb = THUMBS[step.thumb] || ThumbWall
  return (
    <div className="fl-step">
      <div className="fl-step__thumb">
        <Thumb />
        <span className="fl-step__n">{String(index + 1).padStart(2, '0')}</span>
      </div>
      <div className="fl-step__body">
        <div className="fl-step__action">{step.action}</div>
        <div className="fl-step__state">{step.state}</div>
        {step.note && <div className="fl-step__note">{step.note}</div>}
      </div>
    </div>
  )
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

      <div className="fl-flow__canvas">
        <div className="fl-flow__track">
          {flow.steps.map((step, i) => (
            <div key={i} className="fl-flow__track-cell">
              <StepBox step={step} index={i} />
              {i < flow.steps.length - 1 && (
                <ArrowRight size={18} className="fl-flow__connector" aria-hidden="true" />
              )}
            </div>
          ))}
        </div>
      </div>

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
