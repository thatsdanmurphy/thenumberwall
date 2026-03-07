import { useState, useEffect, useRef } from "react";

// --- SPORTS ------------------------------------------------------------------
const SPORTS = ["ALL","Hockey","Basketball","Football","Baseball","Soccer"];
const SPORT_FILTER_MAP = { "Hockey":["NHL","Hockey","PWHL"], "Basketball":["NBA","Basketball","WNBA"], "Football":["NFL","Football"], "Baseball":["MLB","Baseball"], "Soccer":["Soccer"] };
// Single color language - white active state, no per-sport hues
const SPORT_TAB = {
  active:   { bg:"rgba(255,255,255,0.92)", border:"rgba(255,255,255,0.9)", color:"#0a0d14", glow:"0 0 12px rgba(255,255,255,0.35)" },
  inactive: { bg:"rgba(255,255,255,0.04)", border:"rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.45)", glow:"none" },
};

// --- TIER SYSTEM -------------------------------------------------------------
// heat values: SACRED=10, LEGEND=8, RISING=5, UNWRITTEN=1
const TIER = { SACRED:"SACRED", LEGEND:"LEGEND", RISING:"RISING", UNWRITTEN:"UNWRITTEN" };

const tierHeat = { SACRED:10, LEGEND:8, RISING:5, UNWRITTEN:1 };

// --- SHEET CONFIG -----------------------------------------------------------
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSK0TtNNPbOkdaVIRrV9zDl8HOeN_y64j5kvoDZI08seUPN0q8GXOXCfGjdIaW5MQ9WgYnH0EDGigbZ/pub?gid=0&single=true&output=csv";

const SPORT_ICON_MAP = { Basketball:"🏀", Football:"🏈", Baseball:"⚾", Hockey:"🏒", Soccer:"⚽" };

function parseCSVLine(line) {
  const result = []; let cur = ""; let inQ = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') { inQ = !inQ; }
    else if (line[i] === "," && !inQ) { result.push(cur.trim()); cur = ""; }
    else { cur += line[i]; }
  }
  result.push(cur.trim());
  return result;
}

function buildNumberData(rows) {
  const data = {};
  // init all 1-99 as UNWRITTEN
  for (let i = 1; i <= 99; i++) data[i] = { tier: TIER.UNWRITTEN, players: [] };
  rows.forEach(r => {
    const num = parseInt(r["Number"]);
    if (!num || isNaN(num) || !r["Name"]) return;
    const sport = r["Sport"] || "";
    const league = r["League"] || "";
    const team = r["City + Team"] || r["Team"] || "";
    const player = {
      name: r["Name"], sport, league, team,
      status: r["Status"] || "Retired",
      era: r["Era"] || "",
      stat: r["Signature Stat"] || r["Stat"] || "",
      statLabel: r["Stat Label"] || r["StatLabel"] || "",
      statWeight: parseInt(r["Stat Weight"] || r["StatWeight"]) || 1,
      role: r["Role"] || "",
      funFact: r["Fun Fact"] || r["FunFact"] || "",
      icon: SPORT_ICON_MAP[sport] || "🏅",
    };
    if (!data[num]) data[num] = { tier: TIER.UNWRITTEN, players: [] };
    data[num].players.push(player);
    // tier: SACRED > LEGEND > UNWRITTEN
    const t = (r["Tier"] || "").toUpperCase().trim();
    if (t === "SACRED") data[num].tier = TIER.SACRED;
    else if (t === "LEGEND" && data[num].tier !== TIER.SACRED) data[num].tier = TIER.LEGEND;
    else if (t === "" && data[num].tier === TIER.UNWRITTEN) data[num].tier = TIER.LEGEND; // inherit if blank row follows
    // carry sacredSport from existing CARD_CONTENT lookup (handled below)
  });
  return data;
}

// NUMBER_DATA starts as empty, populated after fetch
let NUMBER_DATA = {};
for (let i = 1; i <= 99; i++) NUMBER_DATA[i] = { tier: TIER.UNWRITTEN, players: [] };
// Also init numberData state default
const EMPTY_GRID = Object.fromEntries(Array.from({length:99},(_,i) => [i+1, {tier:TIER.UNWRITTEN,players:[]}]));



// Sacred number sport lookup for fetch layer
const SACRED_NUMBERS = { 6: "NBA", 23: "NBA", 42: "MLB", 99: "NHL" };

// --- WRITTEN CARD CONTENT (Sacred + #23 exception) ---------------------------
const CARD_CONTENT = {
  6: {
    intro: "The NBA retired this number across all 30 franchises. No player, ever again.",
    stacks: [{
      name: "Bill Russell", sport: "NBA",
      body: "Bill Russell won 11 NBA championships in 13 seasons. Not 11 trophies. Eleven times his team was the best in the world. He anchored a Boston Celtics dynasty that was the most dominant run in North American pro sports history - and he did it while facing racism that would have broken most people.",
      waitWhat: "The NBA retired #6 league-wide in 2022 - 55 years after his last championship. Russell is the only player in NBA history given that honor. Because some things take time to understand.",
    }],
    sacredLine: "THE ONLY NUMBER THE NBA HAS EVER RETIRED LEAGUE-WIDE",
  },
  23: {
    intro: "The NBA retired this number league-wide. Then bent its own rule for one player.",
    stacks: [
      {
        name: "Michael Jordan", sport: "NBA",
        body: "Six championships. Six Finals MVPs. Five league MVPs. Michael Jordan didn't just win - he made losing feel impossible. The NBA did something it had never done before: retired his number across all 30 franchises, for all time.",
        waitWhat: "Jordan is one of only two players the NBA has ever honored this way. The other is Bill Russell (#6). Two players. Sixty years of basketball. That's it.",
      },
      {
        name: "LeBron James", sport: "NBA",
        connector: "There was just one problem. The greatest player of the next generation had already been wearing #23 his whole career. And he wasn't about to stop.",
        body: "Four championships. Four Finals MVPs. The all-time NBA scoring leader. LeBron James is the argument you make when someone says Jordan is untouchable. The league looked the other way - he's the only player ever granted an exception to a retired number.",
      }
    ],
    sacredLine: "RETIRED LEAGUE-WIDE - WITH ONE DOCUMENTED EXCEPTION",
  },
  42: {
    intro: "The only number retired across all of Major League Baseball.",
    stacks: [{
      name: "Jackie Robinson", sport: "MLB",
      body: "In 1947, Jackie Robinson walked onto a Major League Baseball field and changed the country. Six-time All-Star. 1949 MVP. Rookie of the Year. He walked into a world that didn't want him there - through death threats and hatred - with more dignity than the game deserved. His number isn't retired because of the stats.",
      waitWhat: "In 1997, MLB retired #42 across every team in baseball - the only time a sport has done that for a position player. Every April 15th, every player wears #42. The number belongs to everyone now, and to no one.",
    }],
    sacredLine: "THE ONLY NUMBER RETIRED ACROSS ALL OF MAJOR LEAGUE BASEBALL",
  },
  99: {
    intro: "The only number retired across all of the NHL. Forever.",
    stacks: [{
      name: "Wayne Gretzky", sport: "NHL",
      body: "Wayne Gretzky holds 61 NHL records. If you removed every goal he ever scored, he'd still be the all-time points leader - just from his assists. Nine Hart Trophies. Four Stanley Cups. Over two points per game for his entire career. There is no debate. There's just Gretzky, and then everyone else.",
      waitWhat: "In 1999, the NHL retired #99 across every franchise - no player can ever wear it again. He chose 99 as a kid because all the single digits were taken. A number nobody wanted became the number no one can have.",
    }],
    sacredLine: "THE ONLY NUMBER RETIRED ACROSS ALL OF THE NHL",
  },
};

// --- TIER COLOR SYSTEM --------------------------------------------------------
// Sacred  -> White Ranger: bright white/silver, ice glow, transcendent
// Legend  -> Amber fire: the original heat language
// Rising  -> Electric lime: active, current, alive
// Unwritten -> Dim coal: barely there

const TIER_COLORS = {
  SACRED: {
    bg:     "rgba(220,235,255,0.12)",
    text:   "rgba(230,240,255,0.95)",
    border: "rgba(200,220,255,0.55)",
    glow:   "0 0 18px rgba(200,220,255,0.45), 0 0 36px rgba(180,210,255,0.15)",
    accent: "#C8DCFF",
    badge:  "rgba(200,220,255,0.12)",
  },
  LEGEND: {
    bg:     "rgba(200,50,0,0.45)",
    text:   "rgba(255,150,80,1)",
    border: "rgba(255,80,0,0.55)",
    glow:   "0 0 12px rgba(255,80,0,0.4), 0 0 28px rgba(255,80,0,0.15)",
    accent: "#FF8C42",
    badge:  "rgba(255,80,0,0.12)",
  },
  RISING: {
    bg:     "rgba(80,200,0,0.18)",
    text:   "rgba(160,240,60,0.95)",
    border: "rgba(120,220,20,0.45)",
    glow:   "0 0 12px rgba(120,220,20,0.3), 0 0 24px rgba(120,220,20,0.1)",
    accent: "#8FD920",
    badge:  "rgba(120,220,20,0.1)",
  },
  UNWRITTEN: {
    bg:     "rgba(255,255,255,0.06)",
    text:   "rgba(255,255,255,0.42)",
    border: "rgba(255,255,255,0.22)",
    glow:   "none",
    accent: "rgba(255,255,255,0.2)",
    badge:  "rgba(255,255,255,0.05)",
  },
};

function tierColors(tier, isSelected) {
  if (isSelected) return {
    bg:"rgba(255,255,255,0.15)", text:"#fff",
    border:"rgba(255,255,255,0.8)", glow:"0 0 0 2px rgba(255,255,255,0.6), 0 0 20px rgba(255,255,255,0.3)",
    accent:"#fff", badge:"rgba(255,255,255,0.1)",
  };
  return TIER_COLORS[tier] || TIER_COLORS.UNWRITTEN;
}

// Legacy alias so existing heatToColor references keep working
function heatToColor(heat, isSelected) {
  if (isSelected) return { bg:"rgba(255,255,255,0.15)", text:"#fff", border:"rgba(255,255,255,0.7)", glow:"0 0 20px rgba(255,255,255,0.3)" };
  if (heat >= 10) return TIER_COLORS.SACRED;
  if (heat >= 8)  return TIER_COLORS.LEGEND;
  if (heat >= 5)  return TIER_COLORS.RISING;
  return TIER_COLORS.UNWRITTEN;
}

function tierLabel(tier) {
  if (tier === TIER.SACRED)    return "o SACRED - RETIRED LEAGUE-WIDE";
  if (tier === TIER.LEGEND)    return "* LEGEND";
  if (tier === TIER.RISING)    return "ACTIVE";
  return "o UNWRITTEN";
}

export default function WornNumbers() {
  const [selected, setSelected] = useState(null);
  const [sport, setSport]       = useState("ALL");
  const filterRef = useRef(null);
  const [numberData, setNumberData] = useState(EMPTY_GRID);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetch(SHEET_URL)
      .then(r => r.text())
      .then(csv => {
        const lines = csv.split("\n").filter(Boolean);
        const headers = parseCSVLine(lines[0]);
        const rows = lines.slice(1).map(line => {
          const vals = parseCSVLine(line);
          const obj = {};
          headers.forEach((h, i) => obj[h] = vals[i] || "");
          return obj;
        });
        const built = buildNumberData(rows);
        // Preserve CARD_CONTENT sacred data (sacredSport etc)
        Object.keys(SACRED_NUMBERS).forEach(n => {
          if (built[n]) {
            built[n].sacredSport = SACRED_NUMBERS[n];
            built[n].tier = TIER.SACRED;
          }
        });
        setNumberData(built);
        NUMBER_DATA = built;
        setLoading(false);
      })
      .catch(err => { console.error('NumberWall fetch error:', err); setLoading(false); });
  }, []);
  const [hovered, setHovered]   = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [shareActive, setShareActive] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const sheetRef = useRef(null);

  const handleShare = () => {
    const url = `${window.location.origin}/?n=${selected}`;
    const players = selectedPlayers.map(p => p.name).join(" · ");
    if (navigator.share) {
      navigator.share({ title: `#${selected} on The Number Wall`, text: players, url });
    } else {
      navigator.clipboard?.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  };

  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth < 700);
      setIsDesktop(window.innerWidth >= 960);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Read ?n= param from URL and auto-open that number
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const n = parseInt(params.get("n"));
    if (!isNaN(n) && n >= 0 && n <= 99) setSelected(n);
  }, []);

  // Update OG meta tags when a number is selected
  useEffect(() => {
    if (selected === null) return;
    const players = selectedPlayers.map(p => p.name).join(" · ");
    const ogUrl = `https://thenumberwall.com/api/og?n=${selected}`;
    const setMeta = (prop, content) => {
      let el = document.querySelector(`meta[property="${prop}"]`) || document.querySelector(`meta[name="${prop}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute(prop.startsWith("og:") || prop.startsWith("twitter:") ? "property" : "name", prop); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta("og:title",       `#${selected} on The Number Wall`);
    setMeta("og:description", players || `Who wore #${selected}? Find out on The Number Wall.`);
    setMeta("og:image",       ogUrl);
    setMeta("og:url",         `https://thenumberwall.com/?n=${selected}`);
    setMeta("twitter:card",   "summary_large_image");
    setMeta("twitter:image",  ogUrl);
  }, [selected]);

  useEffect(() => { if (filterRef.current) filterRef.current.scrollLeft = 0; }, [sport]);

  const filteredPlayers = (num) => {
    const d = numberData[num];
    if (!d || !d.players) return [];
    if (sport === "ALL") return d.players;
    const vals = SPORT_FILTER_MAP[sport] || [sport];
    return d.players.filter(p => vals.includes(p.sport) || vals.includes(p.league));
  };

  const visibleHeat = (num) => {
    const d = numberData[num];
    if (!d) return 0;
    if (sport === "ALL") return tierHeat[d.tier] || 0;
    const fp = filteredPlayers(num);
    if (!fp.length) return 0;
    return tierHeat[d.tier] || 0;
  };

  const selectedData    = selected !== null ? numberData[selected] : null;
  const selectedPlayers = selected !== null ? filteredPlayers(selected) : [];
  const selectedContent = selected !== null ? CARD_CONTENT[selected] : null;
  const selectedTier    = selectedData?.tier || TIER.UNWRITTEN;
  const selectedColors  = tierColors(selectedTier, false);
  const selectedAccent  = selectedColors.accent;


  // -- GRID CELL RENDERER --------------------------------------------------
  const renderCell = (num) => {
    const tier      = numberData[num]?.tier || TIER.UNWRITTEN;
    const allP      = numberData[num]?.players || [];
    const filtP     = filteredPlayers(num);
    const hasP      = filtP.length > 0;
    const dimmed    = sport !== "ALL" && !hasP;
    const playerCount = sport === "ALL" ? allP.length : filtP.length;
    const isSelected  = selected === num;
const sacredSport = numberData[num]?.sacredSport;
    const sacredActive = tier === TIER.SACRED && (sport === "ALL" || sport === sacredSport);
    const effectiveTier = sacredActive ? tier : (tier === TIER.SACRED ? TIER.LEGEND : tier);

    let colors;
    if (dimmed && !isSelected) {
      colors = { ...TIER_COLORS.UNWRITTEN, glow: "none" };
    } else {
      const base = tierColors(effectiveTier, isSelected);
      colors = base;
      if ((effectiveTier === TIER.LEGEND || effectiveTier === TIER.RISING) && !isSelected) {
        if (playerCount >= 6) {
          colors = { ...base, bg:"rgba(220,70,0,0.75)", text:"rgba(255,210,120,1)", border:"rgba(255,120,20,1)", glow:"0 0 22px rgba(255,120,20,0.85),0 0 44px rgba(255,80,0,0.45),0 0 60px rgba(255,60,0,0.2)" };
        } else if (playerCount >= 4) {
          colors = { ...base, bg:"rgba(210,60,0,0.65)", text:"rgba(255,190,100,1)", border:"rgba(255,100,20,0.9)", glow:"0 0 18px rgba(255,100,20,0.7),0 0 36px rgba(255,80,0,0.35)" };
        } else if (playerCount >= 3) {
          colors = { ...base, bg:"rgba(200,50,0,0.55)", text:"rgba(255,170,85,1)", border:"rgba(255,85,10,0.75)", glow:"0 0 14px rgba(255,85,10,0.55),0 0 28px rgba(255,70,0,0.25)" };
        } else if (playerCount === 2) {
          colors = { ...base, bg:"rgba(180,40,0,0.45)", text:"rgba(255,145,65,1)", border:"rgba(240,70,5,0.6)", glow:"0 0 10px rgba(240,70,5,0.4),0 0 20px rgba(220,60,0,0.15)" };
        } else {
          colors = { ...base, bg:"rgba(150,30,0,0.35)", text:"rgba(220,110,50,0.9)", border:"rgba(200,55,0,0.45)", glow:"0 0 6px rgba(200,55,0,0.3)" };
        }
      }
    }

    return (
      <div
        key={num}
        className="cell grid-cell-in"
        style={{
          animationDelay: `${num * 5}ms`,
          aspectRatio: "1",
          background: colors.bg,
          borderColor: colors.border,
          boxShadow: isSelected ? `0 0 0 2px ${colors.accent}, ${colors.glow}` : colors.glow,
          color: colors.text,
          fontFamily: "'Bebas Neue',Impact,sans-serif",
          letterSpacing: 1,
          cursor: "pointer",
        }}
        onClick={() => setSelected(selected === num ? null : num)}
        onMouseEnter={() => setHovered(num)}
        onMouseLeave={() => setHovered(null)}
      >
        <span className="cell-label">{num}</span>

      </div>
    );
  };

  // -- PANEL CONTENT RENDERER -----------------------------------------------
  const renderPanelContent = () => {
    if (selected === null) return null;
    const content = CARD_CONTENT[selected];
    const selPlayers = selectedPlayers;

    if (content) {
      return (
        <div>
          {content.stacks && content.stacks.map((stack, si) => (
            <div key={si} style={{ marginBottom: si < content.stacks.length - 1 ? 24 : 0 }}>
              {content.stacks.length > 1 && (
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                  <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:11, letterSpacing:2, color:"rgba(255,255,255,0.4)" }}>{stack.sport}</span>
                </div>
              )}
              <p style={{ margin:"0 0 10px", fontSize:14, lineHeight:1.65, color:"rgba(255,255,255,0.78)", fontFamily:"Georgia,serif" }}>
                {stack.body}
              </p>
              {stack.connector && (
                <p style={{ margin:"0 0 10px", fontSize:13, lineHeight:1.6, color:"rgba(255,255,255,0.5)", fontStyle:"italic", borderLeft:`2px solid ${selectedAccent}`, paddingLeft:10 }}>
                  {stack.connector}
                </p>
              )}
              {stack.waitWhat && (
                <div style={{ background:"rgba(255,255,255,0.03)", borderRadius:8, padding:"10px 12px", marginTop:8 }}>
                  <div style={{ fontSize:9, letterSpacing:3, fontFamily:"'Share Tech Mono',monospace", color:selectedAccent, marginBottom:6 }}>WAIT, WHAT?</div>
                  <p style={{ margin:0, fontSize:13, lineHeight:1.6, color:"rgba(255,255,255,0.6)", fontFamily:"Georgia,serif" }}>{stack.waitWhat}</p>
                </div>
              )}
            </div>
          ))}
          {content.sacredLine && (
            <div style={{ marginTop:4, padding:"12px 16px", borderRadius:8, background:"rgba(200,220,255,0.06)", border:"1px solid rgba(200,220,255,0.2)", textAlign:"center" }}>
              <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:11, letterSpacing:2, color:"#C8DCFF" }}>{content.sacredLine}</span>
            </div>
          )}
        </div>
      );
    }

    if (selectedData?.tier === TIER.UNWRITTEN) {
      return (
        <div style={{ padding:"24px 0 16px" }}>
          <div style={{ textAlign:"center", marginBottom:28 }}>
            <div className="bebas" style={{ fontSize:18, letterSpacing:3, color:"rgba(255,255,255,0.18)", marginBottom:16 }}>
              #{selected} - UNWRITTEN
            </div>
            <p style={{ fontSize:22, lineHeight:1.4, margin:"0 auto", maxWidth:320, color:"rgba(255,255,255,0.7)", fontFamily:"'Bebas Neue',Impact,sans-serif", letterSpacing:1 }}>
              This one hasn't found its legend
            </p>
            <p style={{ fontSize:22, lineHeight:1.4, margin:"4px auto 0", maxWidth:320, fontFamily:"'Bebas Neue',Impact,sans-serif", letterSpacing:1, color:"rgba(255,255,255,0.32)" }}>
              Yet.
            </p>
          </div>
          <div style={{ textAlign:"center", marginBottom:28, fontFamily:"'Share Tech Mono',monospace", fontSize:11, letterSpacing:2, color:"rgba(255,255,255,0.2)", lineHeight:1.7 }}>
            NO LEGEND HAS CLAIMED #{selected}<br/>
            ACROSS HOCKEY - BASKETBALL - FOOTBALL - BASEBALL - SOCCER
          </div>
          <div style={{ borderTop:"1px solid rgba(255,255,255,0.07)", paddingTop:20, textAlign:"center" }}>
            <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, letterSpacing:3, color:"rgba(255,255,255,0.2)", marginBottom:10 }}>
              THINK WE MISSED SOMEONE?
            </div>
            <button
              style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:8, padding:"9px 20px", fontFamily:"'Share Tech Mono',monospace", fontSize:12, letterSpacing:2, color:"rgba(255,255,255,0.4)", cursor:"pointer" }}
              onClick={() => alert("Community nominations coming soon - nominate a legend for #" + selected + ".")}
            >
              NOMINATE A LEGEND -&gt;
            </button>
          </div>
        </div>
      );
    }

    return (
      <>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {selPlayers.length > 0 ? selPlayers.map((p, i) => (
          <div key={i} className="player-card">
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8, flexWrap:"nowrap" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, flex:1, minWidth:0 }}>
                <span style={{ fontSize:24 }}>{p.icon}</span>
                <div>
                  <div className="bebas" style={{ fontSize:22, letterSpacing:2, lineHeight:1, marginBottom:3 }}>{p.name}</div>
                  <div style={{ display:"flex", gap:5, alignItems:"center", flexWrap:"wrap" }}>
                    <span style={{ fontSize:10, fontFamily:"'Share Tech Mono',monospace", color:"rgba(255,255,255,0.55)", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.18)", borderRadius:4, padding:"2px 7px", letterSpacing:1 }}>{p.sport}{p.league && p.league !== p.sport ? ` · ${p.league}` : ""}</span>
                    {p.team && (
                      <span style={{ fontSize:10, fontFamily:"'Share Tech Mono',monospace", color:"rgba(255,255,255,0.65)", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.18)", borderRadius:4, padding:"1px 7px", letterSpacing:1, fontWeight:600 }}>{p.team}</span>
                    )}
                    {p.status === "Active" && (
                      <span style={{ fontSize:9, fontFamily:"'Share Tech Mono',monospace", color:"#8FD920", background:"rgba(143,217,32,0.1)", border:"1px solid rgba(143,217,32,0.3)", borderRadius:4, padding:"1px 6px", letterSpacing:1 }}>ACTIVE</span>
                    )}
                    <span style={{ fontSize:10, color:"rgba(255,255,255,0.45)", fontFamily:"'Share Tech Mono',monospace" }}>{p.era}</span>
                    <span style={{ fontSize:10, color:"rgba(255,255,255,0.38)", fontFamily:"'Share Tech Mono',monospace" }}>{p.role}</span>
                  </div>
                </div>
              </div>
              {p.stat && p.stat !== "-" && (
                <div style={{ textAlign:"right", flexShrink:0, marginLeft:8 }}>
                  <div className="stat-num" style={{ color:selectedColors.text, textShadow:`0 0 12px ${selectedColors.border}` }}>{p.stat}</div>
                  <div style={{ fontSize:10, color:"rgba(255,255,255,0.55)", fontFamily:"'Share Tech Mono',monospace", letterSpacing:1, maxWidth:110, textAlign:"right", lineHeight:1.3 }}>{p.statLabel}</div>
                </div>
              )}
            </div>
          </div>
        )) : (
          <div style={{ textAlign:"center", padding:"30px 0", color:"rgba(255,255,255,0.2)", fontFamily:"'Share Tech Mono',monospace", fontSize:13 }}>
            {sport !== "ALL" ? `No ${sport} legends for #${selected}` : `No legend data for #${selected}`}
          </div>
        )}
      </div>

      {selectedPlayers.length > 0 && (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:14, paddingTop:12, borderTop:"1px solid rgba(255,255,255,0.06)" }}>
          <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, letterSpacing:2, color:"rgba(255,255,255,0.2)" }}>
            THENUMBERWALL.COM · #{selected}
          </span>
          <button onClick={handleShare}
            style={{ display:"flex", alignItems:"center", gap:6, background:shareCopied?"rgba(143,217,32,0.12)":"rgba(232,124,42,0.12)", border:`1px solid ${shareCopied?"rgba(143,217,32,0.4)":"rgba(232,124,42,0.4)"}`, borderRadius:6, padding:"5px 12px", color:shareCopied?"#8FD920":"rgba(232,124,42,0.9)", fontFamily:"'Share Tech Mono',monospace", fontSize:10, letterSpacing:1, cursor:"pointer", transition:"all 0.15s" }}
            onMouseEnter={e=>{ if(!shareCopied){e.currentTarget.style.background="rgba(232,124,42,0.22)";e.currentTarget.style.borderColor="rgba(232,124,42,0.7)";e.currentTarget.style.boxShadow="0 0 12px rgba(232,124,42,0.25)";}}}
            onMouseLeave={e=>{ if(!shareCopied){e.currentTarget.style.background="rgba(232,124,42,0.12)";e.currentTarget.style.borderColor="rgba(232,124,42,0.4)";e.currentTarget.style.boxShadow="none";}}}
          >
            {shareCopied
              ? <><svg style={{width:11,height:11,fill:"currentColor"}} viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>&nbsp;COPIED</>
              : <><svg style={{width:12,height:12,fill:"currentColor"}} viewBox="0 0 24 24"><path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"/></svg>&nbsp;SHARE #{selected}</>
            }
          </button>
        </div>
      )}
      </>
    );
  };

  // -- PANEL HEADER ---------------------------------------------------------
  const renderPanelHeader = () => {
    if (selected === null) return null;
    return (
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:16, gap:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <div className="bebas" style={{ fontSize:64, lineHeight:1, letterSpacing:2, color:selectedColors.text, textShadow:`0 0 30px ${selectedColors.border}` }}>
            #{selected}
          </div>
          <div>
            <div className="mono" style={{ fontSize:9, letterSpacing:2, color:"rgba(255,255,255,0.35)", marginBottom:4, whiteSpace:"nowrap" }}>
              {sport === "ALL" ? "ALL SPORTS" : sport} - JERSEY NUMBER
            </div>
            <div className="bebas" style={{ fontSize:16, letterSpacing:1, color:"rgba(255,255,255,0.7)", lineHeight:1.2 }}>
              {selectedData?.tier === TIER.SACRED
                ? selectedData.players.map(p => p.name).join(" · ")
                : selectedData?.tier === TIER.LEGEND
                ? `${selectedPlayers.length} LEGEND${selectedPlayers.length !== 1 ? "S" : ""} WORE THIS`
                : selectedData?.tier === TIER.RISING
                ? `${selectedPlayers.length} LEGEND${selectedPlayers.length !== 1 ? "S" : ""} WORE THIS`
                : "UNWRITTEN"}
            </div>
            {selectedData?.tier === TIER.SACRED && (
              <div style={{ display:"inline-block", marginTop:4, background:"rgba(200,220,255,0.1)", border:"1px solid rgba(200,220,255,0.35)", borderRadius:6, padding:"2px 8px", fontSize:10, color:"#C8DCFF", fontFamily:"'Share Tech Mono',monospace", letterSpacing:2 }}>
                {selectedData.sacredSport === "NBA" ? "RETIRED NBA-WIDE" : selectedData.sacredSport === "MLB" ? "RETIRED MLB-WIDE" : selectedData.sacredSport === "NHL" ? "RETIRED NHL-WIDE" : "RETIRED LEAGUE-WIDE"}
              </div>
            )}
          </div>
        </div>
        <button className="close-btn" onClick={() => setSelected(null)}>X</button>
      </div>
    );
  };

  // -- MAIN RETURN ----------------------------------------------------------
  return (
    <div style={{ minHeight:"100vh", background:"#080c10", color:"white", fontFamily:"'Courier New',monospace", position:"relative" }}>
      {loading && (
        <div style={{ position:"fixed", inset:0, background:"#080c10", zIndex:999, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:12 }}>
          <div style={{ fontFamily:"'Bebas Neue',Impact,sans-serif", fontSize:32, letterSpacing:4, color:"rgba(255,255,255,0.3)" }}>THE NUMBER WALL</div>
          <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, letterSpacing:3, color:"rgba(255,107,0,0.6)" }}>LOADING LEGENDS...</div>
        </div>
      )}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Share+Tech+Mono&family=Caveat:wght@600&display=swap');
        * { box-sizing:border-box; }
        html, body { margin:0; padding:0; overflow-x:hidden; -webkit-text-size-adjust:100%; }
        .bebas { font-family:'Bebas Neue',Impact,sans-serif; }
        .mono  { font-family:'Share Tech Mono','Courier New',monospace; }
        body::after {
          content:''; position:fixed; inset:0; pointer-events:none; z-index:999;
          background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.07) 2px,rgba(0,0,0,0.07) 4px);
        }
        .cell {
          border-radius:6px; cursor:pointer; display:flex; align-items:center;
          justify-content:center; font-weight:900; transition:transform 0.15s ease,box-shadow 0.15s ease;
          position:relative; border:1px solid; user-select:none;
        }
        .cell:hover { transform:scale(1.18) !important; z-index:10; }
        .sport-pill {
          border-radius:20px; padding:6px 14px; font-size:12px; cursor:pointer;
          border:1px solid; transition:all 0.2s; font-weight:700; letter-spacing:1px;
        }
        .sport-pill:hover { transform:translateY(-2px); }
        .player-card {
          border-radius:12px; padding:14px 16px;
          border:1px solid rgba(255,255,255,0.1);
          background:rgba(255,255,255,0.04);
          transition:all 0.2s; animation:cardIn 0.3s ease both;
        }
        .player-card:hover { background:rgba(255,255,255,0.08); border-color:rgba(255,255,255,0.2); transform:translateX(4px); }
        .written-card {
          border-radius:12px; padding:18px 16px;
          border:1px solid rgba(255,255,255,0.12);
          background:rgba(255,255,255,0.04);
          animation:cardIn 0.3s ease both;
        }
        @keyframes cardIn   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes panelIn  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
        @keyframes cellIn   { from{opacity:0;transform:scale(0.7)}       to{opacity:1;transform:scale(1)} }
        .panel-in { animation:panelIn 0.35s ease both; }
        .stat-num { font-family:'Bebas Neue',Impact,sans-serif; font-size:28px; line-height:1; }
        .close-btn {
          background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.2);
          border-radius:8px; color:rgba(255,255,255,0.6); cursor:pointer;
          padding:6px 12px; font-size:12px; transition:all 0.2s;
          font-family:'Share Tech Mono',monospace; white-space:nowrap;
        }
        .close-btn:hover { background:rgba(255,255,255,0.15); color:white; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.2); border-radius:2px; }
        .wordmark { font-size:28px; letter-spacing:3px; }
        .subtext  { font-size:9px; letter-spacing:3px; }
        .grid-wrap { display:grid; grid-template-columns:repeat(8,1fr); gap:3px; }
        .cell-label { font-size:11px; }
        .panel-number { font-size:56px; }
        .panel-wrap { padding:16px 14px; }
        .sport-filter-wrap {
          display:flex; gap:5px; overflow-x:auto;
          scrollbar-width:none; -ms-overflow-style:none; padding-bottom:2px;
        }
        .sport-filter-wrap::-webkit-scrollbar { display:none; }
        .tier-key { display:flex; gap:12px; flex-wrap:wrap; justify-content:center; }
        .bottom-sheet {
          position:fixed; bottom:0; left:0; right:0;
          background:#0d1117;
          border-top:1px solid rgba(255,255,255,0.12);
          border-radius:20px 20px 0 0;
          z-index:200; max-height:72vh; overflow-y:auto;
          padding:0 16px 40px;
          transition:transform 0.35s cubic-bezier(0.32,0.72,0,1);
          -webkit-overflow-scrolling:touch;
        }
        .sheet-handle {
          width:36px; height:4px; border-radius:2px;
          background:rgba(255,255,255,0.2); margin:12px auto 16px;
        }
        .sheet-overlay {
          position:fixed; inset:0; background:rgba(0,0,0,0.5);
          z-index:199; backdrop-filter:blur(2px);
        }
        .desktop-layout { display:flex; height:calc(100vh - 116px); }
        .desktop-grid-col {
          flex:0 0 61.8%; overflow-y:auto; padding:16px 14px;
          border-right:1px solid rgba(255,255,255,0.06);
        }
        .desktop-panel-col { flex:0 0 38.2%; overflow-y:auto; padding:20px; display:flex; flex-direction:column; }
        @media (min-width:480px) {
          .grid-wrap { grid-template-columns:repeat(10,1fr); gap:4px; }
          .cell-label { font-size:12px; }
        }
        @media (min-width:700px) {
          .wordmark { font-size:36px; letter-spacing:4px; }
          .subtext  { font-size:10px; letter-spacing:4px; }
          .grid-wrap { grid-template-columns:repeat(11,1fr); gap:5px; }
          .panel-number { font-size:80px; }
          .panel-wrap { padding:22px 20px; }
        }
        @media (min-width:960px) {
          .wordmark { font-size:40px; }
          .grid-wrap { grid-template-columns:repeat(11,1fr); gap:6px; }
          .panel-number { font-size:96px; }
        }
      `}</style>

      {/* HEADER */}
      <div style={{ borderBottom:"1px solid rgba(255,255,255,0.08)", padding:"12px 14px 10px", background:"rgba(0,0,0,0.5)", backdropFilter:"blur(10px)", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ textAlign:"center", marginBottom:10 }}>
          <h1 className="bebas wordmark" style={{ margin:0, lineHeight:1 }}>THE NUMBER WALL</h1>
          <div style={{ fontFamily:"'Caveat',cursive", fontSize:22, fontWeight:600, color:"#E87C2A", textShadow:"0 0 20px rgba(232,124,42,0.7), 0 0 40px rgba(232,124,42,0.3)", letterSpacing:1, lineHeight:1, marginTop:4 }}>Legends live here.</div>
        </div>

        <div ref={filterRef} className="sport-filter-wrap" style={{ justifyContent:"flex-start" }}>
          {SPORTS.map(s => {
            const active = sport === s;
            const tab = active ? SPORT_TAB.active : SPORT_TAB.inactive;
            return (
              <button key={s} className="sport-pill"
                style={{ background:tab.bg, borderColor:tab.border, color:tab.color, boxShadow:tab.glow, flexShrink:0 }}
                onClick={() => setSport(s)}>
                {s}
              </button>
            );
          })}
        </div>
        <div style={{ textAlign:"center", marginTop:8, fontFamily:"'Share Tech Mono',monospace", fontSize:10, letterSpacing:3, color:"rgba(255,255,255,0.2)" }}>
          PICK A NUMBER.
        </div>
      </div>

      {/* DESKTOP LAYOUT */}
      {isDesktop ? (
        <div className="desktop-layout">
          <div className="desktop-grid-col">
            <div className="grid-wrap">
              {Array.from({ length: 99 }, (_, i) => renderCell(i + 1))}
            </div>

          </div>
          <div className="desktop-panel-col">
            {selected === null ? (
              <div style={{ margin:"auto", textAlign:"center", padding:"40px 20px" }}>
                <div className="bebas" style={{ fontSize:48, color:"rgba(255,255,255,0.06)", letterSpacing:4, lineHeight:1, marginBottom:16 }}>
                  THE NUMBER<br/>WALL
                </div>
                <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:11, letterSpacing:3, color:"rgba(255,255,255,0.2)" }}>
                  PICK A NUMBER TO<br/>MEET ITS LEGENDS
                </div>
              </div>
            ) : (
              <div className="panel-in panel-wrap" style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${selectedColors.border}`, borderRadius:16, boxShadow:`0 0 40px ${selectedColors.border}22` }}>
                {renderPanelHeader()}
                {renderPanelContent()}
              </div>
            )}
          </div>
        </div>
      ) : (

        <div style={{ padding:"10px 12px", overflowX:"hidden", maxWidth:"100vw" }}>
          <div className="grid-wrap">
            {Array.from({ length: 99 }, (_, i) => renderCell(i + 1))}
          </div>

        </div>
      )}


      {/* LOCAL LEGENDS ACCESS POINT */}
      <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)", padding:"40px 16px 48px", textAlign:"center", background:"rgba(0,0,0,0.3)" }}>
        <div className="bebas" style={{ fontSize:28, letterSpacing:3, marginBottom:6 }}>YOUR CITY. YOUR NUMBERS.</div>
        <div style={{ fontFamily:"'Caveat',cursive", fontSize:18, color:"#E87C2A", textShadow:"0 0 16px rgba(232,124,42,0.5)", marginBottom:28 }}>Dig deep into the legends who built your city.</div>
        <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
          <a href="/boston" style={{ textDecoration:"none" }}>
            <div style={{ background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.4)", borderRadius:12, padding:"14px 24px", cursor:"pointer", transition:"all 0.2s", minWidth:140, boxShadow:"0 0 14px rgba(255,255,255,0.1)" }}
              onMouseEnter={e => { e.currentTarget.style.background="rgba(255,255,255,0.14)"; e.currentTarget.style.borderColor="rgba(255,255,255,0.7)"; }}
              onMouseLeave={e => { e.currentTarget.style.background="rgba(255,255,255,0.08)"; e.currentTarget.style.borderColor="rgba(255,255,255,0.4)"; }}>
              <div style={{ fontSize:22 }}>&#127998;</div>
              <div className="bebas" style={{ fontSize:18, letterSpacing:2, color:"#fff", marginTop:4 }}>BOSTON</div>
              <div className="mono" style={{ fontSize:9, letterSpacing:2, color:"rgba(255,255,255,0.6)", marginTop:2 }}>LIVE &#8594;</div>
            </div>
          </a>
          <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, padding:"14px 24px", minWidth:140, opacity:0.4 }}>
            <div style={{ fontSize:22 }}>&#127966;</div>
            <div className="bebas" style={{ fontSize:18, letterSpacing:2, color:"rgba(255,255,255,0.4)", marginTop:4 }}>NEW YORK</div>
            <div className="mono" style={{ fontSize:9, letterSpacing:2, color:"rgba(255,255,255,0.25)", marginTop:2 }}>COMING SOON</div>
          </div>
          <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, padding:"14px 24px", minWidth:140, opacity:0.4 }}>
            <div style={{ fontSize:22 }}>&#127787;</div>
            <div className="bebas" style={{ fontSize:18, letterSpacing:2, color:"rgba(255,255,255,0.4)", marginTop:4 }}>CHICAGO</div>
            <div className="mono" style={{ fontSize:9, letterSpacing:2, color:"rgba(255,255,255,0.25)", marginTop:2 }}>COMING SOON</div>
          </div>
          <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, padding:"14px 24px", minWidth:140, opacity:0.35 }}>
            <div style={{ fontSize:22 }}>+</div>
            <div className="bebas" style={{ fontSize:18, letterSpacing:2, color:"rgba(255,255,255,0.3)", marginTop:4 }}>MORE CITIES</div>
            <div className="mono" style={{ fontSize:9, letterSpacing:2, color:"rgba(255,255,255,0.2)", marginTop:2 }}>IN THE WORKS</div>
          </div>
        </div>
      </div>

      {/* MOBILE BOTTOM SHEET */}
      {!isDesktop && selected !== null && (
        <div>
          <div className="sheet-overlay" onClick={() => setSelected(null)} />
          <div className="bottom-sheet" ref={sheetRef}>
            <div className="sheet-handle" />
            {renderPanelHeader()}
            <div style={{ border:`1px solid ${selectedColors.border}22`, borderRadius:12, padding:"14px 12px", background:"rgba(255,255,255,0.02)" }}>
              {renderPanelContent()}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
