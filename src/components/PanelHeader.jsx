// ============================================================
// PanelHeader
// Panel top section. Extracted from renderPanelHeader() in WornNumbers.
// Big number, subtitle line, optional sacred badge, close button.
// ============================================================

/**
 * PanelHeader
 *
 * @prop {number}   number      — Selected jersey number
 * @prop {string}   tier        — SACRED | LEGEND | ACTIVE | UNWRITTEN
 * @prop {Player[]} players     — Filtered player array (drives subtitle)
 * @prop {object}   tierColor   — Color object from TIER_COLOR[tier]
 * @prop {string}   filterLabel — Current filter label for subtitle line
 * @prop {function} onClose     — () => void
 */
export default function PanelHeader({ number, tier, players, tierColor, filterLabel, onClose }) {

  // ── Subtitle logic ───────────────────────────────────────────
  let subtitle;
  if (tier === "SACRED") {
    subtitle = players.map(p => p.name).join(" · ") || "SACRED NUMBER";
  } else if (tier === "UNWRITTEN") {
    subtitle = "UNWRITTEN";
  } else {
    const count = players.length;
    subtitle = count === 0
      ? "NO LEGENDS FOR THIS NUMBER"
      : `${count} LEGEND${count !== 1 ? "S" : ""} WORE THIS`;
  }

  // ── Sacred badge label ───────────────────────────────────────
  const sacredBadgeLabel = (() => {
    const sacredSport = players[0]?.league;
    if (sacredSport === "NBA")      return "RETIRED NBA-WIDE";
    if (sacredSport === "MLB")      return "RETIRED MLB-WIDE";
    if (sacredSport === "NHL")      return "RETIRED NHL-WIDE";
    if (sacredSport === "NFL")      return "RETIRED NFL-WIDE";
    return "RETIRED LEAGUE-WIDE";
  })();

  const textColor   = tierColor?.text   || "#fff";
  const borderColor = tierColor?.border || "rgba(255,255,255,0.4)";

  return (
    <div style={{
      display:        "flex",
      alignItems:     "flex-start",
      justifyContent: "space-between",
      marginBottom:   "16px",
      gap:            "12px",
    }}>
      {/* Left: number + subtitle */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>

        {/* Big number */}
        <div style={{
          fontFamily:    "'Barlow Condensed', Impact, sans-serif",
          fontSize:      "64px",
          fontWeight:    900,
          lineHeight:    1,
          letterSpacing: "2px",
          color:         textColor,
          textShadow:    `0 0 30px ${borderColor}`,
        }}>
          #{number}
        </div>

        {/* Subtitle block */}
        <div>
          {/* Filter context label */}
          <div style={{
            fontFamily:    "'Space Mono', 'Courier New', monospace",
            fontSize:      "9px",
            letterSpacing: "2px",
            color:         "rgba(255,255,255,0.35)",
            marginBottom:  "4px",
            whiteSpace:    "nowrap",
          }}>
            {filterLabel || "ALL"} — JERSEY NUMBER
          </div>

          {/* Main subtitle */}
          <div style={{
            fontFamily:    "'Barlow Condensed', Impact, sans-serif",
            fontSize:      "15px",
            fontWeight:    900,
            letterSpacing: "1px",
            color:         "rgba(255,255,255,0.7)",
            lineHeight:    1.2,
          }}>
            {subtitle}
          </div>

          {/* Sacred badge */}
          {tier === "SACRED" && (
            <div style={{
              display:       "inline-block",
              marginTop:     "4px",
              background:    "rgba(200,220,255,0.1)",
              border:        "1px solid rgba(200,220,255,0.35)",
              borderRadius:  "6px",
              padding:       "2px 8px",
              fontSize:      "10px",
              color:         "#C8DCFF",
              fontFamily:    "'Space Mono', 'Courier New', monospace",
              letterSpacing: "2px",
            }}>
              {sacredBadgeLabel}
            </div>
          )}
        </div>

      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          background:    "rgba(255,255,255,0.08)",
          border:        "1px solid rgba(255,255,255,0.2)",
          borderRadius:  "8px",
          color:         "rgba(255,255,255,0.6)",
          cursor:        "pointer",
          padding:       "6px 12px",
          fontSize:      "12px",
          fontFamily:    "'Space Mono', 'Courier New', monospace",
          whiteSpace:    "nowrap",
          transition:    "all 0.2s",
          flexShrink:    0,
        }}
        onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.15)"; e.currentTarget.style.color = "white"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "rgba(255,255,255,0.6)"; }}
      >
        X
      </button>
    </div>
  );
}
