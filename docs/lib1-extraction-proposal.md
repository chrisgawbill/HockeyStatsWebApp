# LIB1 extraction proposal

Phase A inventory and approved implementation record for the portable
Aero/MD3 experience language. The approved package boundary is implemented
locally; registry publication and public release remain out of scope.

## Current boundary and consumers

`react/src/design-system/core.css` is the existing portable source. It is
imported once by `react/src/app/index.tsx`, before the HockeyStats global
styles. Its generic classes are used by the app shell (`.ds-page-shell`),
focus treatment (`.ds-focusable`), and Aero surface treatment
(`.ds-aero-surface`). Its `--ds-*` custom properties are consumed by global,
shared, and feature CSS for motion, focus, elevation, and Aero aliases.

`react/src/styles/theme.css` maps selected `--ds-*` roles into the app's
`--color-*`, spacing, elevation, and Aero aliases. `ThemeContext` owns the
HockeyStats preference policy: local storage, system color scheme, time-based
default selection, visibility/media-query updates, and the `data-theme`
attribute. These remain app-owned during the initial extraction.

## Inventory

| Area | Classification | Boundary decision |
|---|---|---|
| Semantic color roles and light/dark role values in `core.css` | PORTABLE | Export role names/default themes; consumers may override values. |
| Typography family, sizes, weights | PORTABLE | Export generic legibility tokens; app-specific pixel font stays local. |
| Spacing, radii, elevation, focus ring | PORTABLE | Export the existing scale and generic focus primitive. |
| Aero sheen, border, page background, surface class | PORTABLE | Export restrained generic surface treatment; no product layouts. |
| Motion duration/easing vocabulary | PORTABLE | Export CSS variables and reduced-motion duration behavior. |
| `prefers-reduced-motion` rules for generic primitives | PORTABLE | Preserve stable layout/state; consumers own feature animation policy. |
| `data-theme="dark"` token override convention | PORTABLE | Keep the selector convention and document it; no preference storage. |
| HockeyStats `--color-*` aliases and theme seed/brand colors | HOCKEYSTATS | Keep in `styles/theme.css`; these are the app mapping layer. |
| Time-of-day theme scheduling, local storage, media-query lifecycle | HOCKEYSTATS | Keep `ThemeContext` and `themeSchedule` in the app. |
| Hockey, team, rink, card, game, status, and feature tokens | HOCKEYSTATS | Never move into the library. |
| Bootstrap, React, React-Bootstrap, and feature CSS/components | HOCKEYSTATS | No component framework or runtime dependency extraction. |
| Generic hover/pressed/selected/disabled state tokens | UNCERTAIN | Inventory indicates a portable vocabulary is useful, but existing app rules are distributed; extract only a small documented token contract after approval. |
| Generic button/card/chip components | UNCERTAIN | Defer; LIB1 should prove the style-language boundary without becoming a component library. |
| `color-scheme` declaration and consumer preference UI | UNCERTAIN | Library can expose documented theme hooks; app decides whether and where to declare/support preference controls. |

## Accidental coupling check

The portable file and its README contain no HockeyStats, NHL, team, game,
rivalry, schedule, standings, or RinkQuest imports/names. Coupling is at the
intended CSS boundary: HockeyStats aliases `--ds-*` values and app components
consume generic class names. The library must not import or mention the app,
and the existing feature CSS should not be copied wholesale.

## Proposed initial package

**Proposed repository:** `aero-md3-core` as a separate sibling repository.

**Proposed package:** `@chrisgawbill/aero-md3-core` (private/local during this
ticket; no registry publication).

**Tooling:** pnpm; CSS-first package with a minimal `package.json` and no
runtime dependencies. Use the package's source CSS directly for local
development and a lightweight CSS integrity check/build script only if needed.
Do not introduce React, Sass, Tailwind, a CSS-in-JS runtime, Storybook, or a
monorepo.

**Proposed structure:**

```text
aero-md3-core/
├── package.json
├── README.md
└── src/
    └── core.css
```

**Initial public API:**

```css
@import '@chrisgawbill/aero-md3-core/core.css';
```

The API consists of the documented `--ds-*` custom-property roles and the
three opt-in classes `.ds-page-shell`, `.ds-focusable`, and
`.ds-aero-surface`. The minimal consumer contract is: import the stylesheet
once, optionally override role values in the consumer theme, and set
`data-theme="dark"` on the consumer root for the included dark defaults.
Accessibility semantics, labels, focus management, contrast validation, and
feature-specific interaction behavior remain consumer responsibilities.

## Implemented approval

The approved implementation uses `aero-md3-core` at the sibling location
`/home/chris/programming-projects/aero-md3-core`, pnpm as the intended package
manager, a CSS-first zero-runtime-dependency package, and the
`@chrisgawbill/aero-md3-core/core.css` stylesheet/class/token API. HockeyStats
consumes it through a local file dependency; it has not been published.
