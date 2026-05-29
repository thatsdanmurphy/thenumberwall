# TNW Design System Snapshot
Generated: 2026-05-28 11:37 UTC — run `npm run ds:snapshot` to refresh

> Read this before writing any component or style. If this file is
> from a previous session, regenerate before building.

---

## Token Inventory

### Color
`--color-night`: #080C10
`--color-surface`: #0D1117
`--color-paper`: #F5F7FA
`--color-muted`: #B8C4CF
`--color-heat`: #E87C2A
`--color-blaze`: #F5C135
`--color-sacred`: #C8DCFF
`--color-border`: rgba(255, 255, 255, 0.08)
`--color-error`: #ff6b6b
`--color-overlay`: #12161C
`--color-timeline-low`: #FF4D5E
`--color-timeline-peak`: #FFF0B0
`--color-timeline-pos`: #9ED44C
`--color-personal`: rgba(100, 160, 255, 0.90)
`--color-personal-border`: rgba(60,  130, 255, 0.80)
`--color-personal-glow`: rgba(50,  100, 240, 0.38)
`--color-personal-glow-inner`: rgba(100, 160, 255, 0.85)
`--color-personal-glow-mid`: rgba(60,  130, 255, 0.50)
`--color-personal-glow-outer`: rgba(40,  90,  220, 0.25)
`--color-personal-bg`: rgba(50,  100, 240, 0.08)
`--color-personal-tile-bg`: rgba(28,  65,  200, 0.42)
`--color-personal-dim`: rgba(60,  130, 255, 0.22)
`--color-personal-mid`: rgba(60,  130, 255, 0.45)
`--color-team-sox`: #E8182E
`--color-team-bruins`: #FFB81C
`--color-team-celtics`: #00C267
`--color-team-patriots`: #1A72FF

### Typography
`--font-banner`: 'Archivo Black', sans-serif
`--font-program`: 'Inter', sans-serif
`--font-scoreboard`: 'IBM Plex Mono', monospace
`--font-handwritten`: 'Rock Salt', cursive

### Spacing
`--space-1`: 4px
`--space-2`: 8px
`--space-3`: 16px
`--space-4`: 24px
`--space-5`: 32px
`--space-6`: 48px
`--space-7`: 64px

### Grid
`--grid-max-width`: 1280px
`--grid-margin`: 24px

### Panel
`--panel-ratio-grid`: 61.8%
`--panel-ratio-panel`: 38.2%
`--panel-max-width`: 480px

### Motion
`--motion-hover`: 180ms ease-out
`--motion-heat`: 300ms ease-in-out
`--motion-color`: 200ms ease-out

### Text
`--text-h1`: 1.375rem
`--text-h2`: 1.125rem
`--text-body`: 0.9rem
`--text-small`: 0.75rem
`--text-label`: 0.6875rem
`--text-micro`: 0.625rem
`--text-body-sm`: 0.8125rem
`--text-base`: 1rem
`--text-h3`: 1.25rem
`--text-display-xs`: 1.5rem
`--text-display-sm`: 1.75rem
`--text-display-md`: 2rem
`--text-display-lg`: 2.5rem
`--text-display-xl`: 3rem
`--text-display-hero`: 4.5rem

### Tracking
`--tracking-wide`: 0.10em
`--tracking-wider`: 0.14em
`--tracking-widest`: 0.18em

### Surface
`--surface-1`: rgba(255, 255, 255, 0.03)
`--surface-2`: rgba(255, 255, 255, 0.05)
`--surface-raised`: rgba(255, 255, 255, 0.07)
`--surface-3`: rgba(255, 255, 255, 0.08)
`--surface-4`: rgba(255, 255, 255, 0.12)
`--border-faint`: rgba(255, 255, 255, 0.06)
`--border-soft`: rgba(255, 255, 255, 0.10)
`--border-medium`: rgba(255, 255, 255, 0.16)
`--border-strong`: rgba(255, 255, 255, 0.30)

### Ink
`--ink-dim`: rgba(255, 255, 255, 0.50)
`--ink-low`: rgba(255, 255, 255, 0.60)
`--ink-mid`: rgba(255, 255, 255, 0.70)
`--ink-high`: rgba(255, 255, 255, 0.85)

### Radius
`--radius-sm`: 4px
`--radius-md`: 6px
`--radius-lg`: 10px
`--radius-xl`: 14px

---

## Global Primitive Classes

These exist in global.css. Reach for them before writing component-local CSS.

.page-back
.tnw-backdrop
.tnw-btn  .tnw-btn--ghost  .tnw-btn--primary  .tnw-btn--secondary
.tnw-eyebrow
.tnw-input
.tnw-modal-title
.tnw-overlay
.tnw-tab  .tnw-tab--active

---

## Components (35)

Import from src/components/ — don't recreate what already exists.

- **AddEntry** — `src/components/AddEntry.jsx`
- **AppFooter** — `src/components/AppFooter.jsx`
- **AppHeader** — `src/components/AppHeader.jsx`
- **AppLoading** — `src/components/AppLoading.jsx`
- **AppShell** — `src/components/AppShell.jsx`
- **ChaserCard** — `src/components/ChaserCard.jsx`
- **CreateTeamWall** — `src/components/CreateTeamWall.jsx`
- **DebateCard** — `src/components/DebateCard.jsx`
- **EmailCapture** — `src/components/EmailCapture.jsx`
- **ErrorBoundary** — `src/components/ErrorBoundary.jsx`
- **FieldView** — `src/components/FieldView.jsx`
- **FirstVisitModal** — `src/components/FirstVisitModal.jsx`
- **GlobalInterestMap** — `src/components/GlobalInterestMap.jsx`
- **HeroSearch** — `src/components/HeroSearch.jsx`
- **IdentityTiles** — `src/components/IdentityTiles.jsx`
- **LegendTimeline** — `src/components/LegendTimeline.jsx`
- **LiveGameCard** — `src/components/LiveGameCard.jsx`
- **Modal** — `src/components/Modal.jsx`
- **MyWallsHub** — `src/components/MyWallsHub.jsx`
- **NewWallModal** — `src/components/NewWallModal.jsx`
- **NotificationBell** — `src/components/NotificationBell.jsx`
- **PipelinePath** — `src/components/PipelinePath.jsx`
- **PlayerPanel** — `src/components/PlayerPanel.jsx`
- **PlayerSearch** — `src/components/PlayerSearch.jsx`
- **PositionPicker** — `src/components/PositionPicker.jsx`
- **ScrollToTop** — `src/components/ScrollToTop.jsx`
- **ShowdownScrubber** — `src/components/ShowdownScrubber.jsx`
- **SportsFilter** — `src/components/SportsFilter.jsx`
- **StartWallDialog** — `src/components/StartWallDialog.jsx`
- **SubmitLegend** — `src/components/SubmitLegend.jsx`
- **VoteButtons** — `src/components/VoteButtons.jsx`
- **WallGrid** — `src/components/WallGrid.jsx`
- **WallTile** — `src/components/WallTile.jsx`
- **WallsMap** — `src/components/WallsMap.jsx`
- **WhatsNext** — `src/components/WhatsNext.jsx`

---

## Pages (23)

- **AboutPage** — `src/pages/AboutPage.jsx`
- **BostonPage** — `src/pages/BostonPage.jsx`
- **DesignSystem** — `src/pages/DesignSystem.jsx`
- **LivePage** — `src/pages/LivePage.jsx`
- **MyWallPage** — `src/pages/MyWallPage.jsx`
- **MyWallsPage** — `src/pages/MyWallsPage.jsx`
- **NewYorkPage** — `src/pages/NewYorkPage.jsx`
- **NotFoundPage** — `src/pages/NotFoundPage.jsx`
- **ReelWallPage** — `src/pages/ReelWallPage.jsx`
- **ShowdownPage** — `src/pages/ShowdownPage.jsx`
- **TeamWallPage** — `src/pages/TeamWallPage.jsx`
- **TeamWallsPage** — `src/pages/TeamWallsPage.jsx`
- **TimelinePage** — `src/pages/TimelinePage.jsx`
- **TownWallsPage** — `src/pages/TownWallsPage.jsx`
- **WallPage** — `src/pages/WallPage.jsx`
- **BehindTheCurtainsLayout** — `src/pages/behindthecurtains/BehindTheCurtainsLayout.jsx`
- **Engineering** — `src/pages/behindthecurtains/Engineering.jsx`
- **Flows** — `src/pages/behindthecurtains/Flows.jsx`
- **Foundation** — `src/pages/behindthecurtains/Foundation.jsx`
- **Home** — `src/pages/behindthecurtains/Home.jsx`
- **HowWorkHappens** — `src/pages/behindthecurtains/HowWorkHappens.jsx`
- **Sitemap** — `src/pages/behindthecurtains/Sitemap.jsx`
- **Stub** — `src/pages/behindthecurtains/Stub.jsx`

---

## Rules for Claude

1. Use `var(--token-name)` — never hardcode values that exist as tokens
2. Import and reuse components from src/components/ before creating new ones
3. Use primitive classes (.tnw-btn, .tnw-input, .tnw-tab, etc.) before writing new CSS
4. If you need a value not in the token inventory, flag it — don't silently invent it
5. Run `npm run ds:lint` at end of any session that touched UI code
