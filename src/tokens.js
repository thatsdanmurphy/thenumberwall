// ============================================================
// THE NUMBER WALL — Design Tokens
// Sprint 1 Design Language Spec · March 2026
// Single source of truth. No component hardcodes values.
// ============================================================

// ── TYPOGRAPHY ───────────────────────────────────────────────
export const FONTS = {
  monument: "'Barlow Condensed', Impact, sans-serif",  // Numbers, names, titles
  data:     "'Space Mono', 'Courier New', monospace",  // Stats, labels, tags, metadata
  accent:   "'Playfair Display', Georgia, serif",       // Taglines only — nowhere else
};

export const FONT_IMPORT =
  "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@900&family=Space+Mono&family=Playfair+Display:ital@1&display=swap";

// Type scale — 5 levels, every text element maps to exactly one
export const TYPE = {
  T1: { fontFamily: FONTS.monument, fontSize: "64px", fontWeight: 900, letterSpacing: "2px" },   // Hero number (mobile). 96px desktop.
  T2: { fontFamily: FONTS.monument, fontSize: "36px", fontWeight: 900, letterSpacing: "3px" },   // Section title: THE BOSTON WALL
  T3: { fontFamily: FONTS.monument, fontSize: "21px", fontWeight: 900, letterSpacing: "2px" },   // Card title: player name
  T4: { fontFamily: FONTS.data,     fontSize: "10px", fontWeight: 400, letterSpacing: "1px" },   // Labels, tags, metadata, era, PICK A NUMBER
  T5: { fontFamily: FONTS.accent,   fontSize: "20px", fontStyle: "italic" },                      // Tagline: "Legends live here." — nowhere else
  STAT: { fontFamily: FONTS.monument, fontSize: "28px", fontWeight: 900, lineHeight: 1 },         // Stat numbers — monument register, not data
  TILE: { fontFamily: FONTS.monument, fontSize: "12px", fontWeight: 900, letterSpacing: "1px" },  // Tile numbers — small but monument
};


// ── COLOR TOKENS ─────────────────────────────────────────────

// Foundation
export const COLOR = {
  bg:          "#080C10",                    // FIELD — stadium at night. Blue-black, never neutral.
  surface:     "#0D1117",                    // SURFACE — panel/card bg. Floats above the field.
  surface2:    "#141A23",                    // SURFACE RAISED — hover states, active cards.
  border:      "#1E2A38",                    // BORDER — dividers. Quiet. Organizes, doesn't shout.

  heat:        "#E87C2A",                    // HEAT — orange's only role. Tiles, glow, stat numbers.
  heatHi:      "#FF8C42",                    // HEAT PEAK — inferno tier (6+ players) only.

  action:      "#FFFFFF",                    // ACTION — interaction language. Share, active pill, close, selected ring.
  actionDim:   "rgba(255,255,255,0.45)",     // ACTION INACTIVE — inactive pills, secondary labels.

  text:        "#F0F0F0",                    // TEXT — primary body. Off-white.
  muted:       "#8899AA",                    // MUTED — metadata, fun facts, secondary labels.
  frost:       "#B8D4F0",                    // FROST — passive/info states: back link, PICK A NUMBER, coming soon.
  sacred:      "#C8DCFF",                    // SACRED ICE — reserved exclusively for #6, #23, #42, #99. Nothing else.
  active:      "rgba(255,248,235,0.95)",     // ACTIVE WARM-WHITE — currently playing. Cream-warm, distinct from sacred ice.
};


// ── HEAT SCALE — Tile Colors ──────────────────────────────────
// Six named steps. Orange earns brightness through legend density.
export const HEAT = {
  unwritten: {
    bg:     "rgba(255,255,255,0.06)",
    border: "rgba(255,255,255,0.22)",
    glow:   "none",
    text:   "rgba(255,255,255,0.42)",
  },
  ember: {                                   // 1 player
    bg:     "rgba(150,30,0,0.35)",
    border: "rgba(200,55,0,0.45)",
    glow:   "0 0 6px rgba(200,55,0,0.3)",
    text:   "rgba(220,110,50,0.9)",
  },
  warm: {                                    // 2 players
    bg:     "rgba(180,40,0,0.45)",
    border: "rgba(240,70,5,0.6)",
    glow:   "0 0 10px rgba(240,70,5,0.4), 0 0 20px rgba(220,60,0,0.15)",
    text:   "rgba(255,145,65,1)",
  },
  hot: {                                     // 3 players
    bg:     "rgba(200,50,0,0.55)",
    border: "rgba(255,85,10,0.75)",
    glow:   "0 0 14px rgba(255,85,10,0.55), 0 0 28px rgba(255,70,0,0.25)",
    text:   "rgba(255,170,85,1)",
  },
  blazing: {                                 // 4–5 players
    bg:     "rgba(210,60,0,0.65)",
    border: "rgba(255,100,20,0.9)",
    glow:   "0 0 18px rgba(255,100,20,0.7), 0 0 36px rgba(255,80,0,0.35)",
    text:   "rgba(255,190,100,1)",
  },
  inferno: {                                 // 6+ players
    bg:     "rgba(220,70,0,0.75)",
    border: "rgba(255,120,20,1)",
    glow:   "0 0 22px rgba(255,120,20,0.85), 0 0 44px rgba(255,80,0,0.45), 0 0 60px rgba(255,60,0,0.2)",
    text:   "rgba(255,210,120,1)",
  },
  selected: {                                // Any selected tile — white ring, action language
    bg:     "rgba(255,255,255,0.15)",
    border: "rgba(255,255,255,0.8)",
    glow:   "0 0 0 2px rgba(255,255,255,0.5)",
    text:   "#FFFFFF",
  },
};

// Helper: resolve heat step from player count
export function heatStep(count, isSelected) {
  if (isSelected) return HEAT.selected;
  if (count === 0) return HEAT.unwritten;
  if (count === 1) return HEAT.ember;
  if (count === 2) return HEAT.warm;
  if (count === 3) return HEAT.hot;
  if (count <= 5)  return HEAT.blazing;
  return HEAT.inferno;
}


// ── TIER COLORS ───────────────────────────────────────────────
// Four tiers. Immediately legible at a glance — no label needed.
export const TIER_COLOR = {
  SACRED: {
    text:   "#C8DCFF",
    border: "rgba(200,220,255,0.55)",
    glow:   "0 0 18px rgba(200,220,255,0.45), 0 0 36px rgba(180,210,255,0.15)",
    bg:     "rgba(220,235,255,0.12)",
    badge:  "rgba(200,220,255,0.12)",
    accent: "#C8DCFF",
  },
  LEGEND: {
    text:   "rgba(255,150,80,1)",
    border: "rgba(255,80,0,0.55)",
    glow:   "0 0 12px rgba(255,80,0,0.4), 0 0 28px rgba(255,80,0,0.15)",
    bg:     "rgba(200,50,0,0.45)",
    badge:  "rgba(255,80,0,0.12)",
    accent: "#FF8C42",
  },
  RISING: {
    text:   "rgba(255,248,235,0.95)",
    border: "rgba(255,255,255,0.4)",
    glow:   "0 0 10px rgba(255,248,235,0.2)",
    bg:     "rgba(255,248,235,0.08)",
    badge:  "rgba(255,248,235,0.08)",
    accent: "rgba(255,248,235,0.95)",
  },
  UNWRITTEN: {
    text:   "rgba(255,255,255,0.42)",
    border: "rgba(255,255,255,0.22)",
    glow:   "none",
    bg:     "rgba(255,255,255,0.06)",
    badge:  "rgba(255,255,255,0.05)",
    accent: "rgba(255,255,255,0.2)",
  },
};


// ── BOSTON WALL — Team Color Tokens ──────────────────────────
// Electrified for dark mode legibility on #080C10.
// Each team: primary RGB + full tile color object.
// Formula: same opacity steps as heat scale, color swapped to team primary.

export const TEAM_COLORS = {
  "Boston Bruins": {
    // Official gold #FFB81C → electrified to vivid stadium gold
    primary: "#FFC200",
    r: 255, g: 194, b: 0,
    text:    "rgba(255,240,140,1)",
    border:  "rgba(255,210,40,0.88)",
    glow:    "0 0 20px rgba(255,210,40,0.75), 0 0 40px rgba(255,180,0,0.3)",
    dark:    "rgba(255,194,0,0.18)",
  },
  "Boston Celtics": {
    // Official green #007A33 → electrified to vivid kelly green
    primary: "#00C050",
    r: 0, g: 192, b: 80,
    text:    "rgba(140,255,170,1)",
    border:  "rgba(0,210,90,0.88)",
    glow:    "0 0 20px rgba(0,210,90,0.72), 0 0 40px rgba(0,180,70,0.28)",
    dark:    "rgba(0,192,80,0.18)",
  },
  "Boston Red Sox": {
    // Official crimson #BD3039 → electrified to hot stadium red
    primary: "#E8203A",
    r: 232, g: 32, b: 58,
    text:    "rgba(255,160,165,1)",
    border:  "rgba(255,55,75,0.88)",
    glow:    "0 0 20px rgba(255,55,75,0.78), 0 0 40px rgba(220,20,45,0.3)",
    dark:    "rgba(232,32,58,0.18)",
  },
  "New England Patriots": {
    // Official navy #002244 → electrified to vivid patriot blue
    primary: "#1A5FCC",
    r: 26, g: 95, b: 200,
    text:    "rgba(180,215,255,1)",
    border:  "rgba(80,145,255,0.88)",
    glow:    "0 0 20px rgba(80,145,255,0.68), 0 0 40px rgba(30,90,210,0.28)",
    dark:    "rgba(26,95,200,0.18)",
  },
  "Boston Patriots": {
    // Legacy name — same as New England Patriots
    primary: "#1A5FCC",
    r: 26, g: 95, b: 200,
    text:    "rgba(180,215,255,1)",
    border:  "rgba(80,145,255,0.88)",
    glow:    "0 0 20px rgba(80,145,255,0.68), 0 0 40px rgba(30,90,210,0.28)",
    dark:    "rgba(26,95,200,0.18)",
  },
  "Brooklyn Dodgers": {
    primary: "#005A9C",
    r: 0, g: 90, b: 156,
    text:    "rgba(128,196,255,1)",
    border:  "rgba(0,130,220,0.7)",
    glow:    "0 0 14px rgba(0,130,220,0.45), 0 0 28px rgba(0,90,156,0.2)",
    dark:    "rgba(0,90,156,0.18)",
  },
};

// Helper: get team color object, fallback to heat orange
export const DEFAULT_TEAM_COLOR = {
  primary: "#E87C2A",
  r: 232, g: 124, b: 42,
  text:    "rgba(255,180,80,1)",
  border:  "rgba(232,124,42,0.6)",
  glow:    "0 0 14px rgba(232,124,42,0.4)",
  dark:    "rgba(232,124,42,0.15)",
};

export function teamColor(teamName) {
  return TEAM_COLORS[teamName] || DEFAULT_TEAM_COLOR;
}

// Helper: derive tile colors from team color + player count
export function teamHeatStep(teamName, count, isSelected) {
  if (isSelected) return HEAT.selected;
  if (count === 0) return HEAT.unwritten;
  const tc = teamColor(teamName);
  const { r, g, b } = tc;
  const steps = [
    { intensity: 0.32, glowSize: 8,  glowOpacity: 0.55, borderOpacity: 0.75 },
    { intensity: 0.48, glowSize: 14, glowOpacity: 0.70, borderOpacity: 0.85 },
    { intensity: 0.60, glowSize: 18, glowOpacity: 0.80, borderOpacity: 0.92 },
    { intensity: 0.72, glowSize: 24, glowOpacity: 0.88, borderOpacity: 0.97 },
    { intensity: 0.82, glowSize: 30, glowOpacity: 0.95, borderOpacity: 1.00 },
  ];
  const idx = Math.min(count - 1, steps.length - 1);
  const s = steps[idx];
  return {
    bg:     `rgba(${r},${g},${b},${s.intensity})`,
    border: `rgba(${r},${g},${b},${s.borderOpacity})`,
    glow:   `0 0 ${s.glowSize}px rgba(${r},${g},${b},${s.glowOpacity}), 0 0 ${s.glowSize * 2}px rgba(${r},${g},${b},${s.glowOpacity * 0.4})`,
    text:   tc.text,
  };
}


// ── SPACING SCALE ─────────────────────────────────────────────
// 8pt base. Every spacing value is a multiple of 8. No exceptions.
export const SPACE = {
  1: "4px",    // Tile gap (mobile), micro spacing, badge padding
  2: "8px",    // Card internal padding, icon gap, tight label spacing
  3: "16px",   // Card padding, section internal gap, filter pill padding
  4: "24px",   // Panel section gap, header bottom padding
  5: "32px",   // Between major sections, city wall card padding
  6: "48px",   // Page section separation (grid → city wall)
  7: "64px",   // Large section padding, city wall top/bottom
};


// ── GRID SYSTEM ───────────────────────────────────────────────
export const GRID = {
  // Layout grid
  columns:        12,
  gutterMobile:   "16px",   // --space-3
  gutterDesktop:  "24px",   // --space-4
  maxWidth:       "1440px",
  desktopSplit:   { grid: "61.8%", panel: "38.2%" },  // golden ratio approximation

  // Breakpoints
  mobile:   700,   // < 700px: single column, bottom sheet
  desktop:  960,   // ≥ 960px: split panel layout

  // Tile grid columns by breakpoint
  tileColumns: {
    xs:      8,   // < 480px
    sm:      10,  // 480–699px
    md:      11,  // 700–959px
    lg:      11,  // ≥ 960px
  },

  // Tile gap by breakpoint
  tileGap: {
    xs:  "4px",
    sm:  "4px",
    md:  "5px",
    lg:  "6px",
  },

  // Vertical rhythm
  headerHeight:     "96px",
  gridTopPadding:   "16px",   // --space-3
  gridToCityGap:    "48px",   // --space-6
  bottomSheetMax:   "72vh",
  desktopPanelPad:  "20px",   // --space-4
};


// ── MOTION ────────────────────────────────────────────────────
// Deliberate and sparse. Weighted, not bouncy.
export const MOTION = {
  tile:       "transform 0.15s ease, box-shadow 0.15s ease",  // Hover scale
  tileScale:  "scale(1.18)",
  panel:      "0.35s cubic-bezier(0.32,0.72,0,1)",            // Bottom sheet slide — weighted deceleration
  card:       "0.3s ease",                                     // cardIn keyframe
  pill:       "all 0.2s ease",                                 // Filter pill active state
  share:      "all 0.15s ease",                                // Share button hover
};


// ── CSS CUSTOM PROPERTIES ─────────────────────────────────────
// Call injectTokens() once at app root to make tokens available as CSS vars.
export function injectTokens() {
  const css = `
    :root {
      /* Foundation */
      --color-bg:         ${COLOR.bg};
      --color-surface:    ${COLOR.surface};
      --color-surface-2:  ${COLOR.surface2};
      --color-border:     ${COLOR.border};
      --color-heat:       ${COLOR.heat};
      --color-heat-hi:    ${COLOR.heatHi};
      --color-action:     ${COLOR.action};
      --color-action-dim: ${COLOR.actionDim};
      --color-text:       ${COLOR.text};
      --color-muted:      ${COLOR.muted};
      --color-frost:      ${COLOR.frost};
      --color-sacred:     ${COLOR.sacred};
      --color-active:     ${COLOR.active};

      /* Spacing */
      --space-1: ${SPACE[1]};
      --space-2: ${SPACE[2]};
      --space-3: ${SPACE[3]};
      --space-4: ${SPACE[4]};
      --space-5: ${SPACE[5]};
      --space-6: ${SPACE[6]};
      --space-7: ${SPACE[7]};

      /* Team colors (Boston) */
      --color-team-bruins:   ${TEAM_COLORS["Boston Bruins"].primary};
      --color-team-celtics:  ${TEAM_COLORS["Boston Celtics"].primary};
      --color-team-sox:      ${TEAM_COLORS["Boston Red Sox"].primary};
      --color-team-pats:     ${TEAM_COLORS["New England Patriots"].primary};

      /* Typography */
      --font-monument: ${FONTS.monument};
      --font-data:     ${FONTS.data};
      --font-accent:   ${FONTS.accent};

      /* Motion */
      --motion-tile:  ${MOTION.tile};
      --motion-panel: ${MOTION.panel};
      --motion-pill:  ${MOTION.pill};
    }
  `;
  const style = document.createElement("style");
  style.setAttribute("data-tokens", "numberwall");
  style.textContent = css;
  document.head.appendChild(style);
}


// ── TEAM ID MAP ───────────────────────────────────────────────
// Bridges snake_case team_id (from CSVs) to display name + colors.
// The new data model uses team_id; this map connects it to the
// existing TEAM_COLORS token without duplicating color values.

export const TEAM_ID_MAP = {
  boston_bruins: {
    display: "Boston Bruins",
    sport:   "Hockey",
    league:  "NHL",
    colors:  TEAM_COLORS["Boston Bruins"],
  },
  boston_celtics: {
    display: "Boston Celtics",
    sport:   "Basketball",
    league:  "NBA",
    colors:  TEAM_COLORS["Boston Celtics"],
  },
  boston_red_sox: {
    display: "Boston Red Sox",
    sport:   "Baseball",
    league:  "MLB",
    colors:  TEAM_COLORS["Boston Red Sox"],
  },
  new_england_patriots: {
    display: "New England Patriots",
    sport:   "Football",
    league:  "NFL",
    colors:  TEAM_COLORS["New England Patriots"],
  },
  boston_patriots: {
    display: "Boston Patriots",
    sport:   "Football",
    league:  "NFL",
    colors:  TEAM_COLORS["Boston Patriots"],
  },
  brooklyn_dodgers: {
    display: "Brooklyn Dodgers",
    sport:   "Baseball",
    league:  "MLB",
    colors:  TEAM_COLORS["Brooklyn Dodgers"],
  },
};

// Helper: team_id → team info (with graceful fallback)
export function teamFromId(team_id) {
  if (!team_id) return { display: "", sport: null, league: null, colors: DEFAULT_TEAM_COLOR };
  return TEAM_ID_MAP[team_id] ?? {
    display: team_id.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
    sport:   null,
    league:  null,
    colors:  DEFAULT_TEAM_COLOR,
  };
}
