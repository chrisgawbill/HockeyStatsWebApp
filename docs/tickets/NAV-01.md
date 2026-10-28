# NAV-01 — Header nav fits at 1024px

Delivery rules: [development workflow](../agent-development.md).

**Product Owner checkpoint:** Approved 2026-10-21: Option A — tighter pill padding and gaps at 1001–1199px, labels unchanged; accepted from 1001/1024/1200 screenshots 2026-10-21.

**Status:** DONE — accepted by the Product Owner from 1001/1024/1200
screenshots 2026-10-21.

**Measured (2026-10-21):** the overflow is the signed-out header (Google
"Sign in" button) between the 1000px icon-only breakpoint and ~1100px: ~55px at
1001px and ~33px at 1024px with a 130px-wide button; the signed-in corner (bell
+ avatar) overflowed 6px at 1001px only. The search box is already hidden in
this range.

**Decision (Product Owner, 2026-10-21):** Option A. From 1001–1199px the header
gap drops to `--ds-space-2`, item padding to 2px and pill padding to
`6px 10px` (`PageHeader.module.css`); labels and items are unchanged. It fits
with a Google button up to at least 160px wide.

**Goal:** Fix the global header nav overflowing the viewport by ~35px at 1024px
(found during TEAM-LINES-01, pre-existing).

**Dependencies:** none.

**Proposed scope (PM recommendation, confirm at checkpoint):**

- Measure the overflow in `components/PageHeader.tsx` /
  `PageHeader.module.css` at 992–1280px with signed-out and signed-in
  (`AccountCorner` bell + avatar) headers, since the signed-in corner is wider.
- Options to bring to the Product Owner: (A) tighten gaps and padding in the
  992–1199px range; (B) shorter labels in that range; (C) move the
  lowest-traffic items into a "More" menu. Recommend A, falling back to C if A
  can't absorb the signed-in corner.
- No change to the phone bottom nav or the search FAB.

**Acceptance:** at 992, 1024, 1100, 1200 and 1280px, signed in and out, light
and dark: `document.documentElement.scrollWidth <= innerWidth`, no clipped or
wrapped nav items, focus outlines fully visible.

**Verify:** build; Playwright width sweep asserting no horizontal overflow, with
screenshots for the Product Owner.

**Imported overview record (2026-10-28):** DONE — accepted by the Product Owner from 1001/1024/1200 screenshots 2026-10-21.
