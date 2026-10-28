# PUSH-03 — Automatic device subscription and account push settings (frontend)

Delivery rules: [development workflow](../agent-development.md).

**Product Owner checkpoint:** Decided 2026-10-25: permission is asked only from the bell; devices that already allow notifications subscribe automatically (see block). Product Owner reviews the bell panel.

**Status:** DONE — Product Owner accepted 2026-10-25 after Spotter passed. Merged to `main` in `394ca08f` (#124); tsc, tests and build pass; API-PUSH-03 is deployed.

**Decisions (Product Owner, 2026-10-25):** permission is asked only from the
bell (no banner, no prompt during sign-in). A signed-in device whose browser
already allows notifications (and, on iOS, runs from the Home Screen) is
subscribed and re-synced automatically on every app load and after signing
in again, with no prompt. Signing out still removes that device.

**PM decisions:** because devices re-subscribe automatically, the bell's
"Turn off phone notifications" now turns the account switch off (all
devices) instead of unsubscribing only this device; "Turn on" asks for
permission when needed, subscribes this device and turns the account switch
on. The bell panel lists favorite players with an "In weekly push" toggle
below the weekly report switch, mirroring the team mutes.

**Depends on:** API-PUSH-03 deployed first. Against an older API the bell
reads the missing switch as off and every load re-seeds the sent ledger.

**Verify:** tsc, `pnpm test`, build; Spotter on the pushed branch: auto
subscribe with permission already granted, re-sync after sign-out/sign-in,
bell on/off sets the account switch, player toggles, denied and iOS-install
states unchanged, 375/1280 light/dark.
