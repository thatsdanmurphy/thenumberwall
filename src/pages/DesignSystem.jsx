/**
 * DESIGN SYSTEM — /design
 *
 * Hidden route (not in nav) documenting The Number Wall's atoms, primitives,
 * and compositions live. Everything here reads from the actual tokens and
 * primitives the product uses — if a token drifts, this page breaks
 * visibly first.
 *
 * Structure:
 *   1. Foundations  — color, type, space, radius, motion
 *   2. Primitives   — WallTile, buttons, inputs, tabs, identity slot
 *   3. Compositions — identity row, tile row, panel header
 *   4. Voice        — when to use banner vs scoreboard vs handwritten
 *   5. Don'ts       — the things that have broken the system before
 *
 * Rule for editing this page: never hardcode values. Every swatch, ramp step,
 * and example pulls from `--token` vars. If you're tempted to type "0.5rem"
 * or "#E87C2A", stop — the token is the truth.
 */

import { Link } from 'react-router-dom'
import WallTile from '../components/WallTile.jsx'
import IdentityTiles from '../components/IdentityTiles.jsx'
import { getCitySuggestions } from '../lib/cities.js'
import './DesignSystem.css'

// ── Token data (source of truth — names must match global.css) ─────────────

const COLOR_CORE = [
  { name: '--color-night',   swatch: 'var(--color-night)',   note: 'Canvas background' },
  { name: '--color-surface', swatch: 'var(--color-surface)', note: 'Elevated panel' },
  { name: '--color-paper',   swatch: 'var(--color-paper)',   note: 'Default type' },
  { name: '--color-muted',   swatch: 'var(--color-muted)',   note: 'Frosty secondary' },
  { name: '--color-heat',    swatch: 'var(--color-heat)',    note: 'Energy, CTAs' },
  { name: '--color-blaze',   swatch: 'var(--color-blaze)',   note: 'Hover of heat' },
  { name: '--color-sacred',  swatch: 'var(--color-sacred)',  note: 'Focus, honored' },
  { name: '--color-action',  swatch: 'var(--color-action)',  note: 'Pure action white' },
]

const COLOR_TEAM = [
  { name: '--color-team-sox',      swatch: 'var(--color-team-sox)',      note: 'Sox' },
  { name: '--color-team-bruins',   swatch: 'var(--color-team-bruins)',   note: 'Bruins' },
  { name: '--color-team-celtics',  swatch: 'var(--color-team-celtics)',  note: 'Celtics' },
  { name: '--color-team-patriots', swatch: 'var(--color-team-patriots)', note: 'Patriots' },
]

const SURFACES = [
  { name: '--surface-1', swatch: 'var(--surface-1)', note: 'Barely-there card' },
  { name: '--surface-2', swatch: 'var(--surface-2)', note: 'Resting input' },
  { name: '--surface-3', swatch: 'var(--surface-3)', note: 'Hover surface' },
  { name: '--surface-4', swatch: 'var(--surface-4)', note: 'Active / pressed' },
]

const BORDERS = [
  { name: '--border-faint',  swatch: 'var(--border-faint)',  note: 'Dividers' },
  { name: '--border-soft',   swatch: 'var(--border-soft)',   note: 'Default edge' },
  { name: '--border-medium', swatch: 'var(--border-medium)', note: 'Buttons' },
  { name: '--border-strong', swatch: 'var(--border-strong)', note: 'Hover / focus' },
]

const INKS = [
  { name: '--ink-dim',  swatch: 'var(--ink-dim)',  note: 'Placeholder' },
  { name: '--ink-low',  swatch: 'var(--ink-low)',  note: 'Secondary label' },
  { name: '--ink-mid',  swatch: 'var(--ink-mid)',  note: 'Body on dim surface' },
  { name: '--ink-high', swatch: 'var(--ink-high)', note: 'Body, default' },
]

const TYPE_RAMP = [
  { name: '--text-h1',      size: 'var(--text-h1)',      note: 'Modal titles · major headings', sample: 'Every fan has a number.' },
  { name: '--text-h2',      size: 'var(--text-h2)',      note: 'Section heads',                 sample: 'THIS IS YOUR WALL' },
  { name: '--text-body',    size: 'var(--text-body)',    note: 'Base body copy · inputs',       sample: 'Claim your identity.' },
  { name: '--text-small',   size: 'var(--text-small)',   note: 'Dense body · secondary text',   sample: 'Your personal wall' },
  { name: '--text-caption', size: 'var(--text-caption)', note: 'Pills · chips · badges',        sample: '3 PICKS' },
  { name: '--text-label',   size: 'var(--text-label)',   note: 'Eyebrow · all-caps labels',     sample: 'MY NUMBER' },
  { name: '--text-micro',   size: 'var(--text-micro)',   note: 'Smallest labels · stat tags',   sample: 'COACHES' },
]

const FONTS = [
  { name: '--font-banner',      sample: 'NUMBER WALL',          note: 'Archivo Black — identity marks, big numbers' },
  { name: '--font-program',     sample: 'The game is about to begin.', note: 'Inter — body copy, UI' },
  { name: '--font-scoreboard',  sample: 'HEAT  ·  SACRED  ·  WRITTEN', note: 'IBM Plex Mono — labels, overlines, buttons' },
  { name: '--font-handwritten', sample: "You're already one.",   note: 'Rock Salt — tagline, moments of warmth' },
]

const TRACKING = [
  { name: '--tracking-normal', value: '0' },
  { name: '--tracking-wide',   value: '0.10em' },
  { name: '--tracking-wider',  value: '0.14em' },
  { name: '--tracking-widest', value: '0.18em' },
]

const SPACE = [1, 2, 3, 4, 5, 6, 7, 8].map(n => ({
  name: `--space-${n}`,
  value: [4, 8, 16, 24, 32, 48, 64, 96][n - 1] + 'px',
}))

const RADII = [
  { name: '--radius-sm', note: 'Inputs · buttons · tiles' },
  { name: '--radius-md', note: 'Cards · chips' },
  { name: '--radius-lg', note: 'Large surfaces · empty CTAs' },
  { name: '--radius-xl', note: 'Hero panels' },
]

const MOTION = [
  { name: '--motion-hover',  note: 'Color, border on hover', value: '180ms ease-out' },
  { name: '--motion-reveal', note: 'Panels, modals',         value: '250ms ease-in-out' },
  { name: '--motion-heat',   note: 'Heat crossfade',         value: '300ms ease-in-out' },
  { name: '--motion-color',  note: 'Accent transitions',     value: '200ms ease-out' },
]

// ── Primitive demo: tile heat states ───────────────────────────────────────
// Each entry array simulates what WallTile would render on the real wall.

const TILE_EXAMPLES = [
  { label: 'Unwritten', number: 88, entries: [{ tier: 'UNWRITTEN' }] },
  { label: 'Lit',       number: 7,  entries: [{ tier: 'LIT' }] },
  { label: 'Hot',       number: 19, entries: [{ tier: 'HOT' }, { tier: 'LIT' }] },
  { label: 'Sacred',    number: 4,  entries: [{ tier: 'SACRED' }] },
]

// ── Reusable blocks ────────────────────────────────────────────────────────

function Section({ id, eyebrow, title, intro, children }) {
  return (
    <section id={id} className="ds-section">
      <header className="ds-section__header">
        <span className="ds-section__eyebrow">{eyebrow}</span>
        <h2 className="ds-section__title">{title}</h2>
        {intro && <p className="ds-section__intro">{intro}</p>}
      </header>
      <div className="ds-section__body">{children}</div>
    </section>
  )
}

function SubSection({ title, note, children }) {
  return (
    <div className="ds-sub">
      <div className="ds-sub__head">
        <h3 className="ds-sub__title">{title}</h3>
        {note && <p className="ds-sub__note">{note}</p>}
      </div>
      <div className="ds-sub__body">{children}</div>
    </div>
  )
}

function Swatch({ name, swatch, note, style }) {
  return (
    <div className="ds-swatch">
      <div className="ds-swatch__chip" style={{ background: swatch, ...style }} />
      <div className="ds-swatch__meta">
        <code className="ds-code">{name}</code>
        {note && <span className="ds-swatch__note">{note}</span>}
      </div>
    </div>
  )
}

function Rule({ variant, label, body }) {
  return (
    <div className={`ds-rule ds-rule--${variant}`}>
      <span className={`ds-rule__pill ds-rule__pill--${variant}`}>
        {variant === 'do' ? 'DO' : "DON'T"}
      </span>
      <div className="ds-rule__text">
        <strong className="ds-rule__label">{label}</strong>
        <span className="ds-rule__body">{body}</span>
      </div>
    </div>
  )
}

// ── The page ───────────────────────────────────────────────────────────────

export default function DesignSystem() {
  // Stub identity for the live composition demo — not wired to storage.
  const demoIdentity = { number: '18', city: 'Brookline, MA' }
  const noop = () => {}

  return (
    <div className="ds-page">
      {/* ── Banner ────────────────────────────────────────────────── */}
      <header className="ds-banner">
        <div className="ds-banner__eyebrow">INTERNAL REFERENCE · NOT IN NAV</div>
        <h1 className="ds-banner__title">THE NUMBER WALL</h1>
        <h2 className="ds-banner__sub">Design System</h2>
        <p className="ds-banner__lede">
          Tokens, primitives, and compositions — documented live from the same
          variables the product ships. The goal is legibility: anyone should
          be able to read this page once and know how to build something that
          feels like The Number Wall.
        </p>
        <nav className="ds-toc" aria-label="Jump to section">
          <a href="#foundations">Foundations</a>
          <a href="#primitives">Primitives</a>
          <a href="#compositions">Compositions</a>
          <a href="#voice">Voice</a>
          <a href="#donts">Don'ts</a>
          <Link to="/" className="ds-toc__home">← Back to the wall</Link>
        </nav>
      </header>

      {/* ── 1. Foundations ──────────────────────────────────────────── */}
      <Section
        id="foundations"
        eyebrow="01"
        title="Foundations"
        intro="Every color, size, and duration in the product comes from one of these tokens. If a component needs a value that isn't here, the scale is wrong — add a token, don't hardcode."
      >
        <SubSection title="Color · core" note="The eight colors the product thinks in. Heat is energy. Sacred is honored. Muted is frosty, not dim.">
          <div className="ds-swatch-grid">
            {COLOR_CORE.map(c => <Swatch key={c.name} {...c} />)}
          </div>
        </SubSection>

        <SubSection title="Color · team" note="Team accents are drawn from official team primaries. Used only on team walls — never on the main wall.">
          <div className="ds-swatch-grid">
            {COLOR_TEAM.map(c => <Swatch key={c.name} {...c} />)}
          </div>
        </SubSection>

        <SubSection title="Surface scale" note="Four white tints for layering on the dark canvas. Don't invent new alpha values.">
          <div className="ds-swatch-grid ds-swatch-grid--alpha">
            {SURFACES.map(c => <Swatch key={c.name} {...c} />)}
          </div>
        </SubSection>

        <SubSection title="Border scale" note="Edges. Faint for dividers, strong for hover/focus.">
          <div className="ds-swatch-grid ds-swatch-grid--alpha">
            {BORDERS.map(c => (
              <Swatch
                key={c.name}
                name={c.name}
                swatch="transparent"
                note={c.note}
                style={{ border: `1px solid ${c.swatch}` }}
              />
            ))}
          </div>
        </SubSection>

        <SubSection title="Ink scale" note="Text tints for secondary hierarchy. Prefer --color-muted for frosty labels; these are for body copy on dim surfaces.">
          <div className="ds-ink-grid">
            {INKS.map(i => (
              <div key={i.name} className="ds-ink">
                <span className="ds-ink__sample" style={{ color: i.swatch }}>
                  Every fan has a number.
                </span>
                <code className="ds-code">{i.name}</code>
                <span className="ds-swatch__note">{i.note}</span>
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection title="Type · families" note="Four families. Banner for identity. Program for reading. Scoreboard for labels. Handwritten for warmth — use sparingly.">
          <div className="ds-font-grid">
            {FONTS.map(f => (
              <div key={f.name} className="ds-font">
                <div className="ds-font__sample" style={{ fontFamily: `var(${f.name})` }}>
                  {f.sample}
                </div>
                <div className="ds-font__meta">
                  <code className="ds-code">{f.name}</code>
                  <span className="ds-swatch__note">{f.note}</span>
                </div>
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection title="Type · ramp" note="Seven steps, collapsed from an earlier spread of eight. Use tokens — never raw rem.">
          <div className="ds-ramp">
            {TYPE_RAMP.map(t => (
              <div key={t.name} className="ds-ramp__row">
                <code className="ds-code ds-ramp__name">{t.name}</code>
                <span className="ds-ramp__sample" style={{ fontSize: t.size }}>{t.sample}</span>
                <span className="ds-ramp__note">{t.note}</span>
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection title="Letter-spacing" note="Scoreboard labels get wide tracking. Banner type stays tight. Never use raw em values.">
          <div className="ds-track">
            {TRACKING.map(t => (
              <div key={t.name} className="ds-track__row">
                <code className="ds-code">{t.name}</code>
                <span className="ds-track__sample" style={{ letterSpacing: t.value }}>
                  NUMBER WALL
                </span>
                <span className="ds-swatch__note">{t.value}</span>
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection title="Spacing" note="Eight-step scale on a 4→96px doubling-ish rhythm. Use tokens for gap, padding, margin — never raw px.">
          <div className="ds-space">
            {SPACE.map(s => (
              <div key={s.name} className="ds-space__row">
                <code className="ds-code ds-space__name">{s.name}</code>
                <span className="ds-space__bar" style={{ width: `var(${s.name})` }} />
                <span className="ds-swatch__note">{s.value}</span>
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection title="Radius" note="Four steps. Tiles and inputs share sm. Cards get md. Panels get xl.">
          <div className="ds-radii">
            {RADII.map(r => (
              <div key={r.name} className="ds-radii__item">
                <div className="ds-radii__box" style={{ borderRadius: `var(${r.name})` }} />
                <code className="ds-code">{r.name}</code>
                <span className="ds-swatch__note">{r.note}</span>
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection title="Motion" note="Four durations. Hover is fast. Reveal is paced. Everything else lives on this ramp.">
          <div className="ds-motion">
            {MOTION.map(m => (
              <div key={m.name} className="ds-motion__row">
                <button
                  className="ds-motion__demo"
                  style={{ transition: `background var(${m.name}), border-color var(${m.name})` }}
                >
                  Hover me
                </button>
                <code className="ds-code">{m.name}</code>
                <span className="ds-swatch__note">{m.value} · {m.note}</span>
              </div>
            ))}
          </div>
        </SubSection>
      </Section>

      {/* ── 2. Primitives ───────────────────────────────────────────── */}
      <Section
        id="primitives"
        eyebrow="02"
        title="Primitives"
        intro="The atoms the product is assembled from. Reach for these before writing new CSS — extend with props if you need a variant."
      >
        <SubSection title="WallTile" note="The core atom. One square per number. Heat, ring, and type treatment encode meaning.">
          <div className="ds-tiles">
            {TILE_EXAMPLES.map(t => (
              <div key={t.label} className="ds-tile-demo">
                <div className="ds-tile-demo__tile">
                  <WallTile number={t.number} entries={t.entries} isActive={false} onClick={() => {}} />
                </div>
                <span className="ds-swatch__note">{t.label}</span>
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection title="Buttons" note="Primary for the main action. Secondary for alt. Ghost for dismiss. Never invent a fourth.">
          <div className="ds-button-row">
            <button className="tnw-btn tnw-btn--primary">CLAIM MINE</button>
            <button className="tnw-btn tnw-btn--secondary">BUILD A WALL</button>
            <button className="tnw-btn tnw-btn--ghost">Cancel</button>
            <button className="tnw-btn tnw-btn--primary" disabled>DISABLED</button>
          </div>
        </SubSection>

        <SubSection title="Input" note="Flat, dark, no chrome. Focus darkens the border slightly.">
          <div className="ds-input-row">
            <input className="tnw-input" placeholder="Your city" />
            <input className="tnw-input" placeholder="00" style={{ maxWidth: 120, textAlign: 'center' }} />
          </div>
        </SubSection>

        <SubSection title="Tabs" note="Scoreboard labels with a heat underline on active. Used on city pages.">
          <div className="ds-tabs-demo">
            <button className="tnw-tab tnw-tab--active">ALL</button>
            <button className="tnw-tab">NFL</button>
            <button className="tnw-tab">NHL</button>
            <button className="tnw-tab">NBA</button>
            <button className="tnw-tab">MLB</button>
          </div>
        </SubSection>

        <SubSection title="Eyebrow" note="Scoreboard overline for section labels. Always uppercase, always tracked-widest.">
          <div className="ds-eyebrow-demo">
            <span className="tnw-eyebrow">MY WALLS</span>
          </div>
        </SubSection>
      </Section>

      {/* ── 3. Compositions ─────────────────────────────────────────── */}
      <Section
        id="compositions"
        eyebrow="03"
        title="Compositions"
        intro="How the atoms click together. These are the patterns; don't recreate them from scratch."
      >
        <SubSection title="Identity row" note="Number (square) + City (wide field). Same shell, same height, each slot sized to its data.">
          <div className="ds-comp">
            <IdentityTiles
              identity={demoIdentity}
              citySuggestions={getCitySuggestions}
              onSaveField={noop}
            />
          </div>
        </SubSection>

        <SubSection title="Tile row" note="Primitive + primitive. Every wall on the site is a grid of these.">
          <div className="ds-comp">
            <div className="ds-tile-row">
              {[1, 4, 7, 12, 19, 23, 77, 99].map((n, i) => (
                <WallTile
                  key={n}
                  number={n}
                  entries={
                    [null, [{ tier: 'SACRED' }], [{ tier: 'LIT' }], [{ tier: 'HOT' }],
                     [{ tier: 'LIT' }, { tier: 'LIT' }], [{ tier: 'UNWRITTEN' }],
                     [{ tier: 'SACRED' }], [{ tier: 'UNWRITTEN' }]][i] || [{ tier: 'UNWRITTEN' }]
                  }
                  isActive={n === 4}
                  onClick={() => {}}
                />
              ))}
            </div>
          </div>
        </SubSection>
      </Section>

      {/* ── 4. Voice ────────────────────────────────────────────────── */}
      <Section
        id="voice"
        eyebrow="04"
        title="Voice"
        intro="Language is part of the system. Get these right and the product feels like itself; get them wrong and it reads like boilerplate."
      >
        <div className="ds-voice">
          <Rule variant="do"   label="MY for inventory."   body='Use "MY NUMBER", "MY CITY", "MY WALLS" — anything that belongs to the person.' />
          <Rule variant="do"   label="YOUR for address."   body='Use "your personal wall", "claim your identity" — when the app is talking to the person.' />
          <Rule variant="dont" label="Don't mix in one block." body="If a panel uses MY for the labels, the surrounding copy stays in YOUR. They're different voices serving different jobs." />
          <Rule variant="do"   label="Banner for names."   body="Archivo Black = identity. The wordmark, the big numbers, the city name. Nothing else." />
          <Rule variant="do"   label="Scoreboard for labels." body="IBM Plex Mono, uppercase, tracked-widest. Every label, overline, and button." />
          <Rule variant="do"   label="Handwritten sparingly." body="Rock Salt appears in tagline moments. Use it when you want the product to feel like a human is speaking." />
          <Rule variant="dont" label="Don't use emojis."  body="We're a scoreboard, not a feed. The palette is enough expression." />
        </div>
      </Section>

      {/* ── 5. Don'ts ─────────────────────────────────────────────── */}
      <Section
        id="donts"
        eyebrow="05"
        title="Don'ts"
        intro="Every entry here is something that broke the system and had to be cleaned up. Leave them here as scar tissue."
      >
        <div className="ds-voice">
          <Rule variant="dont" label="No raw rgba."  body="If you're typing rgba(255, 255, 255, 0.xx), reach for --surface-*, --border-*, or --ink-* instead." />
          <Rule variant="dont" label="No raw rem."   body="Every type size has a token. If yours isn't here, the scale is wrong — add a step, don't improvise." />
          <Rule variant="dont" label="No raw px for spacing." body="Gap, padding, margin: --space-1 through --space-8. Don't reach for 10px because it looks right." />
          <Rule variant="dont" label="No banner type on pass-through tiles." body="Banner = content. If a tile is a doorway (COACHES, +ADD), use scoreboard small-caps. The numbers own banner." />
          <Rule variant="dont" label="No custom tile styles." body="If you need a square with a number, use <WallTile>. Pass overrides via heatStyle / textColor props. Don't write parallel CSS." />
          <Rule variant="dont" label="No duplicate color tokens." body="--ink-low and --color-muted are different things. Don't add a third gray — pick the one that fits." />
          <Rule variant="dont" label="No new alpha values on surfaces." body="The four-step surface scale covers every layering case. If yours doesn't fit, you're layering too much." />
        </div>
      </Section>

      <footer className="ds-footer">
        <p className="ds-footer__line">
          This page is the source of truth. If the product drifts from it, the page wins.
        </p>
      </footer>
    </div>
  )
}
