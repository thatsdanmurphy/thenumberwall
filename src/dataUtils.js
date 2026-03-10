// ============================================================
// THE NUMBER WALL — Data Utilities
// Merges four CSV layers into the canonical player object.
// All components consume this shape — nothing else.
// ============================================================

import { teamFromId } from "./tokens.js";

// Sport → emoji icon
const SPORT_ICON_MAP = {
  Basketball: "🏀",
  Football:   "🏈",
  Baseball:   "⚾",
  Hockey:     "🏒",
  Soccer:     "⚽",
};

/**
 * mergePlayerData()
 *
 * Joins four CSV row arrays into a grid-ready data object.
 *
 * @param {object[]} wallEntries   — rows from wall_entries_boston.csv (editorial source of truth)
 * @param {object[]} numberHistory — rows from player_team_numbers.csv (verified number history)
 * @param {object[]} honors        — rows from player_team_honors.csv (stats & awards)
 * @param {object[]} players       — rows from players.csv (identity)
 *
 * @returns {{ [number: string]: { tier: string, players: Player[] } }}
 *   Keys are jersey numbers 0–99 as strings. Every key always exists.
 */
export function mergePlayerData(wallEntries, numberHistory, honors, players) {
  // ── Step 1: Index lookup tables ──────────────────────────────
  const playersById = Object.fromEntries(
    players.map(p => [p.player_id, p])
  );

  // player_id → array of number history rows (a player can have multiple numbers)
  const numbersByPlayerId = {};
  numberHistory.forEach(row => {
    if (!numbersByPlayerId[row.player_id]) numbersByPlayerId[row.player_id] = [];
    numbersByPlayerId[row.player_id].push(row);
  });

  // player_id → first matching honors row
  const honorsByPlayerId = Object.fromEntries(
    honors.map(h => [h.player_id, h])
  );

  // ── Step 2: Init all 100 cells ───────────────────────────────
  const data = {};
  for (let i = 0; i <= 99; i++) {
    data[String(i)] = { tier: "UNWRITTEN", players: [] };
  }

  // ── Step 3: Process each wall entry (editorial source of truth) ──
  wallEntries.forEach(entry => {
    const {
      player_id,
      team_id,
      number,
      tier,
      status,
      era_label,
      defining_moment,
      moment_year,
      confidence_score,
      review_status,
    } = entry;

    // Skip unapproved entries
    if (review_status && review_status !== "approved") {
      console.warn(`[dataUtils] Skipping unapproved entry: ${player_id}`);
      return;
    }

    const num = String(parseInt(number, 10));
    if (isNaN(parseInt(number, 10))) {
      console.warn(`[dataUtils] Invalid number for player: ${player_id}`);
      return;
    }

    // Identity
    const identity = playersById[player_id];
    if (!identity) {
      console.warn(`[dataUtils] No identity found for player_id: ${player_id}`);
      return;
    }

    // Number history — find the entry matching this team + number
    const numRows = numbersByPlayerId[player_id] || [];
    const numRow = numRows.find(
      r => r.team_id === team_id && String(parseInt(r.number, 10)) === num
    ) || numRows[0] || null;

    // Honors
    const honor = honorsByPlayerId[player_id] || null;

    // Derived fields
    const teamInfo = teamFromId(team_id);
    const sport    = identity.sport || "";
    const icon     = SPORT_ICON_MAP[sport] || "🏅";

    // Assemble canonical merged player object
    const player = {
      // Identity
      player_id,
      name:    identity.full_name || identity.name || player_id,
      sport,
      league:  identity.league || teamInfo.league || "",
      gender:  identity.gender || "male",

      // Number history
      number:     parseInt(num, 10),
      team_id,
      team:       teamInfo.display,       // display name for badges/UI
      start_year: numRow ? parseInt(numRow.start_year, 10) || null : null,
      end_year:   numRow ? parseInt(numRow.end_year, 10)   || null : null,
      verified:   numRow ? (numRow.verification_status || "needs_review") : "needs_review",

      // Stats & awards
      stat:         honor ? (honor.representative_stat_value || "") : "",
      statLabel:    honor ? (honor.representative_stat_label || "") : "",
      awards:       honor ? (honor.major_awards || "") : "",
      championships: honor ? (honor.championships_with_team || "") : "",
      hof:          honor ? (honor.hall_of_fame_status === "yes") : false,

      // Editorial
      tier:       tier || "LEGEND",
      status:     status || "retired",
      era:        era_label || "",
      moment:     defining_moment || "",
      momentYear: moment_year ? parseInt(moment_year, 10) : null,
      confidence: confidence_score ? parseInt(confidence_score, 10) : null,

      // Derived / display helpers
      icon,
      teamColors: teamInfo.colors,
      // role kept for backward compat with current wall (fun facts live here in old data)
      role:    entry.inclusion_reason || "",
      funFact: "",  // not in new schema — populated from notes_editorial if needed
    };

    // ── Step 4: Push to grid cell ────────────────────────────────
    if (!data[num]) data[num] = { tier: "UNWRITTEN", players: [] };
    data[num].players.push(player);

    // Tier promotion: SACRED > LEGEND > ACTIVE > UNWRITTEN
    const tierRank = { SACRED: 4, LEGEND: 3, ACTIVE: 2, UNWRITTEN: 1 };
    const current = tierRank[data[num].tier] || 1;
    const incoming = tierRank[tier] || 1;
    if (incoming > current) data[num].tier = tier;
  });

  return data;
}


/**
 * buildBostonDataFromCSV()
 *
 * Drop-in replacement for the inline buildBostonData() in BostonWall.jsx.
 * Accepts the same raw CSV row format (from the legacy Google Sheets fetch)
 * and returns the same { [num]: { tier, players[] } } shape.
 *
 * This is the TRANSITION bridge — it reads legacy flat CSV rows (as currently
 * fetched from Google Sheets) and maps them to the merged player object shape.
 * Once the new normalized CSVs are wired, this function can be removed.
 */
export function buildBostonDataFromCSV(rows) {
  const SPORT_ICONS = { Basketball:"🏀", Football:"🏈", Baseball:"⚾", Hockey:"🏒", Soccer:"⚽" };
  const TEAM_COLORS_LEGACY = {
    "Boston Bruins":        "boston_bruins",
    "Boston Celtics":       "boston_celtics",
    "Boston Red Sox":       "boston_red_sox",
    "New England Patriots": "new_england_patriots",
    "Boston Patriots":      "boston_patriots",
    "Brooklyn Dodgers":     "brooklyn_dodgers",
  };

  const data = {};
  for (let i = 0; i <= 99; i++) data[String(i)] = { tier: "UNWRITTEN", players: [] };

  rows.forEach(r => {
    const num = parseInt(r["Number"], 10);
    if (isNaN(num) || !r["Name"]) return;

    const key    = String(num);
    const sport  = r["Sport"] || "";
    const teamDisplay = r["Team"] || r["City + Team"] || "";
    const team_id     = TEAM_COLORS_LEGACY[teamDisplay] || teamDisplay.toLowerCase().replace(/\s+/g, "_");
    const teamInfo    = teamFromId(team_id);

    const player = {
      player_id:  null,
      name:       r["Name"],
      sport,
      league:     r["League"] || "",
      gender:     "male",
      number:     num,
      team_id,
      team:       teamDisplay,
      start_year: null,
      end_year:   null,
      verified:   "needs_review",
      stat:       r["Signature Stat"] || r["Stat"] || "",
      statLabel:  r["Stat Label"]     || r["StatLabel"] || "",
      awards:     "",
      championships: "",
      hof:        false,
      tier:       (r["Tier"] || "").toUpperCase().trim() || "LEGEND",
      status:     r["Status"] === "Active" ? "active" : "retired",
      era:        r["Era"] || "",
      moment:     "",
      momentYear: null,
      confidence: null,
      icon:       SPORT_ICONS[sport] || "🏅",
      teamColors: teamInfo.colors,
      role:       r["Role"] || "",
      funFact:    r["Fun Fact"] || r["FunFact"] || "",
    };

    if (!data[key]) data[key] = { tier: "UNWRITTEN", players: [] };
    data[key].players.push(player);

    const t = player.tier;
    const tierRank = { SACRED: 4, LEGEND: 3, ACTIVE: 2, UNWRITTEN: 1 };
    const cur = tierRank[data[key].tier] || 1;
    const inc = tierRank[t] || 1;
    if (inc > cur) data[key].tier = t;
  });

  return data;
}


/**
 * buildNumberData()
 *
 * Equivalent of buildBostonDataFromCSV but for the main WornNumbers wall.
 * Accepts flat CSV rows from the main Google Sheet and returns the same
 * { [num]: { tier, players[] } } shape.
 */
export function buildNumberData(rows) {
  const SPORT_ICONS = { Basketball:"🏀", Football:"🏈", Baseball:"⚾", Hockey:"🏒", Soccer:"⚽" };
  const TIER_RANK   = { SACRED: 4, LEGEND: 3, RISING: 2, UNWRITTEN: 1 };

  const data = {};
  for (let i = 1; i <= 99; i++) data[String(i)] = { tier: "UNWRITTEN", players: [] };

  rows.forEach(r => {
    const num = parseInt(r["Number"], 10);
    if (isNaN(num) || num < 1 || !r["Name"]) return;

    const key   = String(num);
    const sport = r["Sport"] || "";
    const team  = r["City + Team"] || r["Team"] || "";

    const player = {
      player_id:  null,
      name:       r["Name"],
      sport,
      league:     r["League"] || "",
      gender:     "male",
      number:     num,
      team_id:    null,
      team,
      start_year: null,
      end_year:   null,
      verified:   "needs_review",
      stat:       r["Signature Stat"] || r["Stat"] || "",
      statLabel:  r["Stat Label"]     || r["StatLabel"] || "",
      awards:     "",
      hof:        false,
      tier:       (r["Tier"] || "LEGEND").toUpperCase().trim(),
      status:     r["Status"] === "Active" ? "active" : "retired",
      era:        r["Era"] || "",
      moment:     "",
      momentYear: null,
      confidence: null,
      icon:       SPORT_ICONS[sport] || "🏅",
      teamColors: null,
      role:       r["Role"] || "",
      funFact:    r["Fun Fact"] || r["FunFact"] || "",
    };

    if (!data[key]) data[key] = { tier: "UNWRITTEN", players: [] };
    data[key].players.push(player);

    const cur = TIER_RANK[data[key].tier] || 1;
    const inc = TIER_RANK[player.tier]    || 1;
    if (inc > cur) data[key].tier = player.tier;
  });

  return data;
}
