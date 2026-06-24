# The Number Wall — Claude Instructions

Rules for any Claude session working in this codebase.

---

## Before touching any UI code

1. Run `npm run ds:snapshot` to regenerate the design snapshot
2. Read `design-snapshot.md` (project root) before writing any component or style
3. If `design-snapshot.md` exists from a previous session, regenerate it — don't trust a stale snapshot

## During a build session

- **Tokens first** — use `var(--token-name)` for every color, spacing, type size, radius, and motion value. Never hardcode a value that exists as a token.
- **Reuse before creating** — check src/components/ before building anything new. Import and extend existing components with props rather than recreating them.
- **Primitive classes** — `.tnw-btn`, `.tnw-input`, `.tnw-tab`, `.tnw-eyebrow`, `.tnw-modal-title`, `.tnw-overlay`, `.tnw-backdrop`, `.page-back` are defined in global.css. Use them before writing component-local CSS.
- **Report reuse** — when reusing an existing component or token, say so explicitly. This makes drift visible.

## After any session that touched UI code

Run `npm run ds:lint` and fix all violations before closing the session. Review opportunities — flag any that need Dan's input.

## Design system reference

- Token source of truth: `src/styles/global.css`
- Live visual reference: `/behindthecurtains/design` (run `npm run dev` to view)
- Snapshot (machine-readable): `design-snapshot.md`
- Full design spec: `01_Brand/02-design-system.md`

## Data pipeline note

`wallData.json` is the live data source. `compile_wall_data.py` targets a dead file. Mirror CSV and JSON manually until the pipeline is fixed. See `project_data_pipeline_gap.md` in memory.

## Jersey verification rule

Any jersey number added to the wall must be verified via two independent sources. Cross-reference honors table for year and award claims. See `feedback_jersey_verification.md` in memory.

## Fun Fact copy rule

**1–2 sentences. ≤ 45 words. Never repeat the Signature Stat.**

The stat widget already shows the number. The Fun Fact must add something the stat can't say — a scene, a decision, a detail that earns its place. Write it like a text to a friend who loves sports, not a Wikipedia summary. If it reads like a résumé, cut it.
