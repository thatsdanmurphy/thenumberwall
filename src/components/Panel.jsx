// ============================================================
// Panel
// Full side/bottom panel. Orchestrates: PanelHeader + PlayerCard
// list + share button. Handles null, empty, and populated states.
// ============================================================

import { useState } from "react";
import { TIER_COLOR } from "../tokens.js";
import PanelHeader from "./PanelHeader.jsx";
import PlayerCard  from "./PlayerCard.jsx";

/**
 * Panel
 *
 * @prop {number|null} selected    — Currently selected number, or null
 * @prop {Player[]}    players     — Filtered player array for selected number
 * @prop {object}      data        — Full data object: { tier, players[] }
 * @prop {string}      filterLabel — Current team/sport filter label for header
 * @prop {string}      wall        — "main" | "boston" — drives share URL
 * @prop {function}    onClose     — () => void
 */
export default function Panel({ selected, players, data, filterLabel, wall = "main", onClose }) {
  const [shareCopied, setShareCopied] = useState(false);

  // ── Null state ───────────────────────────────────────────────
  if (selected === null) {
    return (
      <div style={{
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        justifyContent: "center",
        height:         "100%",
        minHeight:      "200px",
        gap:            "12px",
      }}>
        <div style={{
          fontFamily:    "'Barlow Condensed', Impact, sans-serif",
          fontSize:      "32px",
          fontWeight:    900,
          letterSpacing: "3px",
          color:         "rgba(255,255,255,0.1)",
        }}>
          {wall === "boston" ? "THE BOSTON WALL" : "THE NUMBER WALL"}
        </div>
        <div style={{
          fontFamily:    "'Space Mono', 'Courier New', monospace",
          fontSize:      "10px",
          letterSpacing: "3px",
          color:         "rgba(255,255,255,0.15)",
        }}>
          PICK A NUMBER.
        </div>
      </div>
    );
  }

  // ── Derived values ───────────────────────────────────────────
  const tier       = data?.tier || "UNWRITTEN";
  const tierColor  = TIER_COLOR[tier] || TIER_COLOR.UNWRITTEN;
  const accentColor = tierColor.text;
  const showMoment  = tier === "SACRED";

  // ── Share handler ────────────────────────────────────────────
  const handleShare = () => {
    const path = wall === "boston" ? "/boston" : "/";
    const url  = `${window.location.origin}${path}?n=${selected}`;
    const names = players.map(p => p.name).join(" · ");
    if (navigator.share) {
      navigator.share({ title: `#${selected} on The Number Wall`, text: names, url });
    } else {
      navigator.clipboard?.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  };

  // ── Empty state (filter has no matching players) ─────────────
  const isEmpty = players.length === 0;

  return (
    <div>
      <PanelHeader
        number={selected}
        tier={tier}
        players={players}
        tierColor={tierColor}
        filterLabel={filterLabel}
        onClose={onClose}
      />

      {/* Empty state */}
      {isEmpty && (
        <div style={{
          textAlign:  "center",
          padding:    "30px 0",
          color:      "rgba(255,255,255,0.2)",
          fontFamily: "'Space Mono', 'Courier New', monospace",
          fontSize:   "13px",
        }}>
          NO LEGENDS FOR THIS NUMBER
        </div>
      )}

      {/* Unwritten state */}
      {!isEmpty && tier === "UNWRITTEN" && (
        <div style={{ padding: "24px 0 16px", textAlign: "center" }}>
          <div style={{
            fontFamily:    "'Barlow Condensed', Impact, sans-serif",
            fontSize:      "22px",
            fontWeight:    900,
            letterSpacing: "2px",
            color:         "rgba(255,255,255,0.7)",
            marginBottom:  "8px",
          }}>
            This one hasn&apos;t found its legend
          </div>
          <div style={{
            fontFamily:    "'Barlow Condensed', Impact, sans-serif",
            fontSize:      "22px",
            fontWeight:    900,
            letterSpacing: "1px",
            color:         "rgba(255,255,255,0.32)",
          }}>
            Yet.
          </div>
        </div>
      )}

      {/* Player cards */}
      {!isEmpty && tier !== "UNWRITTEN" && players.map((p, i) => (
        <PlayerCard
          key={p.player_id || `${p.name}-${i}`}
          player={p}
          accentColor={accentColor}
          showMoment={showMoment}
        />
      ))}

      {/* Share footer */}
      {players.length > 0 && (
        <div style={{
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          marginTop:      "14px",
          paddingTop:     "12px",
          borderTop:      "1px solid rgba(255,255,255,0.06)",
        }}>
          <span style={{
            fontFamily:    "'Space Mono', 'Courier New', monospace",
            fontSize:      "9px",
            letterSpacing: "2px",
            color:         "rgba(255,255,255,0.2)",
          }}>
            THENUMBERWALL.COM · #{selected}
          </span>

          <button
            onClick={handleShare}
            style={{
              display:       "flex",
              alignItems:    "center",
              gap:           "6px",
              background:    shareCopied ? "rgba(143,217,32,0.12)" : "rgba(232,124,42,0.12)",
              border:        `1px solid ${shareCopied ? "rgba(143,217,32,0.4)" : "rgba(232,124,42,0.4)"}`,
              borderRadius:  "6px",
              padding:       "5px 12px",
              color:         shareCopied ? "#8FD920" : "rgba(232,124,42,0.9)",
              fontFamily:    "'Space Mono', 'Courier New', monospace",
              fontSize:      "10px",
              letterSpacing: "1px",
              cursor:        "pointer",
              transition:    "all 0.15s",
            }}
            onMouseEnter={e => {
              if (!shareCopied) {
                e.currentTarget.style.background  = "rgba(232,124,42,0.22)";
                e.currentTarget.style.borderColor = "rgba(232,124,42,0.7)";
                e.currentTarget.style.boxShadow   = "0 0 12px rgba(232,124,42,0.25)";
              }
            }}
            onMouseLeave={e => {
              if (!shareCopied) {
                e.currentTarget.style.background  = "rgba(232,124,42,0.12)";
                e.currentTarget.style.borderColor = "rgba(232,124,42,0.4)";
                e.currentTarget.style.boxShadow   = "none";
              }
            }}
          >
            {shareCopied ? (
              <>
                <svg style={{ width: 11, height: 11, fill: "currentColor" }} viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                &nbsp;COPIED
              </>
            ) : (
              <>
                <svg style={{ width: 12, height: 12, fill: "currentColor" }} viewBox="0 0 24 24">
                  <path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"/>
                </svg>
                &nbsp;SHARE #{selected}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
