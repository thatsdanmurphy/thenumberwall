// api/og.js
// Dynamic OG share card — returns PNG via @vercel/og
// Works correctly on iMessage, Twitter, Slack, Discord, Facebook.
// Same layout as previous SVG version, same data fetching.
// Sprint 1 electrified color palette.

import { ImageResponse } from "@vercel/og";

export const config = { runtime: "edge" };

// ── Sheet URLs ────────────────────────────────────────────────
const SHEET_URL  = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSK0TtNNPbOkdaVIRrV9zDl8HOeN_y64j5kvoDZI08seUPN0q8GXOXCfGjdIaW5MQ9WgYnH0EDGigbZ/pub?gid=0&single=true&output=csv";
const BOSTON_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSK0TtNNPbOkdaVIRrV9zDl8HOeN_y64j5kvoDZI08seUPN0q8GXOXCfGjdIaW5MQ9WgYnH0EDGigbZ/pub?gid=125669984&single=true&output=csv";

// ── CSV parser ────────────────────────────────────────────────
function parseCSV(csv) {
  const lines   = csv.split("\n").filter(Boolean);
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map(line => {
    const vals = []; let cur = ""; let inQ = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') { inQ = !inQ; }
      else if (line[i] === "," && !inQ) { vals.push(cur.trim()); cur = ""; }
      else { cur += line[i]; }
    }
    vals.push(cur.trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] || ""; });
    return obj;
  });
}

// ── Heat colors — orange scale, matches tokens.js ─────────────
function heatColor(count) {
  if (count >= 6) return { bg: "#DC4600", border: "#FF7814", text: "#FFD278" };
  if (count >= 4) return { bg: "#D23C00", border: "#FF6414", text: "#FFBE64" };
  if (count >= 3) return { bg: "#C83200", border: "#FF550A", text: "#FFAA55" };
  if (count >= 2) return { bg: "#B42800", border: "#F04605", text: "#FF9141" };
  return              { bg: "#961E00", border: "#C83700", text: "#DC6E32" };
}

// ── Team colors — Sprint 1 electrified, matches tokens.js ─────
const TEAM_COLORS = {
  "Boston Bruins":        "#FFD278",
  "Boston Celtics":       "#8CFFA8",
  "Boston Red Sox":       "#FFA0A5",
  "New England Patriots": "#B4D7FF",
  "Boston Patriots":      "#B4D7FF",
};

// ── Name font size — scales down as player count rises ────────
function nameFontSize(count) {
  if (count <= 1) return 64;
  if (count === 2) return 54;
  if (count === 3) return 44;
  return 36;
}

// ── Handler ───────────────────────────────────────────────────
export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const wall = searchParams.get("wall") || "global";
  const num  = Math.max(0, Math.min(99, parseInt(searchParams.get("n"), 10) || 99));

  // Fetch player data
  let players = [];
  try {
    const url = wall === "boston" ? BOSTON_URL : SHEET_URL;
    const csv = await fetch(url).then(r => r.text());
    const rows = parseCSV(csv);
    players = rows
      .filter(r => parseInt(r["Number"], 10) === num && r["Name"])
      .map(r => ({
        name: r["Name"],
        team: r["Team"] || r["City + Team"] || "",
      }));
  } catch (e) {
    console.error("OG data fetch failed:", e);
  }

  const count       = players.length;
  const heat        = count > 0
    ? heatColor(count)
    : { bg: "#1a1e25", border: "#2c3140", text: "rgba(255,255,255,0.15)" };

  const display     = players.slice(0, 4);
  const more        = players.length > 4 ? `+${players.length - 4} more` : null;
  const fs          = nameFontSize(display.length);
  const wallLabel   = wall === "boston" ? "THE BOSTON WALL" : "THE NUMBER WALL";
  const tagline     = wall === "boston" ? "617 legends live here." : "Legends live here.";
  const accentColor = (wall === "boston" && players.length > 0)
    ? (TEAM_COLORS[players[0].team] || heat.text)
    : heat.text;

  return new ImageResponse(
    <div
      style={{
        width:         "1200px",
        height:        "630px",
        background:    "#080C10",
        display:       "flex",
        flexDirection: "column",
        position:      "relative",
        fontFamily:    "sans-serif",
        overflow:      "hidden",
      }}
    >
      {/* Radial glow behind tile */}
      <div style={{
        position:     "absolute",
        top:          "-80px",
        left:         "-80px",
        width:        "560px",
        height:       "560px",
        borderRadius: "50%",
        background:   heat.bg,
        opacity:      0.35,
        filter:       "blur(80px)",
        display:      "flex",
      }} />

      {/* Main content row */}
      <div style={{
        display: "flex",
        flex:    1,
        padding: "55px 40px 0",
      }}>

        {/* Left — number tile */}
        <div style={{
          width:          "390px",
          height:         "430px",
          background:     heat.bg,
          border:         `2.5px solid ${heat.border}`,
          borderRadius:   "20px",
          display:        "flex",
          flexDirection:  "column",
          alignItems:     "center",
          justifyContent: "center",
          flexShrink:     0,
        }}>
          <span style={{
            fontSize:      "210px",
            fontWeight:    900,
            color:         heat.text,
            lineHeight:    1,
            letterSpacing: "-4px",
          }}>
            {num}
          </span>
          {count > 0 && (
            <span style={{
              fontSize:      "14px",
              color:         "rgba(255,255,255,0.3)",
              letterSpacing: "4px",
              marginTop:     "8px",
              fontFamily:    "monospace",
            }}>
              {count} LEGEND{count !== 1 ? "S" : ""}
            </span>
          )}
        </div>

        {/* Divider */}
        <div style={{
          width:       "1px",
          height:      "430px",
          background:  heat.border,
          opacity:     0.2,
          marginLeft:  "10px",
          marginRight: "30px",
          flexShrink:  0,
          display:     "flex",
        }} />

        {/* Right — player names */}
        <div style={{
          display:        "flex",
          flexDirection:  "column",
          justifyContent: "flex-start",
          paddingTop:     "40px",
          flex:           1,
          overflow:       "hidden",
        }}>
          <span style={{
            fontSize:      "13px",
            color:         "rgba(255,255,255,0.28)",
            letterSpacing: "4px",
            fontFamily:    "monospace",
            marginBottom:  "28px",
          }}>
            LEGENDS WHO WORE THIS
          </span>

          {count > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {display.map((p, i) => (
                <span key={i} style={{
                  fontSize:     `${fs}px`,
                  fontWeight:   900,
                  color:        "#ffffff",
                  lineHeight:   1.2,
                  whiteSpace:   "nowrap",
                  overflow:     "hidden",
                  textOverflow: "ellipsis",
                }}>
                  {p.name}
                </span>
              ))}
              {more && (
                <span style={{
                  fontSize:  "20px",
                  color:     "rgba(255,255,255,0.35)",
                  marginTop: "8px",
                }}>
                  {more}
                </span>
              )}
            </div>
          ) : (
            <span style={{
              fontSize:   "52px",
              fontWeight: 900,
              color:      "rgba(255,255,255,0.10)",
              marginTop:  "40px",
            }}>
              UNWRITTEN
            </span>
          )}
        </div>
      </div>

      {/* Footer bar */}
      <div style={{
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-between",
        borderTop:      `1px solid rgba(255,255,255,0.08)`,
        padding:        "0 60px",
        height:         "90px",
        marginTop:      "auto",
      }}>
        <span style={{
          fontSize:      "19px",
          fontWeight:    900,
          color:         "rgba(255,255,255,0.2)",
          letterSpacing: "6px",
          fontFamily:    "monospace",
        }}>
          {wallLabel}
        </span>
        <span style={{
          fontSize:   "23px",
          color:      accentColor,
          fontStyle:  "italic",
          fontFamily: "Georgia, serif",
        }}>
          {tagline}
        </span>
      </div>
    </div>,

    {
      width:  1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
      },
    }
  );
}