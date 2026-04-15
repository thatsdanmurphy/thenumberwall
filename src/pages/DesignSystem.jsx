/**
 * DESIGN SYSTEM — /design
 *
 * Hidden reference documenting The Number Wall's atoms, primitives, and
 * heat language. Everything renders live from the actual tokens and data
 * files the product ships — if the system drifts, this page breaks
 * visibly first. That's the point: the page is both the spec and the lint.
 *
 * Structure (every section earns its place — if we can't explain why it
 * exists in one line, it doesn't belong):
 *   1. Foundations    — the raw material: palette, layers, type, space, radius
 *   2. Tile language  — the soul of the product: heat, sacred, team palettes
 *   3. Primitives     — the atoms at real scale: tiles, buttons, inputs
 *   4. Iconography    — the line-art vocabulary
 *   5. Compositions   — the recipes the product leans on
 */

import { Link } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, ArrowLeft, X, Plus, Pencil, Trash2, Search,
  Check, Undo2, Flame, Star, Trophy, Shield, Zap, Map, MapPin, Users, Award,
  ExternalLink, Diamond,
} from 'lucide-react'
import WallTile from '../components/WallTile.jsx'
import { TEAM_PALETTES } from '../data/teamColors.js'
import { HEAT_TILES, SACRED_TILE } from '../data/index.js'
import './DesignSystem.css'

// ── Foundation tokens (names must match global.css) ────────────────────────

const PALETTE = [
  { name: '--color-night',   note: 'The canvas. Every screen sits on this.' },
  { name: '--color-surface', note: 'One step up from canvas — elevated panels.' },
  { name: '--color-paper',   note: 'Primary type. Clean, not pure white.' },
  { name: '--color-muted',   note: 'Frosty gray. Labels, secondary type.' },
  { name: '--color-heat',    note: 'Energy. CTAs, selection, your own number.' },
  { name: '--color-blaze',   note: 'Heat on hover — a warmer step.' },
  { name: '--color-sacred',  note: 'Honored, focused, iconic. Ice blue.' },
]

const LAYERS = [
  { surface: '--surface-1', border: '--border-faint',  note: 'Barely-there card / section divider' },
  { surface: '--surface-2', border: '--border-soft',   note: 'Resting input / default edge' },
  { surface: '--surface-3', border: '--border-medium', note: 'Hover surface / button edge' },
  { surface: '--surface-4', border: '--border-strong', note: 'Active / pressed / hover-focus edge' },
]

const FONTS = [
  { name: '--font-banner',      sample: 'NUMBER WALL',                     note: 'Archivo Black — identity, big numbers, names in all caps. Monumental.' },
  { name: '--font-program',     sample: 'The game is about to begin.',     note: 'Inter — body copy, inputs, reading. Neutral.' },
  { name: '--font-scoreboard',  sample: 'HEAT  ·  SACRED  ·  WRITTEN',     note: 'IBM Plex Mono — every label, overline, and button. Always uppercase, always tracked.' },
  { name: '--font-handwritten', sample: "You're already one.",             note: 'Rock Salt — taglines and warmth moments. Used sparingly or it loses its meaning.' },
]

const TYPE_RAMP = [
  { name: '--text-h1',      sample: 'Every fan has a number.', note: 'Modal titles · major headings' },
  { name: '--text-h2',      sample: 'THIS IS YOUR WALL',        note: 'Section heads' },
  { name: '--text-body',    sample: 'Claim your identity.',     note: 'Body copy · inputs' },
  { name: '--text-small',   sample: 'Your personal wall',       note: 'Dense body · secondary' },
  { name: '--text-caption', sample: '3 PICKS',                  note: 'Pills · chips · badges' },
  { name: '--text-label',   sample: 'MY NUMBER',                note: 'Eyebrow · all-caps labels' },
  { name: '--text-micro',   sample: 'COACHES',                  note: 'Smallest labels · stat tags' },
]

const SPACE = [1, 2, 3, 4, 5, 6, 7, 8].map((n, i) => ({
  name: `--space-${n}`,
  value: [4, 8, 16, 24, 32, 48, 64, 96][i] + 'px',
}))

const RADII = [
  { name: '--radius-sm', note: 'Inputs, buttons, tiles' },
  { name: '--radius-md', note: 'Cards, chips' },
  { name: '--radius-lg', note: 'Large surfaces, empty CTAs' },
  { name: '--radius-xl', note: 'Hero panels' },
]

// Grid — page grid (12 col) + tile-wall grid (responsive column count).
// The tile wall is the signature layout — density over generous tap targets.
const BREAKPOINTS = [
  { label: 'Mobile',  range: '< 768px',    wallCols: 5,  pageCols: 4,  margin: '24px' },
  { label: 'Tablet',  range: '768px+',     wallCols: 8,  pageCols: 8,  margin: '48px' },
  { label: 'Desktop', range: '1024px+',    wallCols: 10, pageCols: 12, margin: '64px' },
  { label: 'Wide',    range: '1280px+',    wallCols: 12, pageCols: 12, margin: '96px' },
]

// ── Tile language: the soul of the product ────────────────────────────────
// Six heat levels + sacred + selected. These are the meaning-carrying
// elements — everything else is scaffolding around them.

const HEAT_LEVELS = [
  { level: 0, label: 'Unwritten', copy: 'No legend has lived here yet.' },
  { level: 1, label: 'Ember',     copy: 'One voice. A beginning.' },
  { level: 2, label: 'Warm',      copy: 'Two or three. A pattern.' },
  { level: 3, label: 'Hot',       copy: 'Four to six. A conversation.' },
  { level: 4, label: 'Blazing',   copy: 'Seven to nine. A hot topic.' },
  { level: 5, label: 'Inferno',   copy: 'Ten or more. The number is on fire.' },
]

// ── Icon vocabulary — curated from the set actually used in the app ────────

const ICONS = [
  { Icon: Plus,          name: 'Plus',          use: 'Add, create, claim' },
  { Icon: X,             name: 'X',             use: 'Close, remove, dismiss' },
  { Icon: Check,         name: 'Check',         use: 'Confirm, saved, copied' },
  { Icon: Pencil,        name: 'Pencil',        use: 'Edit inline' },
  { Icon: Trash2,        name: 'Trash2',        use: 'Retire / remove permanently' },
  { Icon: Search,        name: 'Search',        use: 'Find a legend / city' },
  { Icon: Undo2,         name: 'Undo2',         use: 'Undo a destructive action' },
  { Icon: ChevronLeft,   name: 'ChevronLeft',   use: 'Back in history' },
  { Icon: ChevronRight,  name: 'ChevronRight',  use: 'Forward / drill in' },
  { Icon: ArrowLeft,     name: 'ArrowLeft',     use: 'Return to the wall' },
  { Icon: ExternalLink,  name: 'ExternalLink',  use: 'Share, open elsewhere' },
  { Icon: Flame,         name: 'Flame',         use: 'Heat, hot streak' },
  { Icon: Star,          name: 'Star',          use: 'Honored, saved' },
  { Icon: Trophy,        name: 'Trophy',        use: 'Championship moments' },
  { Icon: Shield,        name: 'Shield',        use: 'Defense, teams' },
  { Icon: Award,         name: 'Award',         use: 'Individual accolade' },
  { Icon: Zap,           name: 'Zap',           use: 'Fast, electric moment' },
  { Icon: Diamond,       name: 'Diamond',       use: 'Rare, iconic' },
  { Icon: Users,         name: 'Users',         use: 'Contributors, collab' },
  { Icon: MapPin,        name: 'MapPin',        use: 'City / town / location' },
  { Icon: Map,           name: 'Map',           use: 'Browse by place' },
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

function TokenRow({ name, note, children }) {
  return (
    <div className="ds-token-row">
      <div className="ds-token-row__demo">{children}</div>
      <div className="ds-token-row__meta">
        <code className="ds-code">{name}</code>
        {note && <span className="ds-swatch__note">{note}</span>}
      </div>
    </div>
  )
}

// A demo tile that matches wall-scale without running through <WallTile>
// (so we can render any arbitrary heat style, including every team palette).
function DemoTile({ style, number, textColor, size = 80 }) {
  return (
    <div
      className="ds-demo-tile"
      style={{
        width: size,
        height: size,
        background: style.bg,
        border: `1px solid ${style.border}`,
        boxShadow: style.glow !== 'none' ? style.glow : undefined,
      }}
    >
      <span className="ds-demo-tile__num" style={{ color: textColor || style.text }}>
        {number}
      </span>
    </div>
  )
}

// ── The page ───────────────────────────────────────────────────────────────

export default function DesignSystem() {
  return (
    <div className="ds-page">
      {/* ── Banner ────────────────────────────────────────────────── */}
      <header className="ds-banner">
        <div className="ds-banner__eyebrow">INTERNAL REFERENCE · NOT IN NAV</div>
        <h1 className="ds-banner__title">THE NUMBER WALL</h1>
        <h2 className="ds-banner__sub">Design System</h2>
        <p className="ds-banner__lede">
          A system only works if everyone building on it can see it. This page
          renders the product's tokens, tile language, primitives, and icons
          live from the same source files the app ships — so the system can
          never secretly drift. If a color shifts or a token disappears, a
          swatch here breaks first. If a new pattern gets invented, it lives
          here or it doesn't exist.
        </p>
        <p className="ds-banner__lede">
          The goal isn't completeness. The goal is <em>intentionality</em>. Every
          entry on this page earns its place by carrying meaning the product
          depends on. Anything that doesn't carry meaning gets cut.
        </p>
        <nav className="ds-toc" aria-label="Jump to section">
          <a href="#foundations">Foundations</a>
          <a href="#tiles">Tile Language</a>
          <a href="#primitives">Primitives</a>
          <a href="#icons">Iconography</a>
          <a href="#compositions">Compositions</a>
          <Link to="/" className="ds-toc__home">← Back to the wall</Link>
        </nav>
      </header>

      {/* ── 01. Foundations ─────────────────────────────────────── */}
      <Section
        id="foundations"
        eyebrow="01"
        title="Foundations"
        intro="The raw material every screen is assembled from. These tokens are fixed — if a component needs something that isn't here, the system is wrong, not the token."
      >
        <SubSection
          title="Palette"
          note="Seven colors the product thinks in. Heat is energy. Sacred is honored. Muted is frosty, not dim. Paper is clean, not pure white — 100% white flattens on our dark canvas."
        >
          <div className="ds-swatch-grid">
            {PALETTE.map(c => (
              <div key={c.name} className="ds-swatch">
                <div className="ds-swatch__chip" style={{ background: `var(${c.name})` }} />
                <div className="ds-swatch__meta">
                  <code className="ds-code">{c.name}</code>
                  <span className="ds-swatch__note">{c.note}</span>
                </div>
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection
          title="Layers"
          note="Four steps of white-on-dark used together — a surface tint paired with a border tint. Surfaces fill, borders edge. Use them as pairs, matched by strength, so elevation always reads cleanly."
        >
          <div className="ds-layers">
            {LAYERS.map(l => (
              <div
                key={l.surface}
                className="ds-layers__card"
                style={{
                  background: `var(${l.surface})`,
                  border: `1px solid var(${l.border})`,
                }}
              >
                <div className="ds-layers__codes">
                  <code className="ds-code">{l.surface}</code>
                  <code className="ds-code">{l.border}</code>
                </div>
                <span className="ds-swatch__note">{l.note}</span>
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection
          title="Typography · families"
          note="Four typefaces with non-overlapping jobs. Banner for identity. Program for reading. Scoreboard for labels. Handwritten for warmth — use it three times per screen max or it loses its meaning."
        >
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

        <SubSection
          title="Typography · scale"
          note="Seven steps. If a component needs a size that isn't here, add a step to the scale — don't improvise with raw rem."
        >
          <div className="ds-ramp">
            {TYPE_RAMP.map(t => (
              <div key={t.name} className="ds-ramp__row">
                <code className="ds-code ds-ramp__name">{t.name}</code>
                <span className="ds-ramp__sample" style={{ fontSize: `var(${t.name})` }}>
                  {t.sample}
                </span>
                <span className="ds-ramp__note">{t.note}</span>
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection
          title="Spacing"
          note="Eight-step scale on a roughly-doubling rhythm. Used for gap, padding, margin — the same tokens horizontally and vertically so rhythm stays consistent in both directions."
        >
          <div className="ds-space-dual">
            <div className="ds-space-dual__col">
              <span className="ds-space-dual__caption">Horizontal</span>
              {SPACE.map(s => (
                <div key={`h-${s.name}`} className="ds-space__row">
                  <code className="ds-code ds-space__name">{s.name}</code>
                  <span className="ds-space__bar-h" style={{ width: `var(${s.name})` }} />
                  <span className="ds-swatch__note">{s.value}</span>
                </div>
              ))}
            </div>
            <div className="ds-space-dual__col">
              <span className="ds-space-dual__caption">Vertical</span>
              <div className="ds-space-vert">
                {SPACE.map(s => (
                  <div key={`v-${s.name}`} className="ds-space-vert__row">
                    <span className="ds-space__bar-v" style={{ height: `var(${s.name})` }} />
                    <div className="ds-space-vert__labels">
                      <code className="ds-code">{s.name}</code>
                      <span className="ds-swatch__note">{s.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SubSection>

        <SubSection
          title="Radius"
          note="Four steps. Tiles and inputs share sm. Cards get md. Panels get xl. Nothing in the product is perfectly round except pill chips."
        >
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

        <SubSection
          title="Grid"
          note="Two grids, one system. The page grid (12 columns max) holds everything. The tile wall is its own grid — the column count ramps with screen width so the 102-tile field stays visible at any size. Density wins over generous tap targets; seeing the whole wall is the experience."
        >
          <div className="ds-grid-bps">
            {BREAKPOINTS.map(bp => (
              <div key={bp.label} className="ds-grid-bp">
                <div className="ds-grid-bp__head">
                  <span className="ds-grid-bp__label">{bp.label}</span>
                  <span className="ds-swatch__note">{bp.range}</span>
                </div>

                <div className="ds-grid-bp__row">
                  <span className="ds-grid-bp__row-label">Tile wall</span>
                  <div
                    className="ds-grid-bp__tiles"
                    style={{ gridTemplateColumns: `repeat(${bp.wallCols}, 1fr)` }}
                  >
                    {Array.from({ length: bp.wallCols }).map((_, i) => (
                      <span key={i} className="ds-grid-bp__tile" />
                    ))}
                  </div>
                  <code className="ds-code">{bp.wallCols} cols</code>
                </div>

                <div className="ds-grid-bp__row">
                  <span className="ds-grid-bp__row-label">Page grid</span>
                  <div
                    className="ds-grid-bp__cols"
                    style={{ gridTemplateColumns: `repeat(${bp.pageCols}, 1fr)` }}
                  >
                    {Array.from({ length: bp.pageCols }).map((_, i) => (
                      <span key={i} className="ds-grid-bp__col" />
                    ))}
                  </div>
                  <code className="ds-code">{bp.pageCols} cols · {bp.margin}</code>
                </div>
              </div>
            ))}
          </div>

          <div className="ds-grid-tokens">
            <TokenRow name="--grid-max-width" note="1280px — page caps here on wide screens">
              <span className="ds-token-swatch" style={{ width: 80, height: 8, background: 'var(--color-heat)' }} />
            </TokenRow>
            <TokenRow name="--grid-gutter" note="24px between columns at every breakpoint">
              <span className="ds-token-swatch" style={{ width: 'var(--grid-gutter)', height: 8, background: 'var(--color-heat)' }} />
            </TokenRow>
            <TokenRow name="--grid-margin" note="Responsive page margin · 24 / 48 / 64 / 96">
              <span className="ds-token-swatch" style={{ width: 'var(--grid-margin)', height: 8, background: 'var(--color-heat)' }} />
            </TokenRow>
          </div>
        </SubSection>
      </Section>

      {/* ── 02. Tile Language ───────────────────────────────────── */}
      <Section
        id="tiles"
        eyebrow="02"
        title="Tile Language"
        intro="The tile is the product. Its heat, its ring, its glow — these are how The Number Wall communicates which numbers carry weight. Get this wrong and the rest of the system doesn't matter."
      >
        <SubSection
          title="Heat progression · main wall"
          note="Six levels driven by legend count. Unwritten is lights-out. Each step up adds warmth, glow, and text brightness until the number is literally on fire. Orange is the signature color of the product."
        >
          <div className="ds-heat">
            {HEAT_LEVELS.map((h, i) => (
              <div key={h.level} className="ds-heat__item">
                <DemoTile
                  style={HEAT_TILES[i]}
                  number={[88, 7, 23, 19, 4, 12][i]}
                  textColor={HEAT_TILES[i].text}
                />
                <span className="ds-heat__label">{h.label}</span>
                <span className="ds-swatch__note ds-heat__copy">{h.copy}</span>
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection
          title="Sacred & Selected"
          note="Sacred is reserved for the pantheon — numbers synonymous with a single legend across all sports. It's ice-blue, and it transcends team identity on every wall. Selected is the tile you're currently reading — white ring with the underlying heat still bleeding through."
        >
          <div className="ds-special">
            <div className="ds-special__item">
              <DemoTile style={SACRED_TILE} number={9} />
              <div className="ds-special__meta">
                <span className="ds-heat__label">Sacred</span>
                <code className="ds-code">SACRED_TILE</code>
                <span className="ds-swatch__note">Ice blue. Always. Never mixed with team color.</span>
              </div>
            </div>
            <div className="ds-special__item">
              <div
                className="ds-demo-tile"
                style={{
                  width: 80, height: 80,
                  background: HEAT_TILES[3].bg,
                  border: '1px solid rgba(255,255,255,0.82)',
                  boxShadow: `0 0 0 2px rgba(255,255,255,0.45), ${HEAT_TILES[3].glow}`,
                }}
              >
                <span className="ds-demo-tile__num" style={{ color: '#FFFFFF' }}>23</span>
              </div>
              <div className="ds-special__meta">
                <span className="ds-heat__label">Selected</span>
                <code className="ds-code">SELECTED_TILE</code>
                <span className="ds-swatch__note">White ring + heat underneath. Pure white type.</span>
              </div>
            </div>
          </div>
        </SubSection>

        <SubSection
          title="Team palettes"
          note="Ten base colors, each generating a six-step heat progression from the same recipe used on the main wall. Team walls don't have tiers — heat is pure density. Pick a palette per team; the system does the rest."
        >
          <div className="ds-team-palettes">
            {Object.entries(TEAM_PALETTES).map(([key, levels]) => (
              <div key={key} className="ds-team-palette">
                <div className="ds-team-palette__head">
                  <code className="ds-code">{key}</code>
                </div>
                <div className="ds-team-palette__row">
                  {levels.map((style, i) => (
                    <DemoTile
                      key={i}
                      style={style}
                      number={i === 0 ? '' : [1, 3, 6, 9, 12][i - 1]}
                      size={44}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SubSection>
      </Section>

      {/* ── 03. Primitives ──────────────────────────────────────── */}
      <Section
        id="primitives"
        eyebrow="03"
        title="Primitives"
        intro="The atoms the product is assembled from, rendered at real product scale. Reach for these before writing new CSS — extend them with props if you need a variant."
      >
        <SubSection title="WallTile" note="The core atom. One square per number. Heat, ring, and type treatment encode meaning.">
          <div className="ds-tiles">
            <div className="ds-tile-demo">
              <div className="ds-tile-demo__wrap">
                <WallTile number={88} entries={[{ tier: 'UNWRITTEN' }]} isActive={false} onClick={() => {}} />
              </div>
              <span className="ds-swatch__note">Unwritten</span>
            </div>
            <div className="ds-tile-demo">
              <div className="ds-tile-demo__wrap">
                <WallTile number={7}  entries={[{ tier: 'LIT' }]} isActive={false} onClick={() => {}} />
              </div>
              <span className="ds-swatch__note">Lit</span>
            </div>
            <div className="ds-tile-demo">
              <div className="ds-tile-demo__wrap">
                <WallTile number={19} entries={[{ tier: 'HOT' }, { tier: 'LIT' }]} isActive={false} onClick={() => {}} />
              </div>
              <span className="ds-swatch__note">Hot</span>
            </div>
            <div className="ds-tile-demo">
              <div className="ds-tile-demo__wrap">
                <WallTile number={4}  entries={[{ tier: 'SACRED' }]} isActive={false} onClick={() => {}} />
              </div>
              <span className="ds-swatch__note">Sacred</span>
            </div>
            <div className="ds-tile-demo">
              <div className="ds-tile-demo__wrap">
                <WallTile number={23} entries={[{ tier: 'HOT' }]} isActive={true} onClick={() => {}} />
              </div>
              <span className="ds-swatch__note">Selected</span>
            </div>
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

        <SubSection title="Input" note="Flat, dark, no chrome. Focus darkens the border slightly — no glow, no outline shift.">
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

        <SubSection title="Eyebrow" note="Scoreboard overline for section labels. Always uppercase, always tracked-widest, always muted.">
          <div className="ds-eyebrow-demo">
            <span className="tnw-eyebrow">MY WALLS</span>
          </div>
        </SubSection>
      </Section>

      {/* ── 04. Iconography ─────────────────────────────────────── */}
      <Section
        id="icons"
        eyebrow="04"
        title="Iconography"
        intro="Lucide line-art, 1.5–2px stroke, rendered in currentColor so they inherit the surrounding type. Icons carry meaning — a new one earns its way in by doing a job none of these already do."
      >
        <SubSection title="Vocabulary" note="The icons used across the app. Reach for one of these before importing a new glyph.">
          <div className="ds-icon-grid">
            {ICONS.map(({ Icon, name, use }) => (
              <div key={name} className="ds-icon">
                <div className="ds-icon__glyph"><Icon size={20} strokeWidth={2} /></div>
                <code className="ds-code">{name}</code>
                <span className="ds-swatch__note">{use}</span>
              </div>
            ))}
          </div>
        </SubSection>
      </Section>

      {/* ── 05. Compositions ────────────────────────────────────── */}
      <Section
        id="compositions"
        eyebrow="05"
        title="Compositions"
        intro="Patterns proven in the product. When you need one of these, compose it from the primitives above — don't restyle."
      >
        <SubSection title="Tile row" note="Primitive × N. Every wall in the product is a grid of these. Selection lives on one at a time.">
          <div className="ds-comp">
            <div className="ds-tile-row">
              {[1, 4, 7, 12, 19, 23, 77, 99].map((n, i) => (
                <WallTile
                  key={n}
                  number={n}
                  entries={
                    [[{ tier: 'UNWRITTEN' }], [{ tier: 'SACRED' }], [{ tier: 'LIT' }], [{ tier: 'HOT' }],
                     [{ tier: 'LIT' }, { tier: 'LIT' }], [{ tier: 'UNWRITTEN' }],
                     [{ tier: 'SACRED' }], [{ tier: 'UNWRITTEN' }]][i]
                  }
                  isActive={n === 23}
                  onClick={() => {}}
                />
              ))}
            </div>
          </div>
        </SubSection>
      </Section>

      <footer className="ds-footer">
        <p className="ds-footer__line">
          If it's not here, it doesn't exist. If it drifts, this page breaks first.
        </p>
      </footer>
    </div>
  )
}
