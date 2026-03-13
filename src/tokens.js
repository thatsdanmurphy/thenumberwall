/**
 * THE NUMBER WALL — Design Tokens
 * Source of truth. Every value comes from here.
 * Token names are fixed. Values adjust during build.
 */

export const tokens = {

  // ─── Color ────────────────────────────────────────────────────────────────

  color: {
    night:    '#080C10',  // Page background — the field
    surface:  '#0D1117',  // Cards, panels, tiles
    paper:    '#F5F7FA',  // Primary text, numbers
    muted:    '#9BA7B4',  // Secondary text, metadata
    heat:     '#E87C2A',  // Heat orange — legend density signal
    blaze:    '#F5C135',  // Blaze yellow — heat scale endpoint
    sacred:   '#C8DCFF',  // Sacred ice — league-wide retirements only
    action:   '#FFFFFF',  // Hover targets, focus states
    border:   'rgba(255, 255, 255, 0.08)',  // Card edges, dividers
  },

  // ─── Heat Scale ───────────────────────────────────────────────────────────
  // Tile background stays color.surface always.
  // Heat is an overlay on top — surface bleeds through at every step.

  heat: {
    unwritten: { color: 'transparent',  opacity: 0    },
    ember:     { color: '#E87C2A',       opacity: 0.06 },
    warm:      { color: '#E87C2A',       opacity: 0.18 },
    hot:       { color: '#E87C2A',       opacity: 0.35 },
    blazing:   { color: '#F5C135',       opacity: 0.55 },
    inferno:   { color: '#F5C135',       opacity: 0.80 },
    // Reserved — not used in v1:
    // absolute: { color: '#F5F7FA',     opacity: 0.90 },
  },

  // Tile number text inverts above hot to preserve readability
  // Below hot: color.paper — Above hot: color.night
  heatTextThreshold: 'hot',

  // ─── Team Colors ──────────────────────────────────────────────────────────
  // Electrified for dark UI. Scales with city expansion.

  team: {
    sox:      '#E8182E',  // Red Sox — official red, punched up
    bruins:   '#FFB81C',  // Bruins — official gold, already electric
    celtics:  '#00C267',  // Celtics — official green, pushed brighter
    patriots: '#1A72FF',  // Patriots — navy (#002244) electrified to bright blue
  },

  // ─── Interactive States ───────────────────────────────────────────────────

  interactive: {
    idle:     '#E87C2A',  // color.heat
    hover:    '#F5C135',  // color.blaze
    focus:    '#C8DCFF',  // color.sacred — cool contrast for accessibility
    disabled: '#9BA7B4',  // color.muted
  },

  // ─── Typography ───────────────────────────────────────────────────────────
  // Four registers. Hierarchy is fixed and never crosses.

  font: {
    banner:      '"Archivo Black", sans-serif',  // Jersey numbers, player names, titles
    program:     '"Inter", sans-serif',           // Body, nav, UI
    scoreboard:  '"IBM Plex Mono", monospace',    // Stats, positions, years
    handwritten: '"Rock Salt", cursive',           // Tagline — handwritten stadium energy
  },

  type: {
    // Archivo Black — banner register
    tileLg:   { size: '2.5rem',     lineHeight: 1   },  // Tile number, desktop
    tileMd:   { size: '2rem',       lineHeight: 1   },  // Tile number, tablet
    tileSm:   { size: '1.5rem',     lineHeight: 1   },  // Tile number, mobile
    display:  { size: '1.5rem',     lineHeight: 1.1 },  // Card name, section title
    label:    { size: '0.875rem',   lineHeight: 1.2 },  // Filter pill, nav

    // Inter — program register
    body:     { size: '0.9375rem',  weight: 400, lineHeight: 1.5 },
    bodySm:   { size: '0.8125rem',  weight: 400, lineHeight: 1.5 },
    ui:       { size: '0.875rem',   weight: 500, lineHeight: 1.2 },
    uiSm:     { size: '0.75rem',    weight: 600, lineHeight: 1   },

    // IBM Plex Mono — scoreboard register
    mono:      { size: '0.875rem',  weight: 400, lineHeight: 1.2 },
    monoSm:    { size: '0.75rem',   weight: 400, lineHeight: 1.2 },
    monoLabel: { size: '0.75rem',   weight: 600, lineHeight: 1   },
  },

  // ─── Spacing ──────────────────────────────────────────────────────────────
  // 8pt base. Multiples of 8, or 4px half-steps for tight internal spacing.

  space: {
    1: '4px',   // Icon padding, tight internal
    2: '8px',   // Inner content padding
    3: '16px',  // Component gap
    4: '24px',  // Section padding
    5: '32px',  // Large section gap
    6: '48px',  // Major section breaks
    7: '64px',  // Page-level padding
    8: '96px',  // Maximum breathing room
  },

  // ─── Grid ─────────────────────────────────────────────────────────────────

  grid: {
    cols:          12,
    gutter:        '24px',
    maxWidth:      '1280px',
    margin: {
      mobile:  '24px',
      tablet:  '48px',
      desktop: '64px',
      wide:    '96px',   // 1440px+
    },
  },

  // ─── Breakpoints ──────────────────────────────────────────────────────────

  bp: {
    sm:  '480px',
    md:  '768px',
    lg:  '1024px',
    xl:  '1280px',
  },

  // ─── Tile Grid ────────────────────────────────────────────────────────────
  // 102 tiles (0, 00, 1–99). Square, 1:1. Min size 32px.

  tileGrid: {
    cols: {
      mobile:  8,
      tablet:  8,
      desktop: 10,
      wide:    12,
    },
    minSize: '32px',
  },

  // ─── Panel ────────────────────────────────────────────────────────────────

  panel: {
    ratioGrid:  '61.8%',
    ratioPanel: '38.2%',
    maxWidth:   '480px',
  },

  // ─── Motion ───────────────────────────────────────────────────────────────
  // Stadium lights warming up — slow and warm, not UI snappy.
  // No bounce. No spring. No overshoot.

  motion: {
    hover:  '180ms ease-out',
    reveal: '250ms ease-in-out',
    heat:   '300ms ease-in-out',
    color:  '200ms ease-out',
  },

};

export default tokens;
