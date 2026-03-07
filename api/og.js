// api/og.js  — Vercel Serverless Function (Node.js runtime)
// Generates a share card image for each number
// URL: /api/og?n=99  or  /api/og?n=34&wall=boston

const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSK0TtNNPbOkdaVIRrV9zDl8HOeN_y64j5kvoDZI08seUPN0q8GXOXCfGjdIaW5MQ9WgYnH0EDGigbZ/pub?gid=0&single=true&output=csv";
const BOSTON_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSK0TtNNPbOkdaVIRrV9zDl8HOeN_y64j5kvoDZI08seUPN0q8GXOXCfGjdIaW5MQ9WgYnH0EDGigbZ/pub?gid=125669984&single=true&output=csv";

function parseCSV(csv) {
  const lines = csv.split("\n").filter(Boolean);
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map(line => {
    const vals = []; let cur = "", inQ = false;
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

function heatColor(count) {
  if (count >= 6) return { bg: "#DC4600", border: "#FF7814", text: "#FFD278" };
  if (count >= 4) return { bg: "#D23C00", border: "#FF6414", text: "#FFBE64" };
  if (count >= 3) return { bg: "#C83200", border: "#FF550A", text: "#FFAA55" };
  if (count >= 2) return { bg: "#B42800", border: "#F04605", text: "#FF9141" };
  return             { bg: "#961E00", border: "#C83700", text: "#DC6E32" };
}

const TEAM_COLORS = {
  "Boston Bruins":        "#FFB81C",
  "Boston Celtics":       "#4DCC7A",
  "Boston Red Sox":       "#FF8080",
  "New England Patriots": "#C0C8D8",
  "Boston Patriots":      "#C0C8D8",
};

function buildSVG(num, players, wall) {
  const count   = players.length;
  const heat    = count > 0 ? heatColor(count) : { bg: "#1a1e25", border: "#2c3140", text: "rgba(255,255,255,0.3)" };
  const display = players.slice(0, 4);
  const more    = players.length > 4 ? `+${players.length - 4} more` : "";

  // Team color accent for Boston
  let accentColor = heat.text;
  if (wall === "boston" && players.length > 0) {
    accentColor = TEAM_COLORS[players[0].team] || heat.text;
  }

  const wallLabel = wall === "boston" ? "THE BOSTON WALL" : "THE NUMBER WALL";
  const tagline   = wall === "boston" ? "617 legends live here." : "Legends live here.";

  // Font size for names based on count
  const nameFontSize = display.length <= 1 ? 64 : display.length === 2 ? 54 : display.length === 3 ? 44 : 36;
  const nameLineHeight = nameFontSize * 1.2;

  // Build name lines
  const nameLines = display.map((p, i) =>
    `<text x="480" y="${200 + i * nameLineHeight}" font-size="${nameFontSize}" font-weight="900" fill="#ffffff" font-family="Arial Black, Arial, sans-serif" dominant-baseline="hanging">${escXML(p.name)}</text>`
  ).join("\n    ");

  const moreLine = more
    ? `<text x="480" y="${200 + display.length * nameLineHeight + 8}" font-size="22" fill="rgba(255,255,255,0.4)" font-family="Arial, sans-serif">${more}</text>`
    : "";

  return `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="glow" cx="20%" cy="30%" r="60%">
      <stop offset="0%" stop-color="${heat.bg}" stop-opacity="0.7"/>
      <stop offset="100%" stop-color="#080c10" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="#080c10"/>
  <rect width="1200" height="630" fill="url(#glow)"/>

  <!-- Bottom border accent -->
  <rect x="0" y="540" width="1200" height="1" fill="${heat.border}" opacity="0.3"/>

  <!-- Number box -->
  <rect x="40" y="60" width="380" height="420" rx="20" fill="${heat.bg}" stroke="${heat.border}" stroke-width="2"/>

  <!-- Big number -->
  <text x="230" y="300" font-size="200" font-weight="900" fill="${heat.text}"
    font-family="Arial Black, Arial, sans-serif"
    text-anchor="middle" dominant-baseline="middle"
    style="filter: drop-shadow(0 0 30px ${heat.border})"
  >${num}</text>

  <!-- Legend count -->
  ${count > 0 ? `<text x="230" y="450" font-size="18" fill="rgba(255,255,255,0.35)" font-family="Arial, monospace" text-anchor="middle" letter-spacing="4">
    ${count} LEGEND${count !== 1 ? "S" : ""}
  </text>` : ""}

  <!-- Divider -->
  <rect x="440" y="60" width="1" height="420" fill="${heat.border}" opacity="0.2"/>

  <!-- "LEGENDS WHO WORE THIS" label -->
  <text x="480" y="160" font-size="14" fill="rgba(255,255,255,0.3)" font-family="Arial, monospace" letter-spacing="4" dominant-baseline="hanging">LEGENDS WHO WORE THIS</text>

  <!-- Player names -->
  ${count > 0 ? nameLines : `<text x="480" y="260" font-size="52" font-weight="900" fill="rgba(255,255,255,0.15)" font-family="Arial Black, Arial, sans-serif" dominant-baseline="middle">UNWRITTEN</text>`}
  ${moreLine}

  <!-- Bottom bar -->
  <text x="60" y="595" font-size="20" font-weight="900" fill="rgba(255,255,255,0.2)" font-family="Arial, sans-serif" letter-spacing="6">${wallLabel}</text>
  <text x="1140" y="595" font-size="24" fill="${accentColor}" font-family="Georgia, serif" font-style="italic" text-anchor="end">${tagline}</text>
</svg>`;
}

function escXML(str) {
  return (str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

module.exports = async (req, res) => {
  const { n, wall = "global" } = req.query;
  const num = Math.max(0, Math.min(99, parseInt(n) || 99));

  let players = [];
  try {
    const url   = wall === "boston" ? BOSTON_URL : SHEET_URL;
    const csv   = await fetch(url).then(r => r.text());
    const rows  = parseCSV(csv);
    const teamKey = wall === "boston" ? "Team" : "City + Team";
    players = rows
      .filter(r => parseInt(r["Number"]) === num && r["Name"])
      .map(r => ({ name: r["Name"], team: r["Team"] || r[teamKey] || "" }));
  } catch (e) {
    // serve empty card on error
  }

  const svg = buildSVG(num, players, wall);

  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600");
  res.status(200).send(svg);
};
