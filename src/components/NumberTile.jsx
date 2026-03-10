// ============================================================
// NumberTile
// Single grid cell. Extracted from renderCell() in both walls.
// No internal state. No inline colors — all from tokens.js.
// ============================================================

import { heatStep, teamHeatStep, HEAT } from "../tokens.js";

// SACRED numbers and which sport context they belong to
const SACRED_SPORT = { 6: "NBA", 23: "NBA", 42: "MLB", 99: "NHL" };

/**
 * NumberTile
 *
 * @prop {number}    num          — Jersey number to display (0–99)
 * @prop {Player[]}  players      — Filtered player array for this number (may be empty)
 * @prop {Player[]}  allPlayers   — All players regardless of filter (drives heat)
 * @prop {string}    tier         — SACRED | LEGEND | ACTIVE | UNWRITTEN
 * @prop {boolean}   isSelected   — Whether this cell is currently selected
 * @prop {function}  onClick      — () => void
 * @prop {string}    teamFilter   — Current team filter: "ALL" or team display name
 * @prop {string}    [sportFilter]— Current sport filter for main wall ("ALL", "Hockey", etc.)
 */
export default function NumberTile({
  num,
  players,
  allPlayers,
  tier,
  isSelected,
  onClick,
  teamFilter = "ALL",
  sportFilter = "ALL",
}) {
  const hasPlayers  = players.length > 0;
  const filterCount = players.length;
  const allCount    = allPlayers.length;

  // ── Effective tier for color purposes ───────────────────────
  // SACRED cells downgrade to LEGEND color when the current filter
  // doesn't match the sacred sport — but tier prop is never mutated.
  const sacredSport = SACRED_SPORT[num];
  const sacredActive =
    tier === "SACRED" &&
    (teamFilter === "ALL" && sportFilter === "ALL") ||
    (sacredSport && sportFilter === sacredSport);
  const effectiveTier = tier === "SACRED" && !sacredActive ? "LEGEND" : tier;

  // ── Color resolution ─────────────────────────────────────────
  let colors;

  if (isSelected) {
    colors = HEAT.selected;
  } else if (!hasPlayers && teamFilter !== "ALL") {
    // Dimmed — filtered out
    colors = { ...HEAT.unwritten, glow: "none" };
  } else if (teamFilter !== "ALL") {
    // Team-specific heat
    const teamName = players[0]?.team || "";
    colors = teamHeatStep(teamName, filterCount, false);
  } else {
    // All-team orange heat — player count drives intensity
    colors = heatStep(allCount, false);
    // SACRED override — white/ice even on heat scale
    if (effectiveTier === "SACRED" && !isSelected) {
      colors = {
        bg:     "rgba(220,235,255,0.12)",
        border: "rgba(200,220,255,0.55)",
        glow:   "0 0 18px rgba(200,220,255,0.45), 0 0 36px rgba(180,210,255,0.15)",
        text:   "rgba(230,240,255,0.95)",
      };
    }
  }

  return (
    <div
      style={{
        aspectRatio:    "1",
        borderRadius:   "5px",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        background:     isSelected ? "rgba(255,255,255,0.15)" : colors.bg,
        border:         `1px solid ${isSelected ? "rgba(255,255,255,0.8)" : colors.border}`,
        boxShadow:      isSelected
          ? `0 0 0 2px rgba(255,255,255,0.5), ${colors.glow}`
          : colors.glow,
        color:          isSelected ? "#fff" : colors.text,
        fontFamily:     "'Barlow Condensed', Impact, sans-serif",
        fontSize:       "12px",
        fontWeight:     900,
        letterSpacing:  "1px",
        cursor:         hasPlayers ? "pointer" : "default",
        transition:     "transform 0.15s ease, box-shadow 0.15s ease",
        userSelect:     "none",
      }}
      onClick={() => hasPlayers && onClick()}
      onMouseEnter={e => { if (hasPlayers) e.currentTarget.style.transform = "scale(1.18)"; e.currentTarget.style.zIndex = 10; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.zIndex = ""; }}
    >
      {num}
    </div>
  );
}
