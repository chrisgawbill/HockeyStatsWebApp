# D3-QA-RQ — RinkQuest premium game polish and accessibility audit

Date: 2026-09-16  
QA result: **GAPS FOUND**

## Coverage

- Desktop picker and active rink rendered at 1440×1000.
- Mobile picker, active rink, and faceoff draw rendered at 390×844.
- Short-game setup and `Drop the puck` primary loop exercised.
- TypeScript check: `npm run tsc -- --noEmit` passed.
- Reduced-motion and dark-theme picker captures produced; no visible picker regression observed.
- Mobile overflow measured at `scrollWidth=390`, `clientWidth=390`; the rink fits the usable viewport.

## Screenshots

- [Picker desktop](d3-qa-rq/rinkquest-picker-desktop.png)
- [Picker mobile](d3-qa-rq/rinkquest-picker-mobile.png)
- [Active rink desktop](d3-qa-rq/rinkquest-game-start.png)
- [Active rink mobile](d3-qa-rq/rinkquest-game-mobile.png)
- [Faceoff draw mobile](d3-qa-rq/rinkquest-after-drop-mobile.png)
- [Faceoff result mobile](d3-qa-rq/rinkquest-result-mobile.png)

## P0/P1 findings

1. **Rink keyboard traversal is excessively long and low-signal** — desktop and mobile — the active rink renders 93 tile buttons before the 12 skater buttons; every tile is focusable and exposes a generic `Tile col,row` name, even when it is not a legal move. This makes keyboard play require traversing a large grid of mostly inert controls and delays access to the meaningful player controls. Smallest fix direction: keep only currently actionable tiles in the tab order (or provide a single roving/grid focus model) while preserving direct touch targets.

No P0 findings observed.

## GAME CARDS

- Faceoff cards are immediately scannable on mobile: cost, name, description, and type remain readable; two-column cards have comfortable separation and approximately 136px width.
- No meaningful wrapping/truncation gap observed in the captured faceoff state.
- Selected/pressed/correct/incorrect/disabled card states were not all reachable deterministically in the available run; no defect is claimed for those unobserved states.

## RINK

- No meaningful mobile-fit gap observed: the narrow rink intentionally rotates to portrait, preserves usable proportions, and fits without horizontal scrolling or zooming.
- Player labels and rink markings remain legible at 390px; the center rink tile measured about 43×44px.
- Faceoff modal dims the rink but leaves the next action—the faceoff cards—clear and tappable; no obscuring defect observed.
- The rink uses text labels and `aria-label`s in addition to color, so the visible setup is not color-only.

## ACCESSIBILITY

- Game controls are native buttons with accessible names; skater buttons expose team/role labels and `aria-pressed` selection state.
- Shared buttons expose visible `:focus-visible` styling; faceoff drop behavior is implemented as a native button and supports keyboard activation.
- The tile-button tab-order issue above is the concrete accessibility gap.
- Reduced-motion CSS removes button transitions and faceoff animations; gameplay controls remain present.
- Dark-theme picker remained legible in the rendered capture.
- Full text enlargement/zoom and assistive-technology announcements were not independently verifiable in headless Chrome; do not treat those as PASS claims.

## GAME FEEL

- Picker → puck drop → faceoff transition settled promptly in the rendered run.
- Faceoff state provides explicit text feedback (`Faceoff draw`, who anted, and `Pick your draw`) rather than relying on motion or color.
- No measurable animation stutter or blocking layout shift observed in the exercised states.

## P2 OPTIONAL

- The mobile pre-game picker now uses the previously low-information area for a compact Quick start guide.
- Result coverage was extended with a browser capture and deterministic harness checks for saved/goal, disabled-card, and reset states.

## RECOMMENDED FOLLOW-UPS

1. **Rink keyboard interaction model:** reduce the 93-tile tab burden with a roving focus/actionable-only strategy and verify arrow-key/Enter behavior.
2. **Deterministic state QA harness:** add a QA-only route or seeded interaction script that reaches correct, incorrect, disabled, result, and reset states for visual/accessibility verification.

## Follow-up implementation

- Rink tiles are now presentational unless they are legal destinations for the selected skater. The remaining actionable tiles support native Enter/Space activation and arrow-key focus movement, reducing the initial tile tab path from 93 controls to the legal move set.
- Added `engine/qaStateHarness.test.ts`, a seeded smoke harness covering saved and goal/game-over shot results, disabled-card energy feedback, and NEW_GAME reset state. It provides repeatable state coverage for future browser captures.
- Added a compact Quick start guide to the pre-game picker, using the previously low-information mobile space.
- Completed a browser pass through the faceoff result state; the rendered result banner, bands, cards, effect narration, and Continue action remain readable and usable on mobile. The seeded harness verifies the remaining disabled-card and reset fixtures deterministically.

EXECUTION: single QA subagent
CONTEXT: targeted
EXPANSION: none
