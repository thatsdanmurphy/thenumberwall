// ============================================================
// FilterPill
// Reusable tab / filter button. Extracted from the inline
// team-pill and sport-pill button patterns in both walls.
// Active state is always white — no per-team colors on pills.
// ============================================================

/**
 * FilterPill
 *
 * @prop {string}   label     — Display text
 * @prop {boolean}  isActive  — Active/selected state
 * @prop {function} onClick   — () => void
 * @prop {string}   [variant] — "pill" (default, Space Mono) | "tab" (Barlow Condensed, larger)
 */
export default function FilterPill({ label, isActive, onClick, variant = "pill" }) {
  const isTab = variant === "tab";

  const active = {
    background:  "rgba(255,255,255,0.92)",
    borderColor: "rgba(255,255,255,0.9)",
    color:       "#0a0d14",
    boxShadow:   "0 0 12px rgba(255,255,255,0.35)",
  };
  const inactive = {
    background:  "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.12)",
    color:       "rgba(255,255,255,0.45)",
    boxShadow:   "none",
  };

  const state = isActive ? active : inactive;

  return (
    <button
      onClick={onClick}
      style={{
        borderRadius:  "20px",
        padding:       isTab ? "5px 14px" : "5px 12px",
        fontSize:      isTab ? "13px" : "11px",
        fontFamily:    isTab
          ? "'Barlow Condensed', Impact, sans-serif"
          : "'Space Mono', 'Courier New', monospace",
        fontWeight:    isTab ? 900 : 400,
        letterSpacing: isTab ? "2px" : "1px",
        cursor:        "pointer",
        border:        `1px solid ${state.borderColor}`,
        background:    state.background,
        color:         state.color,
        boxShadow:     state.boxShadow,
        transition:    "all 0.2s ease",
        whiteSpace:    "nowrap",
        flexShrink:    0,
      }}
    >
      {label}
    </button>
  );
}
