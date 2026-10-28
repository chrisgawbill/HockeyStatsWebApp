# SHARE-01 — Share button in the phone top bar

Delivery rules: [development workflow](../agent-development.md).

**Product Owner checkpoint:** Approved 2026-10-22: share icon in the phone top bar before the account controls (no desktop button); Web Share API, copy + "Link copied" toast fallback, cancel silent; title = page heading + " · Hockey Stats"; every page except /diagnostics; URL shared as is. Reopened 2026-10-25: never merged; ported in #125; accepted by the Product Owner 2026-10-25

**Status:** DONE — accepted by the Product Owner 2026-10-25 after Spotter passed. Reopened 2026-10-25 because the 2026-10-22 implementation (`ed085ec7`) never reached `main`; ported and merged to `main` in `fa7e782` (#125) with `react/qa/share.spec.mjs`; tsc, tests, format and build pass.

**Goal:** On phones, one tap shares the page being viewed (a comparison, a
game, a team, a matchup preview) through the phone's share sheet.

**Context:** The phone top bar is `PageHeader`'s `nav-secondary-row` (back
button, season selector, account corner). Every page is a hash route whose URL
already rebuilds the view (`/compare?players=…`, `/matchup?teamA=…`,
`?season=`), so sharing `location.href` is enough.

**Approved (Product Owner, 2026-10-22):**

- A share icon button in the phone top bar between the season selector and
  the account controls (`[back] [season] [share] [bell] [avatar]`), styled like
  the bell (its 32px glass circle; Product Owner kept the bell's size
  2026-10-25). Not rendered in the desktop header.
- `navigator.share({ title, url })`; without it, copy the link and show a
  "Link copied" toast (`role="status"`) just under the top bar (Product Owner
  kept this position 2026-10-25, clear of the bottom nav, search button and
  install banner). A cancelled share
  sheet (`AbortError`) is silent; other failures show an error toast.
- Title: the page's first `h1` text + " · Hockey Stats", or "Hockey Stats".
- Every page except `/diagnostics`; the URL (including `season=`) is shared
  as is.
- Logic in `lib/sharePage.ts`, the button in `components/ShareButton.tsx`.

**Acceptance:** visible on phones at 375 in light and dark, absent at 1280;
opens the share sheet with the current URL; the copy fallback works and
announces itself to screen readers; a cancelled share shows nothing; the top
bar fits at 320–430px signed in and out with no page horizontal scroll.

**Verify:** unit tests for the share/copy decision; Playwright against a mocked
API with `navigator.share` present, absent and rejected; 375/1280 light/dark
screenshots.
