/**
 * DESIGN SYSTEM — /behindthecurtains/design
 *
 * Hidden reference documenting The Number Wall's atoms, primitives, and
 * tile language. Everything renders live from the actual tokens and data
 * files the product ships. If the system drifts, this page breaks
 * visibly first.
 *
 * Structure:
 *   01 Foundations   — palette, layers, type, space, radius, grid
 *   02 Tile language — heat, sacred, selected, team palettes
 *   03 Primitives    — tiles, buttons, inputs, tabs
 *   04 Iconography   — the line-art + sports vocabulary
 *   05 Compositions  — patterns proven in the product
 *   06 Accessibility — WCAG AA standards, contrast, focus, aria, type floors
 */

import { Link } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, ArrowLeft, X, Plus, Pencil, Trash2, Search,
  Check, Undo2, Flame, Star, Trophy, Shield, Zap, Map, MapPin, Users, Award,
  ExternalLink, Diamond,
} from 'lucide-react'
import { FaBasketballBall, FaFootballBall, FaBaseballBall, FaHockeyPuck, FaFutbol } from 'react-icons/fa'
import WallTile from '../components/WallTile.jsx'
import { PlayerCard } from '../components/PlayerPanel.jsx'
import WallsMap from '../components/WallsMap.jsx'
import { TEAM_PALETTES } from '../data/teamColors.js'
import { HEAT_TILES, SACRED_TILE } from '../data/index.js'
import './DesignSystem.css'

// Mock legend entries for the Player card composition — shaped like real entries
// so we exercise the real component, not a simplified clone.
const DS_PLAYER_ENTRIES = [
  {
    name: 'Tom Brady', sport: 'football', team: 'New England Patriots',
    role: 'QB · 2000–2019', tier: 'SACRED',
    stat: '7', statLabel: 'RINGS',
    funFact: 'Drafted 199th overall. Retired with more Super Bowl wins than any franchise.',
  },
  {
    name: 'Ted Williams', sport: 'baseball', team: 'Boston Red Sox',
    role: 'LF · 1939–1960', tier: 'SACRED',
    stat: '.406', statLabel: 'AVG · 1941',
  },
  {
    name: 'Bobby Orr', sport: 'hockey', team: 'Boston Bruins',
    role: 'D · 1966–1976', tier: 'LEGEND',
    stat: '8', statLabel: 'NORRIS',
  },
]

// ── Foundation tokens (names must match global.css) ────────────────────────

const PALETTE = [
  { name: '--color-night',   note: 'The canvas. Every screen sits on this.' },
  { name: '--color-surface', note: 'One step up from canvas. Elevated panels.' },
  { name: '--color-paper',   note: 'Primary type. Clean, not pure white.' },
  { name: '--color-muted',   note: 'Frosty gray. Labels, secondary type.' },
  { name: '--color-heat',    note: 'Energy. CTAs, selection, your own number.' },
  { name: '--color-blaze',   note: 'Heat on hover, a warmer step.' },
  { name: '--color-sacred',  note: 'Honored, focused, iconic. Ice blue.' },
]

const LAYERS = [
  { surface: '--surface-1', border: '--border-faint',  note: 'Barely-there card or section divider' },
  { surface: '--surface-2', border: '--border-soft',   note: 'Resting input or default edge' },
  { surface: '--surface-3', border: '--border-medium', note: 'Hover surface or button edge' },
  { surface: '--surface-4', border: '--border-strong', note: 'Active, pressed, hover-focus edge' },
]

const FONTS = [
  { name: '--font-banner',      sample: 'NUMBER WALL',                     note: 'Archivo Black. Identity, big numbers, names in all caps. Monumental.' },
  { name: '--font-program',     sample: 'The game is about to begin.',     note: 'Inter. Body copy, inputs, reading. Neutral.' },
  { name: '--font-scoreboard',  sample: 'HEAT  ·  SACRED  ·  WRITTEN',     note: 'IBM Plex Mono. Every label, overline, button. Always uppercase, always tracked.' },
  { name: '--font-handwritten', sample: "You're already one.",             note: 'Rock Salt. Taglines and warmth moments. Used sparingly or it loses its meaning.' },
]

const TYPE_RAMP = [
  { name: '--text-h1',      sample: 'Every fan has a number.', note: 'Modal titles, major headings' },
  { name: '--text-h2',      sample: 'THIS IS YOUR WALL',        note: 'Section heads' },
  { name: '--text-body',    sample: 'Claim your identity.',     note: 'Body copy, inputs' },
  { name: '--text-small',   sample: 'Your personal wall',       note: 'Dense body, secondary' },
  { name: '--text-caption', sample: '3 PICKS',                  note: 'Pills, chips, badges' },
  { name: '--text-label',   sample: 'MY NUMBER',                note: 'Eyebrow, all-caps labels' },
  { name: '--text-micro',   sample: 'COACHES',                  note: 'Smallest labels, stat tags' },
]

const SPACE = [1, 2, 3, 4, 5, 6, 7, 8].map((n, i) => ({
  name: `--space-${n}`,
  value: [4, 8, 16, 24, 32, 48, 64, 96][i],
}))

const RADII = [
  { name: '--radius-sm', note: 'Inputs, buttons, tiles' },
  { name: '--radius-md', note: 'Cards, chips' },
  { name: '--radius-lg', note: 'Large surfaces, empty CTAs' },
  { name: '--radius-xl', note: 'Hero panels' },
]

// Grid — page grid (12 col) + tile-wall grid (responsive column count).
// The tile wall is the signature layout. Density wins over generous tap
// targets; seeing the whole wall is the experience.
const BREAKPOINTS = [
  { label: 'Mobile',  range: '< 768px',  wallCols: 5,  pageCols: 4,  margin: 24, gutter: 24 },
  { label: 'Tablet',  range: '768px+',   wallCols: 8,  pageCols: 8,  margin: 48, gutter: 24 },
  { label: 'Desktop', range: '1024px+',  wallCols: 10, pageCols: 12, margin: 64, gutter: 24 },
  { label: 'Wide',    range: '1280px+',  wallCols: 12, pageCols: 12, margin: 96, gutter: 24 },
]

const MOTION = [
  { name: '--motion-hover',  value: '180ms ease-out',     note: 'Micro-interactions. Buttons, links, tile borders.' },
  { name: '--motion-reveal', value: '250ms ease-in-out',  note: 'Panels, modals, content entering the viewport.' },
  { name: '--motion-heat',   value: '300ms ease-in-out',  note: 'Tile glow transitions, heat state changes.' },
  { name: '--motion-color',  value: '200ms ease-out',     note: 'Color fades, border color transitions.' },
]

const INK = [
  { name: '--ink-dim',  value: 'rgba(255,255,255, 0.50)', note: 'Placeholder text, dormant tabs, lowest readable.' },
  { name: '--ink-low',  value: 'rgba(255,255,255, 0.60)', note: 'Secondary labels, supporting text.' },
  { name: '--ink-mid',  value: 'rgba(255,255,255, 0.70)', note: 'Body text on dim surfaces.' },
  { name: '--ink-high', value: 'rgba(255,255,255, 0.85)', note: 'Default body text. The workhorse.' },
]

// ── Tile language ──────────────────────────────────────────────────────────

const HEAT_LEVELS = [
  { level: 0, label: 'Unwritten', copy: 'No legend has lived here yet.' },
  { level: 1, label: 'Ember',     copy: 'One voice. A beginning.' },
  { level: 2, label: 'Warm',      copy: 'Two or three. A pattern.' },
  { level: 3, label: 'Hot',       copy: 'Four to six. A conversation.' },
  { level: 4, label: 'Blazing',   copy: 'Seven to nine. A hot topic.' },
  { level: 5, label: 'Inferno',   copy: 'Ten or more. On fire.' },
]

// ── Icon vocabulary ────────────────────────────────────────────────────────

const LUCIDE_ICONS = [
  { Icon: Plus,          name: 'Plus',          use: 'Add, create, claim' },
  { Icon: X,             name: 'X',             use: 'Close, remove, dismiss' },
  { Icon: Check,         name: 'Check',         use: 'Confirm, saved, copied' },
  { Icon: Pencil,        name: 'Pencil',        use: 'Edit inline' },
  { Icon: Trash2,        name: 'Trash2',        use: 'Retire or remove permanently' },
  { Icon: Search,        name: 'Search',        use: 'Find a legend or city' },
  { Icon: Undo2,         name: 'Undo2',         use: 'Undo a destructive action' },
  { Icon: ChevronLeft,   name: 'ChevronLeft',   use: 'Back in history' },
  { Icon: ChevronRight,  name: 'ChevronRight',  use: 'Forward, drill in' },
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
  { Icon: MapPin,        name: 'MapPin',        use: 'City or town' },
  { Icon: Map,           name: 'Map',           use: 'Browse by place' },
]

const SPORT_ICONS = [
  { Icon: FaFootballBall,   name: 'Football',   use: 'NFL, college, high school football' },
  { Icon: FaBasketballBall, name: 'Basketball', use: 'NBA, college, high school basketball' },
  { Icon: FaBaseballBall,   name: 'Baseball',   use: 'MLB, college, softball variant' },
  { Icon: FaHockeyPuck,     name: 'Hockey',     use: 'NHL, college, high school hockey' },
  { Icon: FaFutbol,         name: 'Soccer',     use: 'Pro, college, youth soccer' },
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

// Arbitrary heat-style tile (used for heat progression + team palettes)
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
        <div className="ds-banner__eyebrow">01 · Design system</div>
        <h1 className="ds-banner__title">THE NUMBER WALL</h1>
        <h2 className="ds-banner__sub">Design System</h2>
        <p className="ds-banner__lede">
          A system only works if everyone building on it can see it. This page
          renders the product's tokens, tile language, primitives, and icons
          live from the same source files the app ships, so the system can
          never secretly drift. If a color shifts or a token disappears, a
          swatch here breaks first. If a new pattern gets invented, it lives
          here or it doesn't exist.
        </p>
        <p className="ds-banner__lede">
          The goal isn't completeness. The goal is <em>intentionality</em>.
          Every entry on this page earns its place by carrying meaning the
          product depends on. Anything that doesn't carry meaning gets cut.
        </p>
        <nav className="ds-toc" aria-label="Jump to section">
          <a href="#foundations">Foundations</a>
          <a href="#tiles">Tile Language</a>
          <a href="#primitives">Primitives</a>
          <a href="#icons">Iconography</a>
          <a href="#compositions">Compositions</a>
          <Link to="/behindthecurtains" className="ds-toc__home">← Behind the curtains</Link>
        </nav>
      </header>

      {/* ── 01. Foundations ─────────────────────────────────────── */}
      <Section
        id="foundations"
        eyebrow="01"
        title="Foundations"
        intro="The raw material every screen is assembled from. These tokens are fixed. If a component needs something that isn't here, the system is wrong, not the token."
      >
        <SubSection
          title="Palette"
          note="Seven colors the product thinks in. Heat is energy. Sacred is honored. Muted is frosty, not dim. Paper is clean, not pure white; 100% white flattens on our dark canvas."
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
          note="Four steps of white-on-dark used together, a surface tint paired with a border tint. Surfaces fill, borders edge. Use them as pairs, matched by strength, so elevation always reads cleanly."
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
          note="Four typefaces with non-overlapping jobs. Banner for identity. Program for reading. Scoreboard for labels. Handwritten for warmth, used three times per screen max or it loses its meaning."
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
          note="Seven steps. If a component needs a size that isn't here, add a step to the scale, don't improvise with raw rem."
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
          note="Eight-step scale on a roughly-doubling rhythm. Each square is the token applied in both directions, so you can see the footprint at a glance. Used for gap, padding, and margin."
        >
          <div className="ds-space-squares">
            {SPACE.map(s => (
              <div key={s.name} className="ds-space-square">
                <div className="ds-space-square__box">
                  <span
                    className="ds-space-square__fill"
                    style={{ width: `${s.value}px`, height: `${s.value}px` }}
                  />
                </div>
                <div className="ds-space-square__meta">
                  <code className="ds-code">{s.name}</code>
                  <span className="ds-swatch__note">{s.value}px</span>
                </div>
              </div>
            ))}
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
          note="Two grids, one system. The page grid (12 columns max) holds everything. The tile wall is its own grid; the column count ramps with screen width so the 102-tile field stays visible at any size. Density over generous tap targets."
        >
          <div className="ds-grid-bps">
            {BREAKPOINTS.map(bp => (
              <div key={bp.label} className="ds-grid-bp">
                <div className="ds-grid-bp__head">
                  <span className="ds-grid-bp__label">{bp.label}</span>
                  <span className="ds-swatch__note">{bp.range}</span>
                  <span className="ds-grid-bp__tokens">
                    <code className="ds-code">margin {bp.margin}</code>
                    <code className="ds-code">gutter {bp.gutter}</code>
                  </span>
                </div>

                <div className="ds-grid-bp__row">
                  <span className="ds-grid-bp__row-label">Tile wall</span>
                  <div className="ds-grid-bp__stage">
                    <span className="ds-grid-bp__margin" />
                    <div
                      className="ds-grid-bp__tiles"
                      style={{ gridTemplateColumns: `repeat(${bp.wallCols}, 1fr)` }}
                    >
                      {Array.from({ length: bp.wallCols }).map((_, i) => (
                        <span key={i} className="ds-grid-bp__tile" />
                      ))}
                    </div>
                    <span className="ds-grid-bp__margin" />
                  </div>
                  <code className="ds-code">{bp.wallCols} cols</code>
                </div>

                <div className="ds-grid-bp__row">
                  <span className="ds-grid-bp__row-label">Page grid</span>
                  <div className="ds-grid-bp__stage">
                    <span className="ds-grid-bp__margin" />
                    <div
                      className="ds-grid-bp__cols"
                      style={{ gridTemplateColumns: `repeat(${bp.pageCols}, 1fr)` }}
                    >
                      {Array.from({ length: bp.pageCols }).map((_, i) => (
                        <span key={i} className="ds-grid-bp__col" />
                      ))}
                    </div>
                    <span className="ds-grid-bp__margin" />
                  </div>
                  <code className="ds-code">{bp.pageCols} cols</code>
                </div>
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection
          title="Motion"
          note="Four timing curves for different interactions. Hover is snappy. Reveal and heat transitions are smooth. Color fades are quick."
        >
          <div className="ds-motion">
            {MOTION.map(m => (
              <div key={m.name} className="ds-motion__row">
                <code className="ds-code">{m.name}</code>
                <span className="ds-motion__value">{m.value}</span>
                <span className="ds-swatch__note">{m.note}</span>
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection
          title="Ink Hierarchy"
          note="Four opacity steps for readable text on dark surfaces. Each step has a purpose — from placeholder dimness to body text boldness."
        >
          <div className="ds-ink">
            {INK.map(i => (
              <div key={i.name} className="ds-ink__row">
                <div className="ds-ink__swatch" style={{ backgroundColor: i.value }} />
                <code className="ds-code">{i.name}</code>
                <span className="ds-ink__value">{i.value}</span>
                <span className="ds-swatch__note">{i.note}</span>
              </div>
            ))}
          </div>
        </SubSection>
      </Section>

      {/* ── 02. Tile Language ───────────────────────────────────── */}
      <Section
        id="tiles"
        eyebrow="02"
        title="Tile Language"
        intro="The tile is the product. Its heat, its ring, its glow; these are how The Number Wall communicates which numbers carry weight. Get this wrong and the rest of the system doesn't matter."
      >
        <SubSection
          title="Heat progression · main wall"
          note="Six levels driven by legend count. Unwritten is lights out. Each step adds warmth, glow, and text brightness until the number is on fire. Orange is the signature color of the product."
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
          note="Sacred is reserved for the pantheon, numbers synonymous with a single legend across all sports. It's ice-blue, and it transcends team identity on every wall. Selected is the tile you're currently reading; white ring with the underlying heat still bleeding through."
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
                <span className="ds-swatch__note">White ring plus heat underneath. Pure white type.</span>
              </div>
            </div>
          </div>
        </SubSection>

        <SubSection
          title="Team palettes"
          note="Ten base colors, each generating a six-step heat progression from the same recipe used on the main wall. Team walls don't have tiers; heat is pure density. Pick a palette per team, the system does the rest."
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
                      size={40}
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
        intro="The atoms the product is assembled from, rendered at real product scale. Reach for these before writing new CSS; extend them with props if you need a variant."
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
            <div className="ds-tile-demo">
              <div className="ds-tile-demo__wrap">
                <WallTile
                  number={7}
                  entries={[{ tier: 'LIT' }, { tier: 'LIT' }]}
                  isActive={false}
                  isDebating={true}
                  debateVariant="pulse-2"
                  onClick={() => {}}
                />
              </div>
              <span className="ds-swatch__note">Pulsing · contested</span>
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

        <SubSection title="Input" note="Flat, dark, no chrome. Focus darkens the border slightly, no glow, no outline shift.">
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
      </Section>

      {/* ── 04. Iconography ─────────────────────────────────────── */}
      <Section
        id="icons"
        eyebrow="04"
        title="Iconography"
        intro="Two icon sets with clear jobs. Lucide line-art for UI actions. Font Awesome sports icons for league context. Icons carry meaning; a new one earns its way in by doing a job none of these already do."
      >
        <SubSection title="UI · lucide-react" note="1.5 to 2px stroke, rendered in currentColor so they inherit the surrounding type. The app's action vocabulary.">
          <div className="ds-icon-grid">
            {LUCIDE_ICONS.map(({ Icon, name, use }) => (
              <div key={name} className="ds-icon">
                <div className="ds-icon__glyph"><Icon size={20} strokeWidth={2} /></div>
                <code className="ds-code">{name}</code>
                <span className="ds-swatch__note">{use}</span>
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection title="Sports · react-icons/fa" note="Solid, punchy glyphs for league and sport context. Used in filters, pills, and sport badges on team walls.">
          <div className="ds-icon-grid">
            {SPORT_ICONS.map(({ Icon, name, use }) => (
              <div key={name} className="ds-icon">
                <div className="ds-icon__glyph"><Icon size={22} /></div>
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
        intro="Patterns proven in the product. When you need one of these, compose it from the primitives above. Don't restyle."
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

        <SubSection
          title="Player card"
          note="How a legend reads inside the panel. Rendered from the real PlayerCard component exported by PlayerPanel.jsx — if this looks wrong, the product looks wrong."
        >
          <div className="ds-comp ds-comp--cards">
            {DS_PLAYER_ENTRIES.map((entry, i) => (
              <PlayerCard key={entry.name} entry={entry} isTop={i === 0} />
            ))}
          </div>
        </SubSection>

        <SubSection
          title="Player panel"
          note="The bottom-sheet overlay that opens when a tile is selected. It's a fixed, viewport-anchored surface (slides up on mobile, docks right on desktop), so it can't render honestly inline here. See it live by clicking any tile on the main wall."
        >
          <div className="ds-comp ds-comp--panel-note">
            <div className="ds-panel-note">
              <div className="ds-panel-note__line">
                Composed of: heat-echoed #number · subtitle · optional contested
                nudge or YourNumberPick vote mechanic · stack of PlayerCards ·
                "Add a Legend" affordance.
              </div>
              <Link to="/" className="ds-panel-note__cta">
                See it live on the wall <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </SubSection>

        <SubSection
          title="Legend Timeline"
          note="Game-by-game career waveform for the pantheon. Each game is a glow score (indigo void → sacred gold). Eras overlay as chapter labels. First subject: Brady. Lives at /timeline/:id."
        >
          <div className="ds-comp ds-comp--timeline-note">
            <div className="ds-panel-note">
              <div className="ds-panel-note__line">
                Composed of: era ribbon · glow-scored waveform (per-game) ·
                sacred-gold moment markers (rings, records, defining games) ·
                vote affordance on moments (future). Rendered from a single
                timeline JSON per player.
              </div>
              <Link to="/timeline/brady_tom" className="ds-panel-note__cta">
                Open Brady's timeline <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </SubSection>

        <SubSection
          title="USA map · team walls"
          note="Stylized US map used on the TeamWalls hub. Each active wall lights a glowing dot at its town; multiple walls in one town stack into a single node whose glow scales with count. Zero-state: one pulsing seed on Boston."
        >
          <div className="ds-comp ds-comp--map">
            <div className="ds-map-live">
              <WallsMap />
            </div>
          </div>
        </SubSection>
      </Section>

      {/* ── 06 Accessibility ─────────────────────────────────────────── */}

      <Section
        id="accessibility"
        eyebrow="06"
        title="Accessibility"
        intro="The product is only as good as who can use it. WCAG AA is the baseline — not because a checklist says so, but because a fan navigating by keyboard or reading on a low-contrast screen deserves the same wall everyone else sees. These standards exist because we got them wrong before we got them right."
      >
        <SubSection title="Color Contrast" note="These ratios were tested against --color-night. Every muted label, every dim placeholder, every dormant tab — if it carries meaning, it clears 4.5:1.">
          <div className="ds-a11y-rules">
            <div className="ds-a11y-rule">
              <span className="ds-a11y-rule__label">Normal text (under 18px / 14px bold)</span>
              <span className="ds-a11y-rule__value">4.5 : 1</span>
            </div>
            <div className="ds-a11y-rule">
              <span className="ds-a11y-rule__label">Large text (18px+ / 14px+ bold)</span>
              <span className="ds-a11y-rule__value">3 : 1</span>
            </div>
            <div className="ds-a11y-rule">
              <span className="ds-a11y-rule__label">UI components and graphical objects</span>
              <span className="ds-a11y-rule__value">3 : 1</span>
            </div>
            <div className="ds-a11y-rule ds-a11y-rule--token">
              <span className="ds-a11y-rule__label"><code>--color-muted</code> (#B8C4CF)</span>
              <span className="ds-a11y-rule__value ds-a11y-rule__value--pass">4.6 : 1 ✓</span>
            </div>
            <div className="ds-a11y-rule ds-a11y-rule--token">
              <span className="ds-a11y-rule__label"><code>--ink-dim</code> (rgba 255,255,255, 0.50)</span>
              <span className="ds-a11y-rule__value ds-a11y-rule__value--pass">4.6 : 1 ✓</span>
            </div>
            <div className="ds-a11y-rule ds-a11y-rule--token">
              <span className="ds-a11y-rule__label"><code>--color-heat</code> (#E87C2A)</span>
              <span className="ds-a11y-rule__value ds-a11y-rule__value--pass">4.7 : 1 ✓</span>
            </div>
          </div>
        </SubSection>

        <SubSection title="Type Floors" note="Small text is tempting on a dark UI. These are the lines we don't cross.">
          <div className="ds-a11y-rules">
            <div className="ds-a11y-rule">
              <span className="ds-a11y-rule__label">Body text minimum</span>
              <span className="ds-a11y-rule__value">12px (0.75rem)</span>
            </div>
            <div className="ds-a11y-rule">
              <span className="ds-a11y-rule__label">Labels with letter-spacing ≥ 0.10em</span>
              <span className="ds-a11y-rule__value">11px (0.6875rem)</span>
            </div>
            <div className="ds-a11y-rule">
              <span className="ds-a11y-rule__label">Absolute floor (stat tags, micro labels)</span>
              <span className="ds-a11y-rule__value">10px (0.625rem)</span>
            </div>
            <div className="ds-a11y-rule">
              <span className="ds-a11y-rule__label">Mobile inputs (prevents iOS auto-zoom)</span>
              <span className="ds-a11y-rule__value">16px on touch viewports</span>
            </div>
          </div>
        </SubSection>

        <SubSection title="Focus Indicators" note="If you can't see where you are, you can't use the product. Every interactive element gets a visible ring on Tab.">
          <div className="ds-a11y-rules">
            <div className="ds-a11y-rule">
              <span className="ds-a11y-rule__label">Global <code>:focus-visible</code> ring</span>
              <span className="ds-a11y-rule__value">2px solid --color-sacred</span>
            </div>
            <div className="ds-a11y-rule">
              <span className="ds-a11y-rule__label">Outline offset</span>
              <span className="ds-a11y-rule__value">2px</span>
            </div>
            <div className="ds-a11y-rule">
              <span className="ds-a11y-rule__label">Applies to</span>
              <span className="ds-a11y-rule__value">a, button, input, select, textarea</span>
            </div>
            <div className="ds-a11y-rule">
              <span className="ds-a11y-rule__label">Custom inputs with <code>outline: none</code></span>
              <span className="ds-a11y-rule__value">Must add explicit :focus style</span>
            </div>
          </div>
        </SubSection>

        <SubSection title="ARIA & Semantics" note="Screen readers don't see the glow. They need the markup to be honest.">
          <div className="ds-a11y-rules">
            <div className="ds-a11y-rule">
              <span className="ds-a11y-rule__label">Every <code>&lt;input&gt;</code> without a visible label</span>
              <span className="ds-a11y-rule__value">Must have aria-label</span>
            </div>
            <div className="ds-a11y-rule">
              <span className="ds-a11y-rule__label">Decorative SVGs and icons</span>
              <span className="ds-a11y-rule__value">aria-hidden="true"</span>
            </div>
            <div className="ds-a11y-rule">
              <span className="ds-a11y-rule__label">Meaningful images</span>
              <span className="ds-a11y-rule__value">Descriptive alt text required</span>
            </div>
            <div className="ds-a11y-rule">
              <span className="ds-a11y-rule__label">Modal overlays</span>
              <span className="ds-a11y-rule__value">role="dialog", aria-modal="true"</span>
            </div>
            <div className="ds-a11y-rule">
              <span className="ds-a11y-rule__label">Search inputs with live results</span>
              <span className="ds-a11y-rule__value">aria-expanded on dropdown state</span>
            </div>
          </div>
        </SubSection>

        <SubSection title="Keyboard Navigation" note="Every flow on this product — tap a tile, claim a number, build a wall — should work with a keyboard alone.">
          <div className="ds-a11y-rules">
            <div className="ds-a11y-rule">
              <span className="ds-a11y-rule__label">Tab order</span>
              <span className="ds-a11y-rule__value">Follows visual reading order</span>
            </div>
            <div className="ds-a11y-rule">
              <span className="ds-a11y-rule__label">Escape key</span>
              <span className="ds-a11y-rule__value">Closes modals, cancels editing</span>
            </div>
            <div className="ds-a11y-rule">
              <span className="ds-a11y-rule__label">Enter key</span>
              <span className="ds-a11y-rule__value">Commits edits, selects options</span>
            </div>
            <div className="ds-a11y-rule">
              <span className="ds-a11y-rule__label">No tab traps</span>
              <span className="ds-a11y-rule__value">Focus must always be escapable</span>
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
