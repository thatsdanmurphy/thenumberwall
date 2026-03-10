// ============================================================
// Footer
// Shared across both walls. Minimal — credit, links, copyright.
// ============================================================

import { FONTS, COLOR } from "../tokens.js";

export default function Footer({ wall = "main" }) {
  const year = new Date().getFullYear();

  return (
    <footer style={{
      borderTop:      "1px solid rgba(255,255,255,0.06)",
      padding:        "24px 16px",
      background:     "rgba(0,0,0,0.4)",
      textAlign:      "center",
    }}>
      <div style={{
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        gap:            "20px",
        flexWrap:       "wrap",
        marginBottom:   "12px",
      }}>
        {wall === "boston" && (
          <a href="/" style={linkStyle}>The Number Wall</a>
        )}
        {wall === "main" && (
          <a href="/boston" style={linkStyle}>The Boston Wall</a>
        )}
        <a href="/about" style={linkStyle}>About</a>
        <a href="mailto:dmurphy.dpm@gmail.com" style={linkStyle}>Contact</a>
      </div>

      <div style={{
        fontFamily:    FONTS.data,
        fontSize:      "10px",
        letterSpacing: "2px",
        color:         "rgba(255,255,255,0.18)",
      }}>
        © {year} THE NUMBER WALL · THENUMBERWALL.COM · ALL RIGHTS RESERVED
      </div>
    </footer>
  );
}

const linkStyle = {
  fontFamily:     "'Space Mono', 'Courier New', monospace",
  fontSize:       "10px",
  letterSpacing:  "2px",
  color:          "rgba(255,255,255,0.3)",
  textDecoration: "none",
  transition:     "color 0.2s",
  textTransform:  "uppercase",
};
