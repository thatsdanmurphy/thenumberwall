/**
 * ENGINEERING — /behindthecurtains/engineering
 *
 * How the product is built, explained for two audiences at once:
 * a non-technical person who wants to understand what's under the hood,
 * and a senior engineer who wants to see if the decisions are sound.
 *
 * Living page: data counts, heat swatches, tier weights, and token
 * breakdowns are rendered from the same source files the app ships.
 * If the data changes, this page changes with it.
 */

import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, Layers, Database, Palette, GitBranch, Rocket, BookOpen } from 'lucide-react'
import { wallData, bostonLegends, bostonCurrent, bcLegends, HEAT_TILES, SACRED_TILE, TILE_NUMBERS } from '../../data/index.js'
import { TIER_WEIGHT, TIER_DESC } from '../../data/tiers.js'
import './engineering.css'

// ── Live stats ────────────────────────────────────────────────────────────────

const LIVE_STATS = [
  { label: 'Global legends',  value: wallData.filter(e => e.tier !== 'UNWRITTEN').length },
  { label: 'Boston legends',  value: bostonLegends.length },
  { label: 'Boston current',  value: bostonCurrent.length },
  { label: 'BC legends',      value: bcLegends.length },
  { label: 'Tile numbers',    value: TILE_NUMBERS.length },
  { label: 'Heat levels',     value: HEAT_TILES.length },
]

// ── Stack ─────────────────────────────────────────────────────────────────────

const STACK = [
  { name: 'React 19',          why: 'UI library. Components compose into pages; state stays local until it can\'t.' },
  { name: 'Vite 5',            why: 'Build tool. Sub-second hot reload in dev, tree-shaken bundle in prod.' },
  { name: 'React Router 6',    why: 'Client-side routing. Every URL is a real page — no hash fragments.' },
  { name: 'Supabase',          why: 'Backend. Postgres database, auth, and row-level security. No custom server.' },
  { name: 'Vercel',            why: 'Hosting and deploys. Push to main, it\'s live in under a minute.' },
  { name: 'Lucide React',      why: 'Icons. One consistent set, tree-shakeable, no icon font bloat.' },
  { name: 'React Simple Maps', why: 'USA map for the team walls hub. SVG, no heavy geo libraries.' },
]

// ── Repo shape ────────────────────────────────────────────────────────────────

const FOLDERS = [
  { name: 'src/pages/',       count: 26, desc: 'One file per route. WallPage, BostonPage, TeamWallPage, TimelinePage, etc.' },
  { name: 'src/components/',  count: 42, desc: 'Shared building blocks. WallGrid, WallTile, PlayerPanel, IdentityTiles, LegendTimeline.' },
  { name: 'src/data/',        count: 17, desc: 'Static JSON walls + JS indexes. The content layer. No fetch, no loading spinner.' },
  { name: 'src/lib/',         count: 8,  desc: 'Supabase clients, vote store, profanity filter, identity. The plumbing.' },
  { name: 'src/styles/',      count: 1,  desc: 'global.css — 62 design tokens. Every color, font, space, and radius in one file.' },
]

// ── Conventions ───────────────────────────────────────────────────────────────

const RULES = [
  {
    name: 'Compose → Modify → Tokenize',
    what: 'Build with existing pieces first. Only create a new component when nothing existing can be extended. Only introduce a new token when the value carries meaning the product depends on.',
    why: 'Keeps the system small. A codebase with 200 one-off components is a graveyard. A codebase that reuses 40 components well is a product.',
  },
  {
    name: 'No raw values',
    what: 'No rgba(), no rem, no px in component CSS. Every value comes from a token in global.css. If a value doesn\'t have a token, it either earns one or it doesn\'t belong.',
    why: 'Makes the design system enforceable. When someone reads the CSS, every value traces back to a decision.',
  },
  {
    name: 'CSS class prefixes',
    what: 'Each page or component owns a prefix: wall- for WallGrid, ds- for DesignSystem, sm- for Sitemap, fl- for Flows, eng- for this page. No global class collisions.',
    why: 'No CSS modules or styled-components needed. Prefixes are simpler and the cascade stays predictable.',
  },
  {
    name: 'Data is static until it can\'t be',
    what: 'The global wall, Boston wall, BC wall — all static JSON imported at build time. Team walls and personal walls hit Supabase because they\'re user-generated. Nothing else does.',
    why: 'Zero loading states on the main wall. The product feels instant because it is.',
  },
  {
    name: 'Every file has a banner comment',
    what: 'Every JSX and CSS file opens with a block comment: what the file does, why it exists, and any rules it follows. Not JSDoc — prose.',
    why: 'Future-you at 11pm reads the first ten lines of a file before reading the code. Make those lines count.',
  },
]

// ── Pipeline ──────────────────────────────────────────────────────────────────

const PIPELINE = [
  { step: 'Code',   desc: 'React components + static JSON in a Vite project.', icon: Layers },
  { step: 'Build',  desc: 'vite build → tree-shaken ES modules, hashed assets.', icon: GitBranch },
  { step: 'Deploy', desc: 'git push main → Vercel picks it up → live in ~45s.', icon: Rocket },
]

// ── Heat swatch ───────────────────────────────────────────────────────────────

const HEAT_LABELS = ['Unwritten', 'Ember', 'Warm', 'Hot', 'Blazing', 'Inferno']

function HeatSwatch({ level, style, label }) {
  return (
    <div className="eng-heat__swatch">
      <div
        className="eng-heat__tile"
        style={{
          background: style.bg,
          borderColor: style.border,
          boxShadow: style.glow,
          color: style.text,
        }}
      >
        {String(level).padStart(2, '0')}
      </div>
      <span className="eng-heat__label">{label}</span>
    </div>
  )
}

// ── Tier row ──────────────────────────────────────────────────────────────────

function TierRow({ name, weight, desc }) {
  return (
    <div className="eng-tier__row">
      <span className="eng-tier__name">{name}</span>
      <span className="eng-tier__weight">{weight}</span>
      <span className="eng-tier__desc">{desc}</span>
    </div>
  )
}

// ── The page ──────────────────────────────────────────────────────────────────

export default function Engineering() {
  return (
    <div className="eng-page">
      {/* ── Banner ──────────────────────────────────────────────── */}
      <header className="eng-banner">
        <div className="eng-banner__eyebrow">04 · Engineering</div>
        <h1 className="eng-banner__title">HOW IT'S BUILT</h1>
        <p className="eng-banner__lede">
          The stack, the structure, and the trade-offs — explained for anyone.
          A product manager can understand what powers The Number Wall after
          reading this page. A senior engineer can evaluate whether the
          decisions are sound. Both should leave knowing why things are shaped
          the way they are.
        </p>
        <p className="eng-banner__lede">
          Numbers on this page are <em>live</em>. They're computed from the
          same data files the product ships. If a legend is added or a
          component is created, these counts change with the next deploy.
        </p>
      </header>

      {/* ── Live pulse ──────────────────────────────────────────── */}
      <section className="eng-section">
        <h2 className="eng-section__title"><Database size={18} /> The Data at a Glance</h2>
        <p className="eng-section__lede">
          These numbers are pulled live from the data layer — the same JSON
          files that render the wall you see on the homepage. Nothing is
          hard-coded on this page.
        </p>
        <div className="eng-stats">
          {LIVE_STATS.map(s => (
            <div key={s.label} className="eng-stats__card">
              <span className="eng-stats__value">{s.value}</span>
              <span className="eng-stats__label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Stack ───────────────────────────────────────────────── */}
      <section className="eng-section">
        <h2 className="eng-section__title"><Layers size={18} /> The Stack</h2>
        <p className="eng-section__lede">
          Eight dependencies in production. That's it. Every library earns its
          place by solving a problem no other library in the list already
          solves. The goal isn't minimalism for its own sake — it's knowing
          exactly what's in the box and why.
        </p>
        <div className="eng-stack">
          {STACK.map(s => (
            <div key={s.name} className="eng-stack__card">
              <span className="eng-stack__name">{s.name}</span>
              <span className="eng-stack__why">{s.why}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Shape ───────────────────────────────────────────────── */}
      <section className="eng-section">
        <h2 className="eng-section__title"><BookOpen size={18} /> The Shape</h2>
        <p className="eng-section__lede">
          Five folders. Each one has a job, and nothing lives outside its job.
          Pages render routes. Components are shared pieces. Data is the
          content layer. Lib is the plumbing. Styles is one file — the design
          system.
        </p>
        <div className="eng-folders">
          {FOLDERS.map(f => (
            <div key={f.name} className="eng-folders__row">
              <code className="eng-folders__name">{f.name}</code>
              <span className="eng-folders__count">{f.count} files</span>
              <span className="eng-folders__desc">{f.desc}</span>
            </div>
          ))}
        </div>
        <p className="eng-section__note">
          Total: {FOLDERS.reduce((n, f) => n + f.count, 0)} source files across
          five directories. One CSS file holds every token.
        </p>
      </section>

      {/* ── Heat system ─────────────────────────────────────────── */}
      <section className="eng-section">
        <h2 className="eng-section__title"><Palette size={18} /> The Heat System</h2>
        <p className="eng-section__lede">
          Every tile on the wall glows based on how many legends have worn that
          number — and how significant those legends are. Six heat levels, from
          unwritten (dark, invisible) to inferno (blazing orange-gold). The
          swatches below are rendered from the same style objects the real
          tiles use.
        </p>
        <div className="eng-heat">
          {HEAT_TILES.map((style, i) => (
            <HeatSwatch key={i} level={i} style={style} label={HEAT_LABELS[i]} />
          ))}
          <HeatSwatch level="S" style={SACRED_TILE} label="Sacred" />
        </div>
      </section>

      {/* ── Tier system ─────────────────────────────────────────── */}
      <section className="eng-section">
        <h2 className="eng-section__title">The Tier System</h2>
        <p className="eng-section__lede">
          Every legend is assigned a tier. Tier isn't subjective — it's a
          defined classification with a numeric weight that feeds into the heat
          system. Higher weight means the tile burns hotter. These values are
          imported from <code>data/tiers.js</code> — the same file the product reads.
        </p>
        <div className="eng-tiers">
          <div className="eng-tier__header">
            <span>Tier</span>
            <span>Weight</span>
            <span>Meaning</span>
          </div>
          {Object.entries(TIER_WEIGHT).map(([name, weight]) => (
            <TierRow key={name} name={name} weight={weight} desc={TIER_DESC[name]} />
          ))}
        </div>
      </section>

      {/* ── Conventions ─────────────────────────────────────────── */}
      <section className="eng-section">
        <h2 className="eng-section__title">The Rules</h2>
        <p className="eng-section__lede">
          Five conventions this codebase follows. Not because rules are fun —
          because a solo founder building fast needs guardrails that prevent
          the kind of drift you only notice six months later when nothing
          composes anymore.
        </p>
        <div className="eng-rules">
          {RULES.map(r => (
            <div key={r.name} className="eng-rules__card">
              <h3 className="eng-rules__name">{r.name}</h3>
              <p className="eng-rules__what">{r.what}</p>
              <p className="eng-rules__why"><strong>Why it matters:</strong> {r.why}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pipeline ────────────────────────────────────────────── */}
      <section className="eng-section">
        <h2 className="eng-section__title"><Rocket size={18} /> The Pipeline</h2>
        <p className="eng-section__lede">
          Three steps from code to production. No staging environment, no
          approval queue, no deploy scripts. Push to main, it's live. The
          simplicity is the point — a solo founder can't afford ceremony.
        </p>
        <div className="eng-pipeline">
          {PIPELINE.map((p, i) => (
            <div key={p.step} className="eng-pipeline__cell">
              <div className="eng-pipeline__box">
                <p.icon size={20} className="eng-pipeline__icon" />
                <span className="eng-pipeline__step">{p.step}</span>
                <span className="eng-pipeline__desc">{p.desc}</span>
              </div>
              {i < PIPELINE.length - 1 && (
                <ArrowRight size={18} className="eng-pipeline__arrow" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Links ───────────────────────────────────────────────── */}
      <section className="eng-section">
        <h2 className="eng-section__title">See It Live</h2>
        <p className="eng-section__lede">
          The best documentation for a design system is the design system
          itself. The best documentation for a route structure is the sitemap.
          Everything referenced on this page has a living sibling page you can
          open.
        </p>
        <div className="eng-links">
          <Link to="/behindthecurtains/design" className="eng-links__item">
            <span>Design System</span>
            <span className="eng-links__note">Tokens, tiles, primitives, icons — all rendered live</span>
            <ArrowUpRight size={14} />
          </Link>
          <Link to="/behindthecurtains/sitemap" className="eng-links__item">
            <span>Sitemap</span>
            <span className="eng-links__note">Every route as a tree, with status and counts</span>
            <ArrowUpRight size={14} />
          </Link>
          <Link to="/behindthecurtains/flows" className="eng-links__item">
            <span>Flows</span>
            <span className="eng-links__note">The user journeys that carry weight</span>
            <ArrowUpRight size={14} />
          </Link>
          <Link to="/" className="eng-links__item">
            <span>The Wall</span>
            <span className="eng-links__note">The product itself — everything above, rendered in one screen</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="eng-footer">
        <p className="eng-footer__line">
          If the code is the product, the documentation is the mirror.
        </p>
      </footer>
    </div>
  )
}
