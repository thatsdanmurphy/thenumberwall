import { ImageResponse } from "@vercel/og";

export const config = { runtime: "edge" };

const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSK0TtNNPbOkdaVIRrV9zDl8HOeN_y64j5kvoDZI08seUPN0q8GXOXCfGjdIaW5MQ9WgYnH0EDGigbZ/pub?gid=0&single=true&output=csv";

const BOSTON_LEGENDS_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSK0TtNNPbOkdaVIRrV9zDl8HOeN_y64j5kvoDZI08seUPN0q8GXOXCfGjdIaW5MQ9WgYnH0EDGigbZ/pub?gid=125669984&single=true&output=csv";

function parseCSV(csv) {
  const lines = csv.split("\n").filter(Boolean);
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map((line) => {
    const vals = [];
    let cur = "", inQ = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') { inQ = !inQ; }
      else if (line[i] === "," && !inQ) { vals.push(cur.trim()); cur = ""; }
      else { cur += line[i]; }
    }
    vals.push(cur.trim());
    const obj = {};
    headers.forEach((h, i) => (obj[h] = vals[i] || ""));
    return obj;
  });
}

// Heat colors matching the app exactly
function getHeatColor(count) {
  if (count >= 6) return { bg: "rgba(220,70,0,0.85)",  border: "rgba(255,120,20,1)",    text: "rgba(255,210,120,1)" };
  if (count >= 4) return { bg: "rgba(210,60,0,0.75)",  border: "rgba(255,100,20,0.95)", text: "rgba(255,190,100,1)" };
  if (count >= 3) return { bg: "rgba(200,50,0,0.65)",  border: "rgba(255,85,10,0.85)",  text: "rgba(255,170,85,1)"  };
  if (count >= 2) return { bg: "rgba(180,40,0,0.55)",  border: "rgba(240,70,5,0.7)",    text: "rgba(255,145,65,1)"  };
  return             { bg: "rgba(150,30,0,0.45)",  border: "rgba(200,55,0,0.55)",   text: "rgba(220,110,50,1)"  };
}

const TEAM_COLORS = {
  "Boston Bruins":        "#FFB81C",
  "Boston Celtics":       "#007A33",
  "Boston Red Sox":       "#BD3039",
  "New England Patriots": "#C6003C",
  "Boston Patriots":      "#C6003C",
};

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const n      = parseInt(searchParams.get("n") ?? "99");
  const wall   = searchParams.get("wall") ?? "global"; // "global" or "boston"
  const num    = isNaN(n) ? 99 : Math.max(0, Math.min(99, n));

  // Fetch the right sheet
  const sheetUrl = wall === "boston" ? BOSTON_LEGENDS_URL : SHEET_URL;
  let players = [];
  try {
    const csv = await fetch(sheetUrl).then((r) => r.text());
    const rows = parseCSV(csv);
    players = rows
      .filter((r) => parseInt(r["Number"]) === num && r["Name"])
      .map((r) => ({
        name: r["Name"],
        team: r["Team"] || r["City + Team"] || "",
        sport: r["Sport"] || "",
      }));
  } catch (e) {
    // fallback: empty
  }

  const count = players.length;
  const heat  = count > 0 ? getHeatColor(count) : { bg: "rgba(30,30,30,0.9)", border: "rgba(255,255,255,0.15)", text: "rgba(255,255,255,0.4)" };

  // For Boston — pick team color for accent
  let accentColor = heat.text;
  if (wall === "boston" && players.length > 0) {
    const teamColor = TEAM_COLORS[players[0].team];
    if (teamColor) accentColor = teamColor;
  }

  // Truncate to 4 names max
  const displayPlayers = players.slice(0, 4);
  const overflow = players.length > 4 ? `+${players.length - 4} more` : null;

  const wallLabel = wall === "boston" ? "THE BOSTON WALL" : "THE NUMBER WALL";
  const tagline   = wall === "boston" ? "617 legends live here." : "Legends live here.";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: "#080c10",
          display: "flex",
          flexDirection: "column",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background glow blob */}
        <div
          style={{
            position: "absolute",
            top: "-80px",
            left: "-80px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${heat.bg} 0%, transparent 70%)`,
            opacity: 0.6,
          }}
        />

        {/* Top section — number + names */}
        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            padding: "60px 80px 40px",
            gap: "60px",
            borderBottom: `1px solid ${heat.border}`,
          }}
        >
          {/* Big number */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minWidth: "260px",
              background: heat.bg,
              border: `2px solid ${heat.border}`,
              borderRadius: "24px",
              padding: "24px 40px",
            }}
          >
            <div
              style={{
                fontSize: "160px",
                fontWeight: 900,
                lineHeight: 1,
                color: heat.text,
                letterSpacing: "-4px",
                fontFamily: "sans-serif",
              }}
            >
              {num}
            </div>
            {count > 0 && (
              <div
                style={{
                  fontSize: "16px",
                  letterSpacing: "4px",
                  color: "rgba(255,255,255,0.35)",
                  marginTop: "8px",
                  fontFamily: "monospace",
                }}
              >
                {count} LEGEND{count !== 1 ? "S" : ""}
              </div>
            )}
          </div>

          {/* Names */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", flex: 1 }}>
            <div
              style={{
                fontSize: "14px",
                letterSpacing: "4px",
                color: "rgba(255,255,255,0.3)",
                fontFamily: "monospace",
                marginBottom: "4px",
              }}
            >
              LEGENDS WHO WORE THIS
            </div>
            {displayPlayers.length > 0 ? (
              displayPlayers.map((p, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: displayPlayers.length <= 2 ? "52px" : displayPlayers.length === 3 ? "44px" : "36px",
                    fontWeight: 900,
                    color: "#ffffff",
                    lineHeight: 1.1,
                    letterSpacing: "1px",
                    fontFamily: "sans-serif",
                  }}
                >
                  {p.name}
                </div>
              ))
            ) : (
              <div
                style={{
                  fontSize: "36px",
                  fontWeight: 900,
                  color: "rgba(255,255,255,0.2)",
                  fontFamily: "sans-serif",
                }}
              >
                UNWRITTEN
              </div>
            )}
            {overflow && (
              <div style={{ fontSize: "20px", color: "rgba(255,255,255,0.3)", fontFamily: "monospace", letterSpacing: "2px" }}>
                {overflow}
              </div>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "24px 80px",
            height: "90px",
          }}
        >
          <div
            style={{
              fontSize: "22px",
              fontWeight: 900,
              letterSpacing: "6px",
              color: "rgba(255,255,255,0.25)",
              fontFamily: "sans-serif",
            }}
          >
            {wallLabel}
          </div>
          <div
            style={{
              fontSize: "26px",
              fontStyle: "italic",
              color: accentColor,
              fontFamily: "sans-serif",
              fontWeight: 600,
            }}
          >
            {tagline}
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
