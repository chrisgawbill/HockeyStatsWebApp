# AERO-07 — `.ds-base` specificity fix (aero-md3-core 0.4.1) and base-layer adoption

Delivery rules: [development workflow](../agent-development.md).

**Status:** ACTIVE (library part released as 0.4.1; app part implemented on
branch `ccr-a1a082c9-flvcfk` with option A below, awaiting a Spotter run and
Product Owner acceptance)

**Goal:** HockeyStatsWebApp gets its `html`/`body`/heading/`code` element
defaults from `.ds-base` (deferred [AERO-06](AERO-06.md) item 7) without
component classes losing to it.

**Dependencies:** AERO-06 (DONE, item 7 deferred). The library part lives in
aero-md3-core `docs/tickets/AERO-07.md` and must be on npm before the app part.

**Decisions (Product Owner, 2026-11-02):**

- aero-md3-core 0.4.1: wrap the `.ds-base` element selectors in
  `:where(.ds-base)` (element specificity), no other token, class or value
  changes; README states that any class wins.
- App: bump to `^0.4.1`, add `ds-base` to `<html>` (keep `ds-scrollbar`).
  Delete the local `html` scroll-behavior rules (with their reduced-motion
  block), the `body` margin, safe-area padding, color, font-family and
  font-smoothing, the `h2`/`h3`/`code` rules and the h1 size.
- Keep `overflow-x: clip`, the `--color-bg` body background
  (surface-container-low; shared uses surface), the theme color transition and
  its reduced-motion `transition: none`, and `h1 { font-weight: 400 }` (AERO-06
  decision). `--ds-color-selection*` already hold today's selection values.
- Known small differences are measured and brought to the Product Owner; keep
  local overrides only where a difference is visible.
- Heading differences: option A. Rink Quest's two pixel-font titles
  (`BoardGamePage` and `GameLengthPicker` `.title`) keep `line-height: normal`
  locally; every other difference in the table below is accepted.

**Product Owner checkpoint (decided: option A):** measured differences after adoption,
1280px, reduced motion (`/home/user/evidence/aero-07/diff-*.png`):

| Difference                                                     | Where it shows                                                             | Size                                                                                  |
| -------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Shared `line-height: 1.2` on h1–h3 (was `normal`)              | Rink Quest title and "Choose game length" (Press Start 2P, `normal` = 1.0) | Headings 6.4px and 4.8px taller; content below moves down about 11px. Clearly visible |
| Same                                                           | Home section titles (Roboto, `normal` ≈ 1.15)                              | 0.4–0.8px per heading; "Draft lottery" ends 2.8px lower, page 4px taller              |
| Same                                                           | My Hockey / compare / standings page and state titles                      | Under 1px                                                                             |
| h1 letter-spacing -0.02em (was -0.5px)                         | 32px h1: -0.64px; 24px: -0.48px; standings 18px state title -0.36px        | "Rink Quest" 1.4px narrower; standings state title 3px wider. Not noticeable          |
| h3 letter-spacing 0 (was 0.15px)                               | No bare h3 on the captured pages                                           | Not measured                                                                          |
| Mono stack (`--ds-font-family-mono` vs source-code-pro/Menlo…) | No `code` on the captured pages                                            | Not measured                                                                          |

Recommendation: keep one local override, `line-height: normal` on the two
Rink Quest title rules (`BoardGamePage`), and accept the rest. Option B: a
global `h1, h2, h3 { line-height: normal }` (plus h1 -0.5px / h3 0.15px
letter-spacing) restores 1280px pixel identity on every captured page
(verified), but keeps more local rules. Option C: accept all differences.

**Evidence** (branch `ccr-a1a082c9-flvcfk`):

- Library: aero-md3-core PR #4 squash-merged as `a700be9`; publish workflow
  run 17 published 0.4.1 (`+ @chrisgawbill/aero-md3-core@0.4.1`). Its final
  "Verify published version" step failed with a 404 because it ran one second
  after publish, before npm finished processing (same as the 0.3.0 and 0.4.0
  runs). Registry, 2026-11-02: `latest` is 0.4.1; the packed `src/core.css`
  and README are byte-identical to `main` (`a700be9`).
- Dependency: `^0.4.1` (installs 0.4.1). `pnpm tsc`, `pnpm test` (72 files,
  337 tests), `pnpm format:check`, `pnpm build`: PASS.
- `html`/`body` computed values unchanged: margin 0, inline padding, the
  `--color-bg` background, text color, Roboto, antialiasing, `overflow-x:
clip`; `scroll-behavior` smooth, and auto under reduced motion.
- Before = `93bd7e4` (0.4.0, local rules); after = this branch built against
  the 0.4.1 stylesheet. Pages: home, Rink Quest, My Hockey, compare,
  standings; 1280 and 375; light and dark; reduced motion. Data APIs and
  sign-in are unreachable here, so data pages show their error/sign-in states.
- Computed styles: no font-size, font-weight, color, background or
  font-family differences on any captured heading or the body; only the
  line-height and letter-spacing rows above. The 0.4.0 defect (section titles
  enlarged, Rink Quest headings resized, body background replaced) is gone.
- 1280: all pages differ only by the table above. With the Option B overrides
  injected, 17 of 20 shots are pixel-identical; the other three are 375px
  shots, and the 375px baseline itself differs between two identical runs
  (text antialiasing), so 375px is compared visually, not by pixels. The
  same noise appeared once at 1280 (standings dark, text fringes only) when
  re-shooting with the published package; computed styles were identical.
- Option A applied: `pnpm tsc`, `pnpm test` (72 files, 337 tests),
  `pnpm format:check`, `pnpm build`: PASS. Rink Quest at 1280 now differs from
  before only inside the "Rink Quest" title glyphs (accepted letter-spacing);
  "Choose game length" and everything below are pixel-identical. Other pages
  are unchanged from the no-override build.
- Screenshots: `/home/user/evidence/aero-07/<page>-<width>-<theme>-{before,after}.png`
  (after = published 0.4.1 with option A; `diff-rink-quest-1280-light.png`
  shows the no-override build, `diff-rink-quest-1280-light-option-a.png` the
  result), `diff-*.png` side-by-side crops,
  `computed-{before,after}.json`.
- NOT RUN: Spotter run on the pushed branch (data pages, signed-in views,
  Rink Quest gameplay headings, `code` text, non-reduced-motion theme toggle).

**Release follow-ups:**

- Pre-existing, unchanged here: the reduced-motion `body { transition: none }`
  in `styles/index.css` comes before the `body` rule, so the 0.2s theme
  transition still runs under reduced motion (same before and after). Moving
  the block below the `body` rule would fix it.
