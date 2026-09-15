# Design + Signature Feature Backlog

> A focused product/design track for making HockeyStatsWebApp feel like a designed hockey product rather than a generic statistics dashboard.
>
> This backlog sits alongside `docs/frontend-backlog.md` and `docs/exciting-features-backlog.md`. It does not replace them.
>
> **Design direction:** use MD3 as the foundation for structure, states, and accessibility. Use restrained Aero/glass treatment for personality. Do not try to fully implement MD3 across the app.
>
> **Product direction:** build three distinctive experiences:
> 1. **Game Story** — explain what happened in a game.
> 2. **Team DNA** — explain what kind of team this is.
> 3. **Playoff What-If** — let fans explore how results change the race.
>
> The goal is quality, not finishing every ticket. D1 + D2 + F1 is already a successful project.

## Working rules

These rules apply to every ticket:

- **Look first, then change.** Read the existing code before deciding what to build.
- **Use existing data first.** Do not add API work unless the feature truly needs data the app does not have.
- **Keep it small.** Change the smallest number of files and screens that solve the ticket.
- **Explain in plain English.** Avoid jargon unless it is useful. If a technical term matters, explain it briefly.
- **Work one step at a time.** Do not generate a giant implementation all at once.
- **Do not over-engineer.** Prefer the simplest code that fits the existing project. Do not add abstractions just because they sound clean.
- **Keep calculations easy to test.** When a calculation is more than a couple of lines, consider putting it in a small helper outside React.
- **Ask before expanding scope.** If required data or behavior is missing, stop and explain the problem before adding a backend, library, or major refactor.
- **Accessibility and readability beat visual effects.**
- **Stop when the ticket is done.** Log unrelated improvements for later instead of adding them now.

---

# D1 — Establish the HockeyStats visual foundation

- [ ] **Depends on:** existing MD3 work in `docs/frontend-backlog.md` where applicable | **Data:** none

Create a small visual foundation that the new features can share. This is **not** a complete MD3 implementation or a new component library.

Define simple shared decisions for:

- typography
- semantic colors
- surfaces
- spacing
- borders/radius
- elevation
- interactive states
- light/dark themes
- one subtle Aero/glass treatment

### Prompt for the developer

```text
You are mentoring me while I work on HockeyStatsWebApp. I am a junior developer. I will write the code.

Please explain things in plain English, give me one small step at a time, and wait for me before moving on. Do not give me a giant code dump.

Before coding, read:
- docs/architecture.md
- the MD3 section of docs/frontend-backlog.md
- the current global style/token files
- two existing pages and their CSS

Goal: make a small, reusable visual foundation for the new HockeyStats features.

First tell me what styling/tokens already exist. Then:
1. Add only the missing semantic tokens we actually need.
2. Keep the names simple: primary, surface, outline, success, warning, danger, etc.
3. Add a subtle Aero/glass treatment for important hero/summary areas.
4. Keep dense statistics on solid, readable surfaces.
5. Make hover, focus, selected, and disabled states consistent.
6. Apply the new system to one existing page as a small example.
7. Check light mode, dark mode, keyboard focus, and mobile width.
8. Add a short note explaining the visual rules.

Do not:
- install a Material UI library
- rewrite the whole app
- make everything glass
- add lots of abstractions
- add animation yet

If you find a bigger problem, tell me before fixing it.

Done when the build/typecheck passes, one page shows the new system, both themes are readable, and I understand every new token.
```

---

# D2 — Apply the visual foundation to Home → Game → Team

- [ ] **Depends on:** D1 | **Data:** existing data only

Apply the new visual language to three important screens. Do not redesign the whole app.

- **Home:** help users understand where they are and what matters.
- **Game:** make the game state the main focus.
- **Team:** create a clean pattern for a data-rich team page.

### Prompt for the developer

```text
You are mentoring me while I work on HockeyStatsWebApp. I am a junior developer and I will write the code.

Explain things in plain English. Give me one small change at a time. Do not generate the whole redesign for me.

Read:
- D1 in docs/design-feature-backlog.md
- docs/architecture.md
- the current Home, Game Detail, and Team pages
- their CSS and shared layout components

Goal: make Home, Game, and Team feel like the same product.

For each page:
1. Tell me what the most important thing is for the user.
2. Make one or two hierarchy improvements using D1's tokens.
3. Use Aero only for a focal area.
4. Keep tables and dense stats simple and readable.
5. Check mobile and keyboard focus.

Do not:
- redesign navigation
- add new API calls
- rebuild components without a reason
- migrate every page
- start Game Story, Team DNA, or Playoff What-If yet

If the existing code makes the requested change awkward, explain the simplest option before we refactor anything.

Done when the three pages share a clear visual language, existing data/links still work, mobile works, and build/typecheck passes.
```

---

# F1 — Game Story: turn a game into a visual narrative

- [ ] **Depends on:** D1, preferably D2 | **Data:** existing game-detail data

**Flagship feature #1.** Answer the fan's question: **"What actually happened?"**

The first version should be simple:

- final/live score and game state
- scoring timeline
- lead changes
- important period changes
- 2–4 factual turning points
- a few useful stats that help explain the result

Do not invent a "momentum" story when the data cannot support it.

### Prompt for the developer

```text
You are mentoring me while I build a Game Story feature. I am a junior developer and I will write the code.

Explain things in plain English. Work one small step at a time. Do not give me the complete feature in one response.

Read:
- docs/architecture.md
- D1 and F1 in docs/design-feature-backlog.md
- the current Game Detail page
- its types/helpers/data code
- the actual game-detail data returned by the app

Goal: let a fan understand a completed game in about 10 seconds without reading the whole box score.

First, inspect the data and tell me what we actually have. Do not assume fields exist.

Then build the smallest useful version:
1. Show scoring events in order.
2. Show when the lead changed or the game was tied.
3. Show 2–4 factual turning points, such as first lead or largest lead.
4. Use shots, special teams, or other stats only when they help explain the story.
5. Make the timeline easy to scan on mobile.
6. Make sure visual events also have readable text.
7. Use the D1 design system. Aero can be used for the hero, not every card.
8. Check one real completed game against its official record.

If something we want is not in the existing data, stop and tell me. Do not immediately add an API or backend endpoint.

Do not:
- add AI commentary
- invent events or statistics
- build a generic chart system
- rewrite the whole Game Detail page
- add a library unless there is a real need

If you think a more complicated solution would be better, explain it as a future option instead of building it now.

Done when a real completed game has a clear story, missing data is handled gracefully, mobile/dark mode work, and build/typecheck/tests pass.
```

---

# F2 — Team DNA: show what kind of team this is

- [ ] **Depends on:** D1, D2; reuse E2 helpers if available | **Data:** existing season data

**Flagship feature #2.** Give each team a visual fingerprint based on measurable tendencies.

Possible dimensions:

- goal differential
- scoring environment
- home/road performance
- recent form
- comeback/lead protection if derivable
- special teams if already available
- pace/consistency if the data supports it

The result should feel like a useful team profile, not a pile of numbers.

### Prompt for the developer

```text
You are mentoring me while I build Team DNA. I am a junior developer and I will write the code.

Explain things in plain English. Give me one step at a time. Keep the solution simple.

Read:
- docs/architecture.md
- D1 and F2 in docs/design-feature-backlog.md
- the current Team page
- existing team-form helpers
- existing season/standings data
- E2 in docs/exciting-features-backlog.md if it already exists

Goal: help a fan answer, "What kind of team is this?"

First, list the team metrics we already have. Prefer no new API calls.

Then:
1. Pick 4–6 useful metrics that describe different parts of the team.
2. Explain each metric in plain language.
3. Calculate the values with the simplest reasonable helper code.
4. Choose a clear visual. Do not use a radar chart just because it looks impressive.
5. Keep the actual numbers visible.
6. If you normalize a value, explain what the scale means.
7. Add a short note saying which season/data the profile uses.
8. Make it work on mobile and dark mode.
9. Test it with a strong, average, and struggling team.

Do not:
- add machine learning
- add league-wide clustering
- add historical comparisons yet
- create a new API just for this
- hide the numbers behind the graphic

If a metric needs complicated new data, leave it out and tell me why.

Done when a fan can quickly describe the team's profile, the values are understandable, and build/typecheck/tests pass.
```

---

# F3 — Playoff What-If: let fans change the future

- [ ] **Depends on:** D1, preferably E1 playoff helpers | **Data:** existing standings + schedule

**Flagship feature #3.** Let fans change a few future game results and immediately see how the playoff race changes.

Example: **"What if my team wins the next 5?"**

Show:

- projected points
- playoff position
- movement
- cutline distance where available
- biggest movers

Start with a simple deterministic scenario. This is **not** an official playoff odds calculator.

### Prompt for the developer

```text
You are mentoring me while I build Playoff What-If. I am a junior developer and I will write the code.

Explain things in plain English. Work one small step at a time. Do not give me a full implementation upfront.

Read:
- docs/architecture.md
- D1 and F3 in docs/design-feature-backlog.md
- E1 in docs/exciting-features-backlog.md
- current standings and schedule data
- the current Standings page

Goal: let a fan change a few upcoming results and immediately see how the standings would change.

First, inspect the existing game and standings models. Tell me the smallest amount of data we need.

Then build the simple version:
1. Keep scenario choices in local state. Do not change the real standings data.
2. Give upcoming games simple controls such as Home win, Away win, and Reset.
3. Write the simplest helper needed to apply those results to a copy of the standings.
4. Start with points and position. Only handle tiebreakers that the existing data supports safely.
5. Show before vs. after for the selected team and important movers.
6. Make Reset return to the original standings.
7. Handle seasons with no remaining games.
8. Make it clear that this is a simplified scenario, not official playoff odds.

Changing a scenario should not make a network request.

Do not:
- add Monte Carlo simulation yet
- build a perfect NHL tiebreaker engine
- add accounts or saved scenarios
- add backend work unless the existing data truly cannot support the feature

If you discover a hard data problem, stop and explain it before expanding the project.

Done when several future results can be changed, the projection updates correctly, Reset works, and build/typecheck/tests pass.
```

---

# F4 — Signature interaction polish

- [ ] **Depends on:** D1 + one completed signature feature | **Data:** none

Add a few small animations to the strongest feature. This is polish, not an animation project.

### Prompt for the developer

```text
You are mentoring me on a final motion pass. I am a junior developer and I will write the code.

Explain things simply and make one change at a time.

Read D1 and the completed signature feature.

Goal: make the feature feel responsive without making it feel like an animation demo.

Find only three useful moments:
- entering the feature
- changing a value or state
- revealing secondary information

Then:
1. Use simple CSS transitions where possible.
2. Keep them short and subtle.
3. Respect prefers-reduced-motion.
4. Check keyboard and mobile interactions.
5. Remove anything that is decorative rather than useful.

Do not add an animation library, parallax, animated backgrounds, or page-wide motion.

If an animation creates a layout problem, remove it rather than adding a complicated fix.

Done when the feature feels responsive, reduced-motion users get an equivalent experience, and there are no distracting layout jumps.
```

---

# F5 — Portfolio-quality pass

- [ ] **Depends on:** D1 + at least one signature feature | **Data:** none

Create a short design record that explains what was built and why. Keep it useful to another developer, not just a portfolio essay.

### Prompt for the developer

```text
You are helping me document the work I finished. I am a junior developer.

Keep this short, plain, and factual.

Read:
- docs/design-feature-backlog.md
- docs/frontend-backlog.md
- docs/exciting-features-backlog.md
- the completed feature ticket

Write a short design note covering:
1. The user problem.
2. The main design decisions.
3. Why MD3 is the foundation instead of the exact visual style.
4. Where Aero/glass is used and where it is avoided.
5. What the flagship feature does and why it helps fans.
6. Important data limitations or simplifications.
7. Accessibility and reduced-motion decisions.
8. What we intentionally did not build yet.

Keep it concise. Do not turn it into a long technical essay.
```

---

# Suggested order

### Milestone 1 — Make the foundation

- [ ] D1 — Visual foundation
- [ ] D2 — Home → Game → Team

### Milestone 2 — Build one memorable thing

- [ ] F1 — Game Story
- [ ] F4 — Motion polish

### Milestone 3 — Add the two supporting ideas if scope allows

- [ ] F2 — Team DNA
- [ ] F3 — Playoff What-If

### Milestone 4 — Package the work

- [ ] F5 — Portfolio-quality design record

**Recommended stopping point:** D1 + D2 + F1 + F4 is already a strong junior designer/developer project. F2 and F3 should be treated as follow-on features, not reasons to dilute the quality of Game Story.

## Design north star

> **MD3 gives HockeyStats the rules. Aero gives it atmosphere. The signature features give it a reason to exist.**

The app should feel like a hockey product first and a design-system exercise second.
