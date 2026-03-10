// ============================================================
// PlayerCard
// Single player row inside the panel. Extracted from
// renderPlayerCard() in BostonWall and the inline player card
// in WornNumbers. Now supports defining_moment from editorial layer.
// ============================================================

/**
 * PlayerCard
 *
 * @prop {Player}  player       — Merged player object (see dataUtils.js)
 * @prop {string}  accentColor  — CSS color for stat value. Passed from Panel
 *                                which owns the tier color context.
 * @prop {boolean} [showMoment] — Whether to display defining_moment. Default false.
 *                                Panel passes true for SACRED entries.
 */
export default function PlayerCard({ player, accentColor, showMoment = false }) {
  const {
    name, sport, league, team, era, role, funFact,
    status, stat, statLabel, icon, moment, momentYear,
  } = player;

  const isActive = status === "active" || status === "Active";

  return (
    <div style={{
      borderRadius: "10px",
      padding:      "12px 14px",
      marginBottom: "8px",
      background:   "rgba(0,0,0,0.3)",
      border:       "1px solid rgba(255,255,255,0.1)",
    }}>
      <div style={{
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-between",
        gap:            "8px",
        flexWrap:       "nowrap",
      }}>
        {/* Left: icon + name + meta */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: "22px", flexShrink: 0 }}>{icon}</span>
          <div style={{ minWidth: 0 }}>

            {/* Player name */}
            <div style={{
              fontFamily:    "'Barlow Condensed', Impact, sans-serif",
              fontSize:      "20px",
              fontWeight:    900,
              letterSpacing: "2px",
              lineHeight:    1,
              marginBottom:  "3px",
              color:         "#fff",
              overflow:      "hidden",
              textOverflow:  "ellipsis",
              whiteSpace:    "nowrap",
            }}>
              {name}
            </div>

            {/* Badges row */}
            <div style={{ display: "flex", gap: "5px", alignItems: "center", flexWrap: "wrap" }}>

              {/* Team badge */}
              {team && (
                <span style={{
                  fontSize:      "10px",
                  fontFamily:    "'Space Mono', 'Courier New', monospace",
                  color:         "rgba(255,255,255,0.6)",
                  background:    "rgba(255,255,255,0.08)",
                  border:        "1px solid rgba(255,255,255,0.18)",
                  borderRadius:  "4px",
                  padding:       "2px 7px",
                  letterSpacing: "1px",
                }}>
                  {team}
                </span>
              )}

              {/* Active badge */}
              {isActive && (
                <span style={{
                  fontSize:      "9px",
                  fontFamily:    "'Space Mono', 'Courier New', monospace",
                  color:         "#8FD920",
                  background:    "rgba(143,217,32,0.1)",
                  border:        "1px solid rgba(143,217,32,0.3)",
                  borderRadius:  "4px",
                  padding:       "1px 6px",
                  letterSpacing: "1px",
                }}>
                  ACTIVE
                </span>
              )}

              {/* Era */}
              {era && (
                <span style={{
                  fontSize:   "10px",
                  color:      "rgba(255,255,255,0.45)",
                  fontFamily: "'Space Mono', 'Courier New', monospace",
                }}>
                  {era}
                </span>
              )}

              {/* Role / inclusion note */}
              {role && (
                <span style={{
                  fontSize:   "10px",
                  color:      "rgba(255,255,255,0.35)",
                  fontFamily: "'Space Mono', 'Courier New', monospace",
                }}>
                  {role}
                </span>
              )}
            </div>

            {/* Fun fact (legacy field) */}
            {funFact && (
              <div style={{
                marginTop:  "6px",
                fontSize:   "11px",
                color:      "rgba(255,255,255,0.5)",
                fontFamily: "'Space Mono', 'Courier New', monospace",
                lineHeight: 1.5,
              }}>
                {funFact}
              </div>
            )}

            {/* Defining moment (new editorial field) */}
            {showMoment && moment && (
              <div style={{
                marginTop:  "8px",
                fontSize:   "11px",
                color:      "rgba(255,255,255,0.55)",
                fontFamily: "Georgia, serif",
                fontStyle:  "italic",
                lineHeight: 1.5,
                borderLeft: "2px solid rgba(255,255,255,0.2)",
                paddingLeft: "8px",
              }}>
                {moment}{momentYear ? ` — ${momentYear}` : ""}
              </div>
            )}

          </div>
        </div>

        {/* Right: stat */}
        {stat && (
          <div style={{ textAlign: "right", flexShrink: 0, marginLeft: "8px" }}>
            <div style={{
              fontFamily:    "'Barlow Condensed', Impact, sans-serif",
              fontSize:      "28px",
              fontWeight:    900,
              lineHeight:    1,
              color:         accentColor || "#fff",
            }}>
              {stat}
            </div>
            <div style={{
              fontSize:      "10px",
              color:         "rgba(255,255,255,0.55)",
              fontFamily:    "'Space Mono', 'Courier New', monospace",
              letterSpacing: "1px",
              maxWidth:      "110px",
              textAlign:     "right",
              lineHeight:    1.3,
            }}>
              {statLabel}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
