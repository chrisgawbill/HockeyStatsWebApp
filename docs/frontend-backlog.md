# Frontend Backlog

MD3 (Material Design 3) alignment work identified during a frontend design review on 2026-07-01. The app already has good bones — a token system in `react/src/index.css` with light/dark themes, shared surface classes, an MD3-correct `SeasonSelector`, and a responsive nav that maps to MD3's navigation bar — but most of it is "MD3-flavored" rather than MD3: the color roles, type scale, and state/elevation mechanics that make Material cohesive are approximated instead of adopted.

**Decision record — no component library.** We evaluated `@material/web` (Google's official MD3 web components) and decided against it: it has been in maintenance mode pending new maintainers since mid-2024 (no roadmap, no MD3 Expressive updates), the components this app would most benefit from (card, navigation bar, data table) never left labs or were never built, and React 18 needs `@lit/react` wrappers for custom elements. MUI was also ruled out (still MD2; the team declined to implement MD3). The chosen path is MD3's **token layer** plus our own CSS. Do not relitigate this in individual tickets.

Ordering: F1 is pure hygiene and makes every later diff cleaner. F2 is the foundation (color roles) that F3 and F4 depend on. F5–F7 are independent of each other and can land in any order after F2. Each ticket's **implementation prompt** is self-contained and meant to be pasted verbatim into a fresh Claude Code session (Sonnet/Opus acting as the senior dev, pairing with a junior dev who writes the code).

## F1 CSS housekeeping: dedupe shared classes, relocate global styles

- [ ] **Owner:** Either

Leftovers from a half-finished rename and a misplaced global style:

- `react/src/Style/components.css` defines every class twice: `.md3-surface` and `.surface`, `.md3-surface--clip` and `.surfaceClip`, `.md3-surface--scroll` and `.surfaceScroll`, `.md3-surface--interactive` and `.surfaceInteractive`, `.md3-chip` and `.chip` — identical bodies, two naming schemes.
- `react/src/Style/shared.module.css` duplicates the same `.surface`/`.surfaceClip`/`.surfaceScroll`/`.surfaceInteractive`/`.chip`/`.section`/`.sectionTitle` blocks a third time (as a CSS module), and `components.css` has `.content-section`/`.content-section__title` mirroring `.section`/`.sectionTitle`.
- `react/src/Style/PageHeader.module.css:111` sets `body { padding-bottom: 60px }` from inside a module's mobile media query. It works (element selectors escape CSS-module scoping) but the rule belongs with the other global body styles in `index.css`.

**Implementation prompt:**

```text
ROLE: You are the senior dev pairing with me (junior dev, learning). Explain why the duplication happened (global stylesheet vs CSS module conventions) before we touch anything, then guide me step by step. Pause after each numbered step. Do not expand scope beyond this ticket.

PROJECT: HockeyStatsWebApp — React app in react/. This ticket is CSS deduplication only; zero visual change is the goal.

READ FIRST: docs/frontend-backlog.md section F1, react/src/Style/components.css, react/src/Style/shared.module.css, react/src/Style/PageHeader.module.css, react/src/index.css.

STEPS (pause after each):
1. Grep the codebase for every class defined in components.css (md3-surface, surface, md3-chip, chip, content-section, table-shell, loading-state, error-state, and variants) and for imports of shared.module.css. Build a table of which components use which naming scheme, and confirm whether components.css is even imported anywhere. Show me the table before changing anything.
2. Pick the survivor: keep shared.module.css (CSS-module scoping is what the rest of the app uses) and delete the duplicated blocks from components.css. If step 1 showed components using the global classes, migrate them to the module imports first, one component per commit-sized change.
3. If components.css ends up empty (or holds only rules nothing references), delete the file and its import.
4. Move the body { padding-bottom: 60px } rule from PageHeader.module.css's max-width: 576px media query into a matching media query in index.css, with a comment tying it to the fixed bottom nav height.

DONE WHEN:
- cd react && pnpm build passes.
- Every page (/, /standings, /schedule, /teamList, a team page, a game page) renders identically to before in BOTH light and dark themes — spot-check hover states on cards.
- grep finds no remaining md3-* class names and no duplicate .surface definitions.
- This box is ticked.
```

## F2 Adopt MD3 color roles (Material Theme Builder tokens)

- [ ] **Owner:** Either | **Depends on:** F1

The biggest gap from the review. MD3 is built on paired color roles — `primary`/`on-primary`, `surface-container-low/high/highest`, `outline`, `outline-variant` — while `index.css` has a generic palette (`--color-primary`, `--color-text`, `--color-muted-text`). Consequences today:

- No `on-primary` role, so `PageHeader.module.css` hardcodes `white` / `rgba(255,255,255,…)` for text on the primary nav.
- Surfaces are approximated with `color-mix(in srgb, var(--color-primary) 4%, var(--color-surface))` everywhere instead of discrete `surface-container` roles (MD3 itself moved from tint overlays to discrete roles).
- Dark theme values were hand-picked rather than generated from the same tonal palettes, so contrast is inconsistent.

Fix: generate a proper MD3 scheme from the existing brand seed `#1b4f8a` with the Material Theme Builder (https://material-foundation.github.io/material-theme-builder/), paste the emitted light/dark CSS custom properties into `index.css`, and map the existing token names onto the new roles.

**Implementation prompt:**

```text
ROLE: You are the senior dev pairing with me (junior dev, learning). Start by explaining MD3 color roles (what on-* pairs and surface-container levels are for) in a few paragraphs. Pause after each numbered step. Do not expand scope beyond this ticket.

PROJECT: HockeyStatsWebApp — React app in react/. Goal: replace the ad-hoc palette in react/src/index.css with generated MD3 color roles, keeping #1b4f8a as the seed so the app still reads as "our blue".

READ FIRST: docs/frontend-backlog.md section F2, react/src/index.css, react/src/Style/shared.module.css, react/src/Style/PageHeader.module.css, react/src/Services/themeHandler.ts, react/src/Data/Context/ThemeContext (theme switching mechanism).

STEPS (pause after each):
1. I will generate the theme: walk me through using https://material-foundation.github.io/material-theme-builder/ with seed #1b4f8a and exporting Web (CSS) output. I'll paste the generated light and dark --md-sys-color-* custom properties into the session.
2. Add the generated roles to index.css under :root (light) and [data-theme="dark"], keeping our existing theme-switch mechanism (data-theme attribute) — do NOT switch to prefers-color-scheme.
3. Create a mapping layer so existing CSS keeps working during migration: redefine the old tokens in terms of the new roles (e.g. --color-primary: var(--md-sys-color-primary); --color-surface: var(--md-sys-color-surface); --color-text: var(--md-sys-color-on-surface); --color-divider: var(--md-sys-color-outline-variant); --color-bg: var(--md-sys-color-surface-container-lowest or surface); etc.). Add new first-class tokens for roles we lacked: on-primary, primary-container/on-primary-container, surface-container(-low/-high), outline.
4. Replace the color-mix surface approximations in shared.module.css: .surface uses var(--md-sys-color-surface-container-low) with border-color var(--md-sys-color-outline-variant); the hover tint becomes surface-container (one level up). Keep the class names.
5. Update PageHeader.module.css to use on-primary (and opacity) instead of hardcoded white/rgba-white literals for nav text, back button, and theme toggle.
6. Map the semantic colors: --color-success/--color-danger onto the generated error role and a documented custom green (MD3 schemes have error but not success; add a static success pair and note it).

INVARIANTS:
- Light theme must still read as "white app with deep blue nav"; dark theme as the current navy/slate feel. If a generated role makes a page look drastically different, flag it and we tune per-component rather than editing generated values.
- No page module CSS changes in this ticket beyond PageHeader (the hex purge is ticket F3).

DONE WHEN:
- cd react && pnpm build passes.
- Every page checked in both themes: nav, cards, tables, chips, modals all legible with sensible contrast.
- index.css contains the generated roles + mapping layer, with a comment recording the seed color and builder URL.
- This box is ticked.
```

## F3 Purge hardcoded hex colors from page modules

- [ ] **Owner:** Either | **Depends on:** F2

Raw hex values leak past the token system in the page-level CSS modules. They break re-theming (the primary blue is duplicated) and dark mode (fixed dark text on themed surfaces). Found in the review:

- `react/src/Style/TeamPage/TeamPage.module.css` — `#1b4f8a` (the primary!) at lines 20 and 459; win/loss greens/reds `#2e7d32`/`#c62828` at 306/310/354/359 instead of `--color-success`/`--color-danger`; `#bbf7d0`/`#fecaca` at 131/136; `#bf360c` at 373; `#ff8a65` at 620.
- `react/src/Style/GameDetailPage.module.css:680` — text color `#0f172a`, near-invisible if it ever sits on a dark surface.
- Audit the remaining modules (`StandingsPage`, `ScheduleCalendar`, `SchedulePage`, `LandingPage/*`, `Modals/*`, `DiagnosticsPage`, `TeamList`) for more — the review only sampled three files. Line numbers above are as of 2026-07-01; re-grep rather than trusting them.

**Implementation prompt:**

```text
ROLE: You are the senior dev pairing with me (junior dev, learning). Explain the dark-mode failure mode of each hardcoded color before we replace it. Pause after each numbered step. Do not expand scope beyond this ticket.

PROJECT: HockeyStatsWebApp — React app in react/. Prerequisite ticket F2 (MD3 color roles) is done; the token vocabulary now includes primary/on-primary, containers, outline, success/danger.

READ FIRST: docs/frontend-backlog.md section F3, react/src/index.css (current tokens), then grep: cd react/src/Style && grep -rn "#[0-9a-fA-F]\{3,8\}\b" . — every hit is in scope except values inside index.css itself.

STEPS (pause after each):
1. Run the grep and categorize every hit with me: (a) duplicate of an existing token (e.g. #1b4f8a = primary), (b) semantic win/loss/warning color that should map to success/danger/tertiary tokens, (c) genuinely one-off decorative color that needs a new named token, (d) team-brand colors from Data/Helpers/teamColor.ts territory that are intentionally dynamic — leave those alone.
2. Replace category (a) and (b) hits file by file, checking each page in both themes as we go. TeamPage first (most hits), then GameDetailPage, then the rest.
3. For category (c), add named tokens to index.css with light AND dark values — no raw hex may remain in page modules.
4. Re-run the grep to confirm zero hits outside index.css (and any intentionally-dynamic team-color inline styles in TSX, which are out of scope).

DONE WHEN:
- cd react && pnpm build passes.
- grep -rn "#[0-9a-fA-F]" react/src/Style --include="*.module.css" returns nothing.
- TeamPage and GameDetailPage checked in both themes, including win/loss coloring and the hero/scoreboard areas.
- This box is ticked.
```

## F4 Unified MD3 state layers and elevation; remove scale/translate hovers

- [ ] **Owner:** Either | **Depends on:** F2

MD3 expresses interaction through state layers (hover 8%, focus 12%, pressed 12% of the content color) and elevation changes — never zoom. Today only `SeasonSelector.module.css` does this correctly (its `::before` overlay is the reference implementation). Everything else improvises:

- `react/src/Style/LandingPage/StatLeaderCard.module.css:91` — `transform: scale(1.05)` on hover (reads as a marketing-site effect, not Material).
- `react/src/Style/shared.module.css` `.surfaceInteractive:hover` — background tint + shadow + `translateY(-2px)` all at once, mixing MD3's outlined-card and elevated-card idioms.
- Nav buttons in `PageHeader.module.css` use rgba-white overlays with `!important`.
- Only one shadow token exists (`--shadow-card`); MD3 defines five elevation levels.

**Implementation prompt:**

```text
ROLE: You are the senior dev pairing with me (junior dev, learning). Start by explaining MD3 state layers and elevation levels, and why MD3 never scales elements on hover. Pause after each numbered step. Do not expand scope beyond this ticket.

PROJECT: HockeyStatsWebApp — React app in react/. Prerequisite ticket F2 is done (color roles exist).

READ FIRST: docs/frontend-backlog.md section F4, react/src/Style/SeasonSelector.module.css (the reference state-layer implementation), react/src/Style/shared.module.css, react/src/Style/LandingPage/StatLeaderCard.module.css, react/src/Style/PageHeader.module.css.

STEPS (pause after each):
1. Add elevation tokens to index.css: --elevation-1 through --elevation-3 (MD3 levels; level 4-5 are unused here) with dark-theme variants, replacing the single --shadow-card. Keep --shadow-card as an alias during migration.
2. Generalize SeasonSelector's ::before state-layer pattern into shared.module.css as .stateLayer (position:relative host, ::before overlay using currentColor or a --state-layer-color custom property, opacity 0 → 0.08 hover → 0.12 focus-visible/active). Explain the position/border-radius: inherit gotchas to me.
3. Decide per interactive surface whether it is an OUTLINED card (keeps border, gains state layer, no shadow change) or an ELEVATED card (no border, elevation-1 resting, elevation-2 hover): .surfaceInteractive becomes outlined (it has a border today) — remove translateY and the shadow from its hover, add the state layer.
4. StatLeaderCard: delete the scale(1.05) hover; apply the same outlined-card treatment. Keep cursor:pointer.
5. Nav buttons in PageHeader: replace the rgba-white hover backgrounds with the state layer over on-primary. Do not attempt to remove the !important Bootstrap overrides here — that is ticket F5.
6. Sweep the remaining page modules for other hover transforms (grep "transform" and ":hover" in react/src/Style) and apply the same rules.

DONE WHEN:
- cd react && pnpm build passes.
- No transform: scale or translateY remains on any hover state (grep confirms).
- Cards on the landing page, schedule, and team pages show a consistent subtle hover in both themes; keyboard focus (Tab) shows visible focus states on interactive cards and nav.
- This box is ticked.
```

## F5 Drop react-bootstrap Button/ButtonGroup/Modal; keep the grid

- [ ] **Owner:** Either | **Depends on:** F4

react-bootstrap's interactive components bring their own design language, and we pay for it twice: bundle size plus the `!important` override war in `PageHeader.module.css` that strips `Button` back to neutral before restyling it. The grid (`Container`/`Row`/`Col`) is fine and stays. In scope:

- `react/src/Components/PageHeader.tsx` — `Button` inside a `Link` (lines ~210–218). Also an a11y bug: a button nested in an anchor is invalid HTML. Nav items become styled `Link`s directly.
- `react/src/Components/Modals/StatsLeaderModal.tsx` and `TeamListModal.tsx` — `Modal` + `Button` → native `<dialog>` styled as an MD3 dialog (or a small shared ModalShell component).
- `react/src/Components/SchedulePage/DatePicker.tsx` and `ScheduleCard.tsx` — `ButtonGroup`/`Button` → MD3 segmented-button / text-button styles.
- `react/src/Components/LandingPage/QuickLinks.tsx` — `Button` → MD3 filled/tonal button styles.

**Implementation prompt:**

```text
ROLE: You are the senior dev pairing with me (junior dev, learning). For each component, show me what Bootstrap was providing (focus handling, dismiss behavior, ARIA) so we consciously replace it, not silently lose it. Pause after each numbered step. Do not expand scope beyond this ticket.

PROJECT: HockeyStatsWebApp — React app in react/. Prerequisites F2/F4 done (color roles + shared state-layer class exist). Container/Row/Col stay; only Button, ButtonGroup, and Modal go.

READ FIRST: docs/frontend-backlog.md section F5, react/src/Components/PageHeader.tsx, react/src/Style/PageHeader.module.css, react/src/Components/Modals/StatsLeaderModal.tsx, react/src/Components/Modals/TeamListModal.tsx, react/src/Style/Modals/StatLeaderModal.module.css, react/src/Components/SchedulePage/DatePicker.tsx, react/src/Components/SchedulePage/ScheduleCard.tsx, react/src/Components/LandingPage/QuickLinks.tsx.

STEPS (pause after each):
1. Create shared MD3 button styles in shared.module.css: .btnFilled (primary bg, on-primary text), .btnTonal (secondary-container), .btnText, all pill-shaped, all using the F4 state layer. 40px height, MD3 label typography.
2. PageHeader: replace Link>Button nesting with a single styled Link per nav item (role stays implicit anchor; keep aria-label and the active-page styling). Delete every !important from PageHeader.module.css — with Bootstrap's Button gone they have nothing to fight.
3. Modals: build a small shared dialog on native <dialog> (showModal()/close(), ::backdrop, Escape handling, close on backdrop click, focus returns to opener). Explain the React ref pattern for <dialog> to me. Port StatsLeaderModal, then TeamListModal, keeping their current content markup. Style as MD3 dialog: surface-container-high bg, 28px radius, headline + content + action row.
4. DatePicker/ScheduleCard: replace ButtonGroup/Button with our button classes (segmented look for the group: shared border, only outer corners rounded).
5. QuickLinks: swap Button for .btnTonal (they navigate, so if they render as links, style the links directly).
6. Confirm no component imports Button/ButtonGroup/Modal from react-bootstrap anymore (grep). Container/Row/Col imports remain. Do NOT remove the bootstrap/react-bootstrap packages — the grid still uses them.

DONE WHEN:
- cd react && pnpm build passes.
- grep -rn "Button\|Modal" react/src --include="*.tsx" shows no react-bootstrap Button/ButtonGroup/Modal imports.
- Modals open/close via button, Escape, and backdrop click; focus is trapped inside while open and returns to the trigger on close.
- Nav, date picker, schedule cards, and quick links visually match the MD3 button styles in both themes; zero !important left in PageHeader.module.css.
- This box is ticked.
```

## F6 Adopt the MD3 type scale

- [ ] **Owner:** Either | **Depends on:** F2

Typography is close but ad hoc. Roboto is already loaded (`react/index.html`) at weights 300/400/500/700 — correct for MD3. But the scale doesn't map to MD3 roles: `h1` is 2rem/400 (no MD3 role), the section title (1.375rem/600 in `shared.module.css`) is nearly title-large (22px) but MD3 titles are weight 400–500, and chips/labels use weight 700 where MD3's label-large is 14px/500. The `--text-*` tokens in `index.css` should become MD3 role tokens.

**Implementation prompt:**

```text
ROLE: You are the senior dev pairing with me (junior dev, learning). Start with a short explanation of the MD3 type roles (display/headline/title/body/label, each in large/medium/small) and which five or six roles a stats app actually needs. Pause after each numbered step. Do not expand scope beyond this ticket.

PROJECT: HockeyStatsWebApp — React app in react/. Roboto 300/400/500/700 already loads in react/index.html.

READ FIRST: docs/frontend-backlog.md section F6, react/src/index.css (h1/h2/h3 rules and --text-* tokens), react/src/Style/shared.module.css (.sectionTitle, .chip), react/src/Style/LandingPage/StatLeaderCard.module.css (stat value typography).

STEPS (pause after each):
1. Add MD3 type tokens to index.css as composite custom properties per role we use — recommend: headline-small (24/400), title-large (22/400), title-medium (16/500), body-medium (14/400), label-large (14/500), label-small (11/500) — each with font-size, line-height, weight, letter-spacing per the MD3 spec. Keep the old --text-* tokens as aliases during migration.
2. Map the element defaults: h1 → headline-small, h2 → title-large, h3 → title-medium. Update the rules in index.css.
3. .sectionTitle → title-large (drop the 600 weight); .chip and any stat labels → label-large or label-small (drop 700 → 500). Big stat numbers (StatLeaderCard's 1.8rem value) may stay as a deliberate display-style exception — add a comment saying so.
4. Sweep page modules for font-size/font-weight declarations that duplicate a role (grep "font-weight: 700" and "font-size:" in react/src/Style) and convert the clear matches. Anything ambiguous, list for me and we decide together.
5. Remove the --text-* aliases if nothing references them anymore.

DONE WHEN:
- cd react && pnpm build passes.
- Headings, section titles, chips, and table text render at the new scale in both themes; nothing wraps or truncates that didn't before (check mobile at 576px too, especially the bottom nav labels/chips).
- index.css documents each role token with its MD3 name.
- This box is ticked.
```

## F7 Replace icons with Material Symbols

- [ ] **Owner:** Either

**Update 2026-07-06:** the PNG icon folder (arrows, winning star) this ticket originally also covered was removed on main, so one icon dialect remains, and it isn't Material:

- `react/src/Components/PageHeader.tsx` hand-rolls seven Feather/Lucide-style SVGs (Home, Calendar, BarChart, Users, Moon, Sun, Back) inline — ~140 lines of the component.

Replace them with Material Symbols so iconography matches MD3.

**Implementation prompt:**

```text
ROLE: You are the senior dev pairing with me (junior dev, learning). Explain the Material Symbols delivery options (variable font vs per-icon SVG) and their tradeoffs (bundle size, flash-of-missing-icon, tree-shaking) before we pick. Pause after each numbered step. Do not expand scope beyond this ticket.

PROJECT: HockeyStatsWebApp — React app in react/. Vite + React 18, no icon library installed today.

READ FIRST: docs/frontend-backlog.md section F7, react/src/Components/PageHeader.tsx (inline SVGs).

STEPS (pause after each):
1. Recommend a delivery mechanism and justify it. Default recommendation: a tiny local Icon component that inlines the specific Material Symbols SVG paths we need (no font request, no new dependency, themable via currentColor). If you recommend the variable font instead, explain why.
2. Build the Icon component with the needed glyphs: home, calendar_month, monitoring (or bar_chart), group, dark_mode, light_mode, and arrow_back. Size via prop, color via currentColor.
3. Replace the seven inline SVG functions in PageHeader.tsx with the Icon component; delete the dead SVG code.

DONE WHEN:
- cd react && pnpm build passes.
- Nav icons (mobile bottom bar), theme toggle, and back button all render crisply at 1x and 2x DPR in both themes.
- All icons inherit color from tokens (verify by toggling themes).
- This box is ticked.
```
