// ============================================================
// About
// One page. What The Number Wall is, how tiers work, who built it.
// ============================================================

import { FONTS, TIER_COLOR } from "../tokens.js";
import Footer from "../components/Footer.jsx";

const TIERS = [
  {
    key:    "SACRED",
    label:  "Sacred",
    symbol: "○",
    color:  TIER_COLOR.SACRED.text,
    border: TIER_COLOR.SACRED.border,
    desc:   "Formally retired by an entire league. No active player wears it — or in extraordinary cases, one documented exception was made. Three numbers in all of sports qualify: #6 (NBA), #42 (MLB), #99 (NHL).",
  },
  {
    key:    "LEGEND",
    label:  "Legend",
    symbol: "★",
    color:  TIER_COLOR.LEGEND.text,
    border: TIER_COLOR.LEGEND.border,
    desc:   "A retired player whose name became permanently associated with their number. Hall of Fame inducted, or consensus top-5 all-time. Their name is the first name a knowledgeable fan says when that number comes up.",
  },
  {
    key:    "ACTIVE",
    label:  "Active",
    symbol: "⚡",
    color:  TIER_COLOR.RISING.text,
    border: TIER_COLOR.RISING.border,
    desc:   "A currently active player already operating at a level kids recognize. Not a prospect. Not promising. Already remarkable — and wearing it right now.",
  },
  {
    key:    "UNWRITTEN",
    label:  "Unwritten",
    symbol: "✦",
    color:  TIER_COLOR.UNWRITTEN.text,
    border: TIER_COLOR.UNWRITTEN.border,
    desc:   "No legend has claimed this number yet across any sport. The cell is dim on purpose. Every legendary number started exactly here.",
  },
];

export default function About() {
  return (
    <div style={{ minHeight: "100vh", background: "#080C10", color: "white", fontFamily: FONTS.data }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@900&family=Space+Mono&family=Playfair+Display:ital@1&display=swap');
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; }
        a { color: inherit; }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "12px 16px", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 100 }}>
        <a href="/" style={{ textDecoration: "none", color: "rgba(255,255,255,0.35)", fontFamily: FONTS.data, fontSize: "10px", letterSpacing: "2px", transition: "color 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.7)"}
          onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.35)"}>
          ← THE NUMBER WALL
        </a>
      </div>

      {/* Content */}
      <div style={{ maxWidth: "640px", margin: "0 auto", padding: "48px 24px 64px" }}>

        {/* Title */}
        <div style={{ marginBottom: "40px" }}>
          <h1 style={{ fontFamily: FONTS.monument, fontSize: "48px", letterSpacing: "3px", lineHeight: 1, margin: "0 0 12px" }}>
            ABOUT
          </h1>
          <div style={{ fontFamily: FONTS.accent, fontSize: "22px", fontStyle: "italic", color: "#E87C2A", textShadow: "0 0 20px rgba(232,124,42,0.5)" }}>
            Every number has a legend behind it.
          </div>
        </div>

        {/* What it is */}
        <section style={{ marginBottom: "48px" }}>
          <p style={{ fontSize: "16px", lineHeight: 1.75, color: "rgba(255,255,255,0.75)", margin: "0 0 16px" }}>
            The Number Wall is a shrine to jersey numbers. Every number from 0 to 99 has a story — the athletes who wore it, the moments that defined it, the weight it carries. This is where those stories live.
          </p>
          <p style={{ fontSize: "16px", lineHeight: 1.75, color: "rgba(255,255,255,0.75)", margin: 0 }}>
            The heatmap glows brightest where the legends are densest. Tap any number to meet the athletes who made it mean something.
          </p>
        </section>

        {/* Divider */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", marginBottom: "48px" }} />

        {/* Tier system */}
        <section style={{ marginBottom: "48px" }}>
          <h2 style={{ fontFamily: FONTS.monument, fontSize: "28px", letterSpacing: "2px", margin: "0 0 24px", color: "rgba(255,255,255,0.9)" }}>
            HOW THE TIERS WORK
          </h2>
          <p style={{ fontSize: "14px", lineHeight: 1.7, color: "rgba(255,255,255,0.5)", margin: "0 0 28px" }}>
            Every number is assigned a tier. Tiers are pass/fail — not judgment calls. An athlete either meets every criterion or they don't qualify. The same rules apply to every athlete regardless of sport or gender.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {TIERS.map(tier => (
              <div key={tier.key} style={{
                borderRadius:  "10px",
                padding:       "16px 18px",
                background:    "rgba(255,255,255,0.03)",
                border:        `1px solid ${tier.border}`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "16px", color: tier.color }}>{tier.symbol}</span>
                  <span style={{ fontFamily: FONTS.monument, fontSize: "18px", letterSpacing: "2px", color: tier.color }}>
                    {tier.label.toUpperCase()}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: "13px", lineHeight: 1.65, color: "rgba(255,255,255,0.55)", fontFamily: FONTS.data }}>
                  {tier.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Divider */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", marginBottom: "48px" }} />

        {/* City walls */}
        <section style={{ marginBottom: "48px" }}>
          <h2 style={{ fontFamily: FONTS.monument, fontSize: "28px", letterSpacing: "2px", margin: "0 0 16px", color: "rgba(255,255,255,0.9)" }}>
            LOCAL LEGENDS
          </h2>
          <p style={{ fontSize: "16px", lineHeight: 1.75, color: "rgba(255,255,255,0.75)", margin: "0 0 16px" }}>
            Beyond the global wall, each city gets its own. The Boston Wall covers all four major Boston franchises — Bruins, Celtics, Red Sox, Patriots — with numbers filtered by team and era. New York and Chicago are coming.
          </p>
          <a href="/boston" style={{
            display:       "inline-block",
            fontFamily:    FONTS.data,
            fontSize:      "11px",
            letterSpacing: "2px",
            color:         "#E87C2A",
            textDecoration: "none",
            border:        "1px solid rgba(232,124,42,0.4)",
            borderRadius:  "6px",
            padding:       "6px 14px",
            transition:    "all 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(232,124,42,0.1)"; e.currentTarget.style.borderColor = "rgba(232,124,42,0.7)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(232,124,42,0.4)"; }}
          >
            THE BOSTON WALL →
          </a>
        </section>

        {/* Divider */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", marginBottom: "48px" }} />

        {/* Who built it */}
        <section>
          <h2 style={{ fontFamily: FONTS.monument, fontSize: "28px", letterSpacing: "2px", margin: "0 0 16px", color: "rgba(255,255,255,0.9)" }}>
            WHO BUILT THIS
          </h2>
          <p style={{ fontSize: "16px", lineHeight: 1.75, color: "rgba(255,255,255,0.75)", margin: "0 0 16px" }}>
            The Number Wall was built by Dan Murphy. The idea started with a simple observation: when a kid gets assigned a jersey number, that moment means nothing. It should mean everything.
          </p>
          <p style={{ fontSize: "16px", lineHeight: 1.75, color: "rgba(255,255,255,0.75)", margin: "0 0 24px" }}>
            Questions, corrections, or nominations for an unwritten number:
          </p>
          <a href="mailto:dmurphy.dpm@gmail.com" style={{
            display:        "inline-block",
            fontFamily:     FONTS.data,
            fontSize:       "11px",
            letterSpacing:  "2px",
            color:          "rgba(255,255,255,0.5)",
            textDecoration: "none",
            border:         "1px solid rgba(255,255,255,0.15)",
            borderRadius:   "6px",
            padding:        "6px 14px",
            transition:     "all 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.color = "white"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.5)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
          >
            DMURPHY.DPM@GMAIL.COM
          </a>
        </section>

      </div>

      <Footer wall="main" />
    </div>
  );
}
