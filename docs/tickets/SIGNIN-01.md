# SIGNIN-01 — Account icon and sign-in modal (frontend)

Delivery rules: [development workflow](../agent-development.md).

**Product Owner checkpoint:** Approved 2026-10-22: the Google pill becomes an account icon button (option 1: filled figure in the glass circle) on phones and desktop, opening a sign-in modal with Google, Microsoft, Discord and email code; each provider hidden until configured. Narrowed to Google and Discord; accepted 2026-10-22.

**Status:** DONE — accepted by the Product Owner 2026-10-22. Spotter passed on
`feature/signin-dialog` (`2a45e8d`, 32/32 specs in `react/qa/sign-in.spec.mjs`
at 375/1280 light/dark, no new findings; signed-in screenshots unchanged).

**Approved (Product Owner, 2026-10-22):** the signed-out Google pill becomes an
account icon button (filled figure inside the bell's glass circle,
`aria-label="Sign in"`) on phones and desktop. It opens an `AppDialog` with
Google, Microsoft, Discord and "Email me a code"; a provider the API does not
offer is hidden. Signed in is unchanged (bell + avatar).

**Resolved question (from API-AUTH-02, 2026-10-22; decision below):** the API now offers only Google and
Discord and has no providers config endpoint; confirm the modal's provider
list and how it hides one before starting. The Discord option calls
`useAuth().signInWithDiscord()` (already built under API-AUTH-02) and is the
first place a Discord button appears; API-AUTH-02's Spotter run happens here.

**Decided (Product Owner, 2026-10-22):** the modal offers Google and Discord
only (no Microsoft, no email code). A provider is hidden when its
`VITE_GOOGLE_CLIENT_ID` / `VITE_DISCORD_CLIENT_ID` was not set at build time;
with neither, the dialog says sign-in is unavailable. **Changed (Product
Owner, 2026-10-22):** the home Up next strip and Rink Quest no longer show
Google's personalized pill; each shows a generic "Sign in" button that opens
the sign-in dialog (`SignInButton` on home, a `GameButton` on Rink Quest).

**Verify:** Spotter on the pushed branch: 375/1280 light/dark, keyboard and
screen-reader pass on the dialog, and API-AUTH-02's Discord checks.

**Imported overview record (2026-10-28):** DONE — accepted by the Product Owner 2026-10-22. Spotter passed on `feature/signin-dialog` (`2a45e8d`, 32/32 specs in `react/qa/sign-in.spec.mjs` at 375/1280 light/dark, no new findings; signed-in screenshots unchanged).
