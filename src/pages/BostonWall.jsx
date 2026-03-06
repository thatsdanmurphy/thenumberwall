import { useState, useEffect, useRef } from "react";

// ── TEAM COLORS ──────────────────────────────────────────────────────────────
const TEAM_COLORS = {
  "Boston Bruins":        { primary:"#FFB81C", dark:"rgba(255,184,28,0.18)", border:"rgba(255,184,28,0.6)",  glow:"0 0 16px rgba(255,184,28,0.55), 0 0 32px rgba(255,184,28,0.2)",  text:"#FFD76B" },
  "Boston Celtics":       { primary:"#007A33", dark:"rgba(0,122,51,0.18)",   border:"rgba(0,180,80,0.6)",   glow:"0 0 16px rgba(0,180,80,0.55), 0 0 32px rgba(0,150,60,0.2)",    text:"#4DCC7A" },
  "Boston Red Sox":       { primary:"#BD3039", dark:"rgba(189,48,57,0.18)",  border:"rgba(220,60,70,0.6)",  glow:"0 0 16px rgba(220,60,70,0.55), 0 0 32px rgba(189,48,57,0.2)",  text:"#FF8080" },
  "New England Patriots": { primary:"#002244", dark:"rgba(0,34,68,0.35)",    border:"rgba(198,12,48,0.6)",  glow:"0 0 16px rgba(198,12,48,0.45), 0 0 32px rgba(0,34,68,0.4)",    text:"#C0C8D8" },
  "Boston Patriots":      { primary:"#002244", dark:"rgba(0,34,68,0.35)",    border:"rgba(198,12,48,0.6)",  glow:"0 0 16px rgba(198,12,48,0.45), 0 0 32px rgba(0,34,68,0.4)",    text:"#C0C8D8" },
  "Brooklyn Dodgers":     { primary:"#005A9C", dark:"rgba(0,90,156,0.18)",   border:"rgba(0,130,220,0.6)",  glow:"0 0 16px rgba(0,130,220,0.4), 0 0 32px rgba(0,90,156,0.2)",    text:"#80C4FF" },
};

const TEAM_FILTERS = ["ALL","Bruins","Celtics","Red Sox","Patriots"];
const TEAM_FILTER_MAP = {
  "Bruins":   "Boston Bruins",
  "Celtics":  "Boston Celtics",
  "Red Sox":  "Boston Red Sox",
  "Patriots": ["New England Patriots","Boston Patriots"],
};

const defaultColors = { primary:"#FF6B00", dark:"rgba(255,107,0,0.15)", border:"rgba(255,107,0,0.5)", glow:"0 0 14px rgba(255,107,0,0.4)", text:"rgba(255,180,80,1)" };

function getTeamColors(players) {
  if (!players || players.length === 0) return defaultColors;
  // Use first player's team color, or blend if multiple teams
  const teams = [...new Set(players.map(p => p.team))];
  return TEAM_COLORS[teams[0]] || defaultColors;
}

// ── NUMBER DATA (inlined from CSV) ───────────────────────────────────────────
// --- SHEET CONFIG -----------------------------------------------------------
const LEGENDS_URL  = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSK0TtNNPbOkdaVIRrV9zDl8HOeN_y64j5kvoDZI08seUPN0q8GXOXCfGjdIaW5MQ9WgYnH0EDGigbZ/pub?gid=125669984&single=true&output=csv";
const CURRENT_URL  = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSK0TtNNPbOkdaVIRrV9zDl8HOeN_y64j5kvoDZI08seUPN0q8GXOXCfGjdIaW5MQ9WgYnH0EDGigbZ/pub?gid=1681258019&single=true&output=csv";

const SPORT_ICON_MAP_B = { Basketball:"🏀", Football:"🏈", Baseball:"⚾", Hockey:"🏒", Soccer:"⚽" };

function parseCSVLine_B(line) {
  const result = []; let cur = ""; let inQ = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') { inQ = !inQ; }
    else if (line[i] === "," && !inQ) { result.push(cur.trim()); cur = ""; }
    else { cur += line[i]; }
  }
  result.push(cur.trim());
  return result;
}

function buildBostonData(rows) {
  const data = {};
  for (let i = 0; i <= 99; i++) data[i] = { tier:"UNWRITTEN", players:[] };
  rows.forEach(r => {
    const num = parseInt(r["Number"]);
    if (isNaN(num) || !r["Name"]) return;
    const sport = r["Sport"] || "";
    const team  = r["Team"] || r["City + Team"] || "";
    const player = {
      name: r["Name"], sport, league: r["League"] || "", team,
      status: r["Status"] || "Retired", era: r["Era"] || "",
      stat: r["Signature Stat"] || r["Stat"] || "",
      statLabel: r["Stat Label"] || r["StatLabel"] || "",
      statWeight: parseInt(r["Stat Weight"] || r["StatWeight"]) || 1,
      role: r["Role"] || "", funFact: r["Fun Fact"] || r["FunFact"] || "",
      color: (TEAM_COLORS[team] || {}).primary || "#FF6B00",
      icon: SPORT_ICON_MAP_B[sport] || "🏅",
    };
    if (!data[num]) data[num] = { tier:"UNWRITTEN", players:[] };
    data[num].players.push(player);
    const t = (r["Tier"] || "").toUpperCase().trim();
    if (t === "SACRED") data[num].tier = "SACRED";
    else if (t === "LEGEND" && data[num].tier !== "SACRED") data[num].tier = "LEGEND";
    else if (t === "ACTIVE" && data[num].tier === "UNWRITTEN") data[num].tier = "ACTIVE";
    else if (t === "" && data[num].players.length > 1 && data[num].tier === "UNWRITTEN") data[num].tier = "LEGEND";
  });
  return data;
}

// ── COMPONENT ────────────────────────────────────────────────────────────────
export default function BostonWall() {
  const [tab, setTab]         = useState("legends");
  const [selected, setSelected] = useState(null);
  const [teamFilter, setTeamFilter] = useState("ALL");
  const [isMobile, setIsMobile]   = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [legendsData, setLegendsData] = useState({});
  const [currentData, setCurrentData] = useState({});
  const [loading, setLoading]   = useState(true);
  const sheetRef  = useRef(null);
  const filterRef = useRef(null);

  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth < 700);
      setIsDesktop(window.innerWidth >= 960);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => { setSelected(null); }, [tab, teamFilter]);
  useEffect(() => { if (filterRef.current) filterRef.current.scrollLeft = 0; }, [teamFilter]);

  useEffect(() => {
    const fetchSheet = (url, setter) =>
      fetch(url)
        .then(r => { if (!r.ok) throw new Error("Sheet fetch failed: " + r.status); return r.text(); })
        .then(csv => {
          const lines = csv.split("\n").filter(Boolean);
          const headers = parseCSVLine_B(lines[0]);
          const rows = lines.slice(1).map(line => {
            const vals = parseCSVLine_B(line);
            const obj = {};
            headers.forEach((h, i) => obj[h] = vals[i] || "");
            return obj;
          });
          setter(buildBostonData(rows));
        });

    Promise.all([
      fetchSheet(LEGENDS_URL, setLegendsData),
      fetchSheet(CURRENT_URL, setCurrentData),
    ])
      .catch(err => console.error("Boston fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  const DATA = tab === "legends" ? legendsData : currentData;

  const filteredPlayers = (num) => {
    const d = DATA && DATA[num];
    if (!d || !d.players) return [];
    if (teamFilter === "ALL") return d.players;
    const teamName = TEAM_FILTER_MAP[teamFilter];
    return d.players.filter(p =>
      Array.isArray(teamName) ? teamName.includes(p.team) : p.team === teamName
    );
  };

  const cellColors = (num) => {
    const players = filteredPlayers(num);
    if (!players.length) return { bg:"rgba(255,255,255,0.06)", border:"rgba(255,255,255,0.22)", glow:"none", text:"rgba(255,255,255,0.42)" };
    const all = DATA[num]?.players || [];
    const count = teamFilter === "ALL" ? all.length : players.length;

    if (teamFilter === "ALL") {
      // Exact same orange steps as main wall renderCell
      if (count >= 6) return { bg:"rgba(220,70,0,0.75)",  border:"rgba(255,120,20,1)",   glow:"0 0 22px rgba(255,120,20,0.85),0 0 44px rgba(255,80,0,0.45),0 0 60px rgba(255,60,0,0.2)", text:"rgba(255,210,120,1)" };
      if (count >= 4) return { bg:"rgba(210,60,0,0.65)",  border:"rgba(255,100,20,0.9)", glow:"0 0 18px rgba(255,100,20,0.7),0 0 36px rgba(255,80,0,0.35)",                              text:"rgba(255,190,100,1)" };
      if (count >= 3) return { bg:"rgba(200,50,0,0.55)",  border:"rgba(255,85,10,0.75)", glow:"0 0 14px rgba(255,85,10,0.55),0 0 28px rgba(255,70,0,0.25)",                              text:"rgba(255,170,85,1)"  };
      if (count === 2) return { bg:"rgba(180,40,0,0.45)", border:"rgba(240,70,5,0.6)",   glow:"0 0 10px rgba(240,70,5,0.4),0 0 20px rgba(220,60,0,0.15)",                                text:"rgba(255,145,65,1)"  };
      return                { bg:"rgba(150,30,0,0.35)",   border:"rgba(200,55,0,0.45)",  glow:"0 0 6px rgba(200,55,0,0.3)",                                                              text:"rgba(220,110,50,0.9)"};
    }

    // Specific team selected - use team color heat
    const tc = getTeamColors(players);
    const hex = tc.primary;
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    // Patriots: boost blue brightness significantly
    const isPatriots = players.some(p => p.team === "New England Patriots" || p.team === "Boston Patriots");
    const br = isPatriots ? Math.min(255, r + 80) : r;
    const bg2 = isPatriots ? Math.min(255, g + 60) : g;
    const bb = isPatriots ? Math.min(255, b + 120) : b;
    const intensity = Math.min(1, 0.3 + count * 0.14);
    return {
      bg:     `rgba(${br},${bg2},${bb},${Math.min(0.65, intensity)})`,
      border: `rgba(${br},${bg2},${bb},${Math.min(1, intensity + 0.35)})`,
      glow:   `0 0 ${8 + count * 4}px rgba(${br},${bg2},${bb},${Math.min(0.85, intensity + 0.25)}), 0 0 ${16 + count * 8}px rgba(${br},${bg2},${bb},${Math.min(0.35, intensity * 0.5)})`,
      text:   tc.text,
    };
  };

  const selectedPlayers = selected !== null ? filteredPlayers(selected) : [];
  const selectedData    = selected !== null ? DATA[selected] : null;
  const selColors       = selected !== null ? cellColors(selected) : {};

  const renderPlayerCard = (p, i) => (
    <div key={i} style={{ borderRadius:10, padding:"12px 14px", marginBottom:8, background:`rgba(0,0,0,0.3)`, border:`1px solid rgba(255,255,255,0.1)` }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8, flexWrap:"nowrap" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, flex:1, minWidth:0 }}>
          <span style={{ fontSize:22 }}>{p.icon}</span>
          <div style={{ minWidth:0 }}>
            <div style={{ fontFamily:"'Bebas Neue',Impact,sans-serif", fontSize:20, letterSpacing:2, lineHeight:1, marginBottom:3, color:"#fff" }}>{p.name}</div>
            <div style={{ display:"flex", gap:5, alignItems:"center", flexWrap:"wrap" }}>
              <span style={{ fontSize:10, fontFamily:"'Share Tech Mono',monospace", color:"rgba(255,255,255,0.6)", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.18)", borderRadius:4, padding:"2px 7px", letterSpacing:1 }}>{p.team}</span>
              {p.status === "Active" && (
                <span style={{ fontSize:9, fontFamily:"'Share Tech Mono',monospace", color:"#8FD920", background:"rgba(143,217,32,0.1)", border:"1px solid rgba(143,217,32,0.3)", borderRadius:4, padding:"1px 6px", letterSpacing:1 }}>ACTIVE</span>
              )}
              <span style={{ fontSize:10, color:"rgba(255,255,255,0.45)", fontFamily:"'Share Tech Mono',monospace" }}>{p.era}</span>
              <span style={{ fontSize:10, color:"rgba(255,255,255,0.35)", fontFamily:"'Share Tech Mono',monospace" }}>{p.role}</span>
            </div>
            {p.funFact && (
              <div style={{ marginTop:6, fontSize:11, color:"rgba(255,255,255,0.5)", fontFamily:"'Share Tech Mono',monospace", lineHeight:1.5 }}>{p.funFact}</div>
            )}
          </div>
        </div>
        {p.stat && (
          <div style={{ textAlign:"right", flexShrink:0, marginLeft:8 }}>
            <div style={{ fontFamily:"'Bebas Neue',Impact,sans-serif", fontSize:28, lineHeight:1, color:selColors.text || "#fff" }}>{p.stat}</div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.55)", fontFamily:"'Share Tech Mono',monospace", letterSpacing:1, maxWidth:110, textAlign:"right", lineHeight:1.3 }}>{p.statLabel}</div>
          </div>
        )}
      </div>
    </div>
  );

  const renderPanel = () => {
    if (selected === null) return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", minHeight:200, gap:12 }}>
        <div style={{ fontFamily:"'Bebas Neue',Impact,sans-serif", fontSize:32, letterSpacing:3, color:"rgba(255,255,255,0.1)" }}>THE BOSTON WALL</div>
        <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, letterSpacing:3, color:"rgba(255,255,255,0.15)" }}>PICK A NUMBER.</div>
      </div>
    );

    const empty = selectedPlayers.length === 0;
    return (
      <div>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:16, gap:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            <div style={{ fontFamily:"'Bebas Neue',Impact,sans-serif", fontSize:64, lineHeight:1, letterSpacing:2, color:selColors.text || "#fff", textShadow:`0 0 30px ${selColors.border}` }}>
              #{selected}
            </div>
            <div>
              <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, letterSpacing:2, color:"rgba(255,255,255,0.35)", marginBottom:4 }}>
                {teamFilter === "ALL" ? "ALL TEAMS" : teamFilter} - JERSEY NUMBER
              </div>
              <div style={{ fontFamily:"'Bebas Neue',Impact,sans-serif", fontSize:15, letterSpacing:1, color:"rgba(255,255,255,0.7)", lineHeight:1.2 }}>
                {empty ? "NO LEGENDS FOR THIS NUMBER" : `${selectedPlayers.length} LEGEND${selectedPlayers.length !== 1 ? "S" : ""} WORE THIS`}
              </div>
            </div>
          </div>
          <button style={{ background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:8, color:"rgba(255,255,255,0.6)", cursor:"pointer", padding:"6px 12px", fontSize:12, fontFamily:"'Share Tech Mono',monospace", whiteSpace:"nowrap" }}
            onClick={() => setSelected(null)}>X</button>
        </div>
        {selectedPlayers.map((p, i) => renderPlayerCard(p, i))}
      </div>
    );
  };

  const renderCell = (num) => {
    const players = filteredPlayers(num);
    const hasPlayers = players.length > 0;
    const isSelected = selected === num;
    const colors = cellColors(num);
    return (
      <div key={num}
        style={{
          aspectRatio:"1", borderRadius:5, display:"flex", alignItems:"center", justifyContent:"center",
          background: isSelected ? "rgba(255,255,255,0.15)" : colors.bg,
          border: `1px solid ${isSelected ? "rgba(255,255,255,0.8)" : colors.border}`,
          boxShadow: isSelected ? `0 0 0 2px rgba(255,255,255,0.5), ${colors.glow}` : colors.glow,
          color: isSelected ? "#fff" : colors.text,
          fontFamily:"'Bebas Neue',Impact,sans-serif",
          fontSize:11, letterSpacing:1,
          cursor: hasPlayers ? "pointer" : "default",
          transition:"all 0.15s",
        }}
        onClick={() => hasPlayers && setSelected(selected === num ? null : num)}
      >
        {num}
      </div>
    );
  };

  return (
    <div style={{ minHeight:"100vh", background:"#080c10", color:"white", fontFamily:"'Courier New',monospace", position:"relative" }}>
      {loading && (
        <div style={{ position:"fixed", inset:0, background:"#080c10", zIndex:999, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:12 }}>
          <div style={{ fontFamily:"'Bebas Neue',Impact,sans-serif", fontSize:28, letterSpacing:4, color:"rgba(255,255,255,0.3)" }}>THE BOSTON WALL</div>
          <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, letterSpacing:3, color:"rgba(232,124,42,0.6)" }}>617 LEGENDS LOADING...</div>
        </div>
      )}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Share+Tech+Mono&family=Caveat:wght@600&display=swap');
        * { box-sizing:border-box; }
        html, body { margin:0; padding:0; overflow-x:hidden; -webkit-text-size-adjust:100%; }
        body::after { content:''; position:fixed; inset:0; pointer-events:none; z-index:999; background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.06) 2px,rgba(0,0,0,0.06) 4px); }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.2); border-radius:2px; }
        .grid-wrap { display:grid; grid-template-columns:repeat(8,1fr); gap:3px; }
        @media(min-width:480px) { .grid-wrap { grid-template-columns:repeat(10,1fr); gap:4px; } }
        @media(min-width:700px) { .grid-wrap { grid-template-columns:repeat(11,1fr); gap:5px; } }
        @media(min-width:960px) { .grid-wrap { grid-template-columns:repeat(11,1fr); gap:6px; } }
        .team-pill { border-radius:20px; padding:5px 12px; font-size:11px; font-family:'Share Tech Mono',monospace; letter-spacing:1px; cursor:pointer; border:1px solid; transition:all 0.2s; white-space:nowrap; }
        .filter-scroll { display:flex; gap:6px; overflow-x:auto; scrollbar-width:none; padding-bottom:2px; }
        .filter-scroll::-webkit-scrollbar { display:none; }
        .tab-btn { font-family:'Bebas Neue',Impact,sans-serif; font-size:16px; letter-spacing:2px; padding:8px 20px; border-radius:8px; cursor:pointer; border:1px solid; transition:all 0.2s; }
        .desktop-layout { display:flex; height:calc(100vh - 140px); }
        .desktop-grid-col { flex:0 0 61.8%; overflow-y:auto; padding:16px 14px; border-right:1px solid rgba(255,255,255,0.06); }
        .desktop-panel-col { flex:0 0 38.2%; overflow-y:auto; padding:20px; }
        .bottom-sheet { position:fixed; bottom:0; left:0; right:0; background:#0d1117; border-top:1px solid rgba(255,255,255,0.12); border-radius:20px 20px 0 0; z-index:200; max-height:72vh; overflow-y:auto; padding:0 16px 40px; transition:transform 0.35s cubic-bezier(0.32,0.72,0,1); -webkit-overflow-scrolling:touch; }
        .sheet-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:199; backdrop-filter:blur(2px); }
      `}</style>

      {/* HEADER */}
      <div style={{ borderBottom:"1px solid rgba(255,255,255,0.08)", padding:"12px 14px 10px", background:"rgba(0,0,0,0.5)", backdropFilter:"blur(10px)", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
          <a href="/" style={{ textDecoration:"none", color:"rgba(255,255,255,0.35)", fontFamily:"'Share Tech Mono',monospace", fontSize:10, letterSpacing:2, display:"flex", alignItems:"center", gap:4, transition:"color 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.color="rgba(255,255,255,0.7)"}
            onMouseLeave={e => e.currentTarget.style.color="rgba(255,255,255,0.35)"}>
            ← THE NUMBER WALL
          </a>
        </div>
        <div style={{ textAlign:"center", marginBottom:10 }}>
          <div style={{ fontFamily:"'Bebas Neue',Impact,sans-serif", fontSize:isDesktop?36:28, letterSpacing:3, lineHeight:1 }}>THE BOSTON WALL</div>
          <div style={{ fontFamily:"'Caveat',cursive", fontSize:18, fontWeight:600, color:"#E87C2A", textShadow:"0 0 16px rgba(232,124,42,0.6)", marginTop:3 }}>617 legends live here.</div>
        </div>

        {/* COMBINED FILTER ROW - tab toggle + team filter in one scrollable line */}
        <div ref={filterRef} className="filter-scroll" style={{ marginBottom:6 }}>
          {/* LEGENDS / SEASON tabs - same sport-pill style */}
          {["legends","current"].map(t => {
            const active = tab === t;
            return (
              <button key={t} className="team-pill"
                style={{
                  background: active ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.04)",
                  borderColor: active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.12)",
                  color: active ? "#0a0d14" : "rgba(255,255,255,0.45)",
                  boxShadow: active ? "0 0 12px rgba(255,255,255,0.35)" : "none",
                  fontFamily:"'Bebas Neue',Impact,sans-serif",
                  fontSize:13, letterSpacing:2,
                }}
                onClick={() => setTab(t)}>{t === "legends" ? "LEGENDS" : "2025–26"}</button>
            );
          })}

          {/* Divider */}
          <div style={{ width:1, background:"rgba(255,255,255,0.15)", alignSelf:"stretch", margin:"0 4px", flexShrink:0 }} />

          {/* TEAM FILTER - all white, no team colors */}
          {TEAM_FILTERS.map(t => {
            const active = teamFilter === t;
            return (
              <button key={t} className="team-pill"
                style={{
                  background: active ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.04)",
                  borderColor: active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.12)",
                  color: active ? "#0a0d14" : "rgba(255,255,255,0.45)",
                  boxShadow: active ? "0 0 12px rgba(255,255,255,0.35)" : "none",
                }}
                onClick={() => setTeamFilter(t)}>{t}</button>
            );
          })}
        </div>
        <div style={{ textAlign:"center", marginTop:8, fontFamily:"'Share Tech Mono',monospace", fontSize:10, letterSpacing:3, color:"rgba(255,255,255,0.2)" }}>PICK A NUMBER.</div>
      </div>

      {/* DESKTOP */}
      {isDesktop ? (
        <div className="desktop-layout">
          <div className="desktop-grid-col">
            <div className="grid-wrap">
              {Array.from({ length: 100 }, (_, i) => renderCell(i))}
            </div>
          </div>
          <div className="desktop-panel-col">{renderPanel()}</div>
        </div>
      ) : (
        /* MOBILE */
        <div style={{ padding:"10px 12px", overflowX:"hidden", maxWidth:"100vw" }}>
          <div className="grid-wrap">
            {Array.from({ length: 100 }, (_, i) => renderCell(i))}
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM SHEET */}
      {!isDesktop && selected !== null && (
        <>
          <div className="sheet-overlay" onClick={() => setSelected(null)} />
          <div className="bottom-sheet" ref={sheetRef}>
            <div style={{ width:36, height:4, borderRadius:2, background:"rgba(255,255,255,0.2)", margin:"12px auto 16px" }} />
            {renderPanel()}
          </div>
        </>
      )}
    </div>
  );
}
