// api/og.js — Vercel Serverless Function
// No external dependencies. Uses Node https module, returns SVG.

const https = require("https");

const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSK0TtNNPbOkdaVIRrV9zDl8HOeN_y64j5kvoDZI08seUPN0q8GXOXCfGjdIaW5MQ9WgYnH0EDGigbZ/pub?gid=0&single=true&output=csv";
const BOSTON_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSK0TtNNPbOkdaVIRrV9zDl8HOeN_y64j5kvoDZI08seUPN0q8GXOXCfGjdIaW5MQ9WgYnH0EDGigbZ/pub?gid=125669984&single=true&output=csv";

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      // follow one redirect (Google Sheets does a 302)
      if (res.statusCode === 301 || res.statusCode === 302) {
        return https.get(res.headers.location, res2 => {
          let d = "";
          res2.on("data", c => d += c);
          res2.on("end", () => resolve(d));
        }).on("error", reject);
      }
      let d = "";
      res.on("data", c => d += c);
      res.on("end", () => resolve(d));
    }).on("error", reject);
  });
}

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

function esc(str) {
  return (str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function buildSVG(num, players, wall) {
  const count   = players.length;
  const heat    = count > 0 ? heatColor(count) : { bg: "#1a1e25", border: "#2c3140", text: "rgba(255,255,255,0.25)" };
  const display = players.slice(0, 4);
  const more    = players.length > 4 ? `+${players.length - 4} more` : "";

  let accentColor = heat.text;
  if (wall === "boston" && players.length > 0) {
    accentColor = TEAM_COLORS[players[0].team] || heat.text;
  }

  const wallLabel = wall === "boston" ? "THE BOSTON WALL" : "THE NUMBER WALL";
  const tagline   = wall === "boston" ? "617 legends live here." : "Legends live here.";
  const fs        = display.length <= 1 ? 64 : display.length === 2 ? 54 : display.length === 3 ? 44 : 36;
  const lh        = fs * 1.25;

  const nameLines = display.map((p, i) =>
    `<text x="480" y="${195 + i * lh}" font-size="${fs}" font-weight="900" fill="#ffffff" font-family="Arial Black, Arial, sans-serif" dominant-baseline="hanging">${esc(p.name)}</text>`
  ).join("\n    ");

  const moreLine = more
    ? `<text x="480" y="${195 + display.length * lh + 8}" font-size="20" fill="rgba(255,255,255,0.35)" font-family="Arial, sans-serif">${esc(more)}</text>`
    : "";

  return `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="glow" cx="18%" cy="28%" r="55%">
      <stop offset="0%" stop-color="${heat.bg}" stop-opacity="0.65"/>
      <stop offset="100%" stop-color="#080c10" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="1200" height="630" fill="#080c10"/>
  <rect width="1200" height="630" fill="url(#glow)"/>

  <!-- Number box -->
  <rect x="40" y="55" width="390" height="430" rx="20" fill="${heat.bg}" stroke="${heat.border}" stroke-width="2.5" opacity="0.95"/>

  <!-- Big number -->
  <text x="235" y="290" font-size="210" font-weight="900" fill="${heat.text}"
    font-family="Arial Black, Arial, sans-serif"
    text-anchor="middle" dominant-baseline="middle"
  >${num}</text>

  ${count > 0 ? `<text x="235" y="455" font-size="16" fill="rgba(255,255,255,0.3)"
    font-family="Arial, monospace" text-anchor="middle" letter-spacing="4">${count} LEGEND${count !== 1 ? "S" : ""}</text>` : ""}

  <!-- Divider -->
  <line x1="450" y1="55" x2="450" y2="485" stroke="${heat.border}" stroke-width="1" opacity="0.2"/>

  <!-- Label -->
  <text x="480" y="155" font-size="13" fill="rgba(255,255,255,0.28)"
    font-family="Arial, monospace" letter-spacing="4" dominant-baseline="hanging">LEGENDS WHO WORE THIS</text>

  <!-- Names -->
  ${count > 0 ? nameLines : `<text x="480" y="270" font-size="52" font-weight="900" fill="rgba(255,255,255,0.12)"
    font-family="Arial Black, Arial, sans-serif" dominant-baseline="middle">UNWRITTEN</text>`}
  ${moreLine}

  <!-- Bottom bar -->
  <line x1="0" y1="540" x2="1200" y2="540" stroke="${heat.border}" stroke-width="1" opacity="0.2"/>
  <text x="60" y="590" font-size="19" font-weight="900" fill="rgba(255,255,255,0.2)"
    font-family="Arial, sans-serif" letter-spacing="6" dominant-baseline="middle">${wallLabel}</text>
  <text x="1140" y="590" font-size="23" fill="${accentColor}"
    font-family="Georgia, serif" font-style="italic" text-anchor="end" dominant-baseline="middle">${tagline}</text>
</svg>`;
}

module.exports = async (req, res) => {
  const { n, wall = "global" } = req.query;
  const num = Math.max(0, Math.min(99, parseInt(n) || 99));

  let players = [];
  try {
    const url  = wall === "boston" ? BOSTON_URL : SHEET_URL;
    const csv  = await get(url);
    const rows = parseCSV(csv);
    players = rows
      .filter(r => parseInt(r["Number"]) === num && r["Name"])
      .map(r => ({ name: r["Name"], team: r["Team"] || r["City + Team"] || "" }));
  } catch (e) {
    // empty card on error — better than crashing
  }

  const svg = buildSVG(num, players, wall);
  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600");
  res.status(200).send(svg);
};