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
 */

import { Link } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, ArrowLeft, X, Plus, Pencil, Trash2, Search,
  Check, Undo2, Flame, Star, Trophy, Shield, Zap, Map, MapPin, Users, Award,
  ExternalLink, Diamond,
} from 'lucide-react'
import { FaBasketballBall, FaFootballBall, FaBaseballBall, FaHockeyPuck, FaFutbol } from 'react-icons/fa'
import WallTile from '../components/WallTile.jsx'
import { TEAM_PALETTES } from '../data/teamColors.js'
import { HEAT_TILES, SACRED_TILE } from '../data/index.js'
import './DesignSystem.css'

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
          note="How a legend reads at a glance inside a panel. Number leads, name follows, one line of metadata. The sport icon sits with the metadata, never the number."
        >
          <div className="ds-comp ds-comp--cards">
            <div className="ds-player-card">
              <div className="ds-player-card__num">12</div>
              <div className="ds-player-card__body">
                <div className="ds-player-card__name">TOM BRADY</div>
                <div className="ds-player-card__meta">
                  <FaFootballBall size={12} />
                  <span>Patriots · QB · 2000–2019</span>
                </div>
              </div>
            </div>
            <div className="ds-player-card">
              <div className="ds-player-card__num ds-player-card__num--sacred">9</div>
              <div className="ds-player-card__body">
                <div className="ds-player-card__name">TED WILLIAMS</div>
                <div className="ds-player-card__meta">
                  <FaBaseballBall size={12} />
                  <span>Red Sox · LF · 1939–1960</span>
                </div>
                <div className="ds-player-card__flag">SACRED</div>
              </div>
            </div>
            <div className="ds-player-card">
              <div className="ds-player-card__num">4</div>
              <div className="ds-player-card__body">
                <div className="ds-player-card__name">BOBBY ORR</div>
                <div className="ds-player-card__meta">
                  <FaHockeyPuck size={12} />
                  <span>Bruins · D · 1966–1976</span>
                </div>
              </div>
            </div>
          </div>
        </SubSection>

        <SubSection
          title="Player panel"
          note="What opens when a tile is selected. The number echoes the tile that was tapped. Stacked cards when a number has more than one legend."
        >
          <div className="ds-comp ds-comp--panel">
            <div className="ds-panel-demo">
              <div className="ds-panel-demo__head">
                <span className="ds-panel-demo__eyebrow">NUMBER 12 · BOSTON</span>
                <button className="ds-panel-demo__close" aria-label="Close"><X size={16} /></button>
              </div>
              <div className="ds-panel-demo__num">12</div>
              <div className="ds-panel-demo__stack">
                <div className="ds-player-card">
                  <div className="ds-player-card__num">12</div>
                  <div className="ds-player-card__body">
                    <div className="ds-player-card__name">TOM BRADY</div>
                    <div className="ds-player-card__meta">
                      <FaFootballBall size={12} />
                      <span>Patriots · QB · 2000–2019</span>
                    </div>
                  </div>
                </div>
                <div className="ds-player-card">
                  <div className="ds-player-card__num">12</div>
                  <div className="ds-player-card__body">
                    <div className="ds-player-card__name">JERRY YORK</div>
                    <div className="ds-player-card__meta">
                      <FaHockeyPuck size={12} />
                      <span>BC · coach · 1994–2022</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SubSection>

        <SubSection
          title="Locals row"
          note="The row pattern used to surface a short, dense list of picks tied to a place, team, or theme. A tile anchors the row; the right side fills with names."
        >
          <div className="ds-comp ds-comp--locals">
            <div className="ds-locals-row">
              <div className="ds-locals-row__tile">
                <DemoTile style={HEAT_TILES[3]} number={7} size={56} />
              </div>
              <div className="ds-locals-row__body">
                <span className="ds-locals-row__title">LOCALS · NUMBER 7</span>
                <span className="ds-locals-row__list">
                  Phil Esposito · Ray Bourque · John Havlicek · Trot Nixon
                </span>
              </div>
              <ChevronRight size={18} className="ds-locals-row__arrow" />
            </div>
            <div className="ds-locals-row">
              <div className="ds-locals-row__tile">
                <DemoTile style={SACRED_TILE} number={4} size={56} />
              </div>
              <div className="ds-locals-row__body">
                <span className="ds-locals-row__title">SACRED · NUMBER 4</span>
                <span className="ds-locals-row__list">
                  Bobby Orr · Lou Gehrig · Dan Marino · Brett Favre
                </span>
              </div>
              <ChevronRight size={18} className="ds-locals-row__arrow" />
            </div>
          </div>
        </SubSection>

        <SubSection
          title="City map"
          note="The map view for a town or school. A single pin anchors the place, a short stack of the town's legends lives alongside. Used on /walls/town/:slug and the towns index."
        >
          <div className="ds-comp ds-comp--map">
            <div className="ds-map-demo">
              <div className="ds-map-demo__canvas">
                <svg viewBox="0 0 240 140" className="ds-map-demo__svg" aria-hidden="true">
                  <path d="M10 110 Q40 90 70 100 T130 95 T200 105 L230 120 L230 140 L10 140 Z" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)" />
                  <path d="M20 80 Q60 60 100 70 T180 70 T230 80" fill="none" stroke="rgba(255,255,255,0.08)" strokeDasharray="3 4" />
                </svg>
                <span className="ds-map-demo__pin">
                  <MapPin size={22} />
                </span>
              </div>
              <div className="ds-map-demo__card">
                <span className="ds-map-demo__label">MILTON, MA</span>
                <span className="ds-map-demo__count">14 LEGENDS</span>
              </div>
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
