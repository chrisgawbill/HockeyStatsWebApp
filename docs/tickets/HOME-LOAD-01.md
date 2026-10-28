# HOME-LOAD-01 — Home sections load and fail on their own

Delivery rules: [development workflow](../agent-development.md).

**Product Owner checkpoint:** Decided 2026-10-25: option 1 — each section's heading stays with the existing spinner in space held at its loaded height (mockups compared against skeleton cards); a failed section shows the inline error with its own Try again (lottery and standings share one call and recover together); skater and goalie leaders load and fail separately. Spotter passed; accepted by the Product Owner 2026-10-25

**Status:** DONE — Spotter passed on the pushed branch and the Product Owner
accepted 2026-10-25; merged to `main`.

**Context:** `app/LandingPage.tsx` shows one full-page spinner until skater
leaders, goalie leaders and standings have all loaded, and replaces the whole
page with "Couldn't load stat leaders" when either leader call fails, hiding
standings and the draft lottery too. One slow or failed call (a waking API, a
fresh incognito window with no cache) makes the home page look broken.
Found 2026-10-22 alongside the Firefox private-window crash fix (service
worker guard) and the signed-out Up next prompt, both done.

**Proposed (confirm at checkpoint):**

- Each section (stat leaders, draft lottery, standings) shows its own loading
  placeholder and its own error with Try again; the rest of the page renders
  as soon as its data arrives.
- Keep the intro and Up next strip visible throughout.

**Decided 2026-10-25 (Product Owner):**

- Loading: option 1 of the design sheet — each section's heading shows at
  once and the existing `LoadingState` spinner sits in space held at about
  the loaded height (leader grid 23.75rem; lottery board 25rem, 19.5rem from
  1024px; standings fill their desktop column). Skeleton cards were declined.
- Error: the inline `ErrorState` under the section heading, no repeated
  title, with Try again re-running only that section's fetch. Draft lottery
  and standings share `GET /standings`, so both show the error and either
  Try again restores both.
- Skater and goalie leaders load and fail separately (each group errors only
  when all four of its categories fail, as before); on phones the switch and
  swipe keep working and the selected group shows its own state.

**Implementation:** `components/SectionLoadState` (spinner or error in held
space, children once loaded) is used by `StatLeadersSection` (per group),
`DraftLotteryOddsRow` (Simulate hidden until the board is ready) and
`LandingPageStandings`. The leaders hook's error names its group
("Couldn't load skater leaders."). A section with no data for the season keeps
its existing empty state; the lottery still disappears when there are no
lottery teams.

**Verify:** `react/qa/home-loading.spec.mjs` (`HOME-LOAD-01 Verify:`) fails
skater leaders, goalie leaders and standings one at a time (500s, after the
client's ~7s of retries) and delays each one at a time; it passed 12/12 at
375 and 1280 against a local stand-in for the fixtures and failed 12/12 on
the previous `main`. Spotter passed on the pushed branch (2026-10-25).

**Imported overview record (2026-10-28):** DONE — Spotter passed and the Product Owner accepted 2026-10-25; merged to `main` with `react/qa/home-loading.spec.mjs`; tsc, tests, format and build pass.
