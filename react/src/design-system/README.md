# Portable visual-language core

`core.css` is the project-agnostic part of the Aero/MD3-inspired foundation. It
contains semantic color roles, type, spacing, shape, elevation, focus, and one
restrained Aero surface treatment. It has no HockeyStats components, routes,
data, or domain vocabulary.

## Reuse in another React project

Copy `core.css`, import it once near the application entry point, and add a
small project theme file that maps the project's semantic tokens to the `--ds-*`
roles. Set `data-theme="dark"` on the root element when the dark scheme is
active. The `.ds-page-shell`, `.ds-focusable`, and `.ds-aero-surface` classes
are the minimal optional primitives.

HockeyStats-specific aliases and brand/data tokens remain in `styles/index.css`
and `styles/theme.css`; those files are the application layer and should not be
copied with the core. Dense statistics should stay on solid surface roles; the
Aero treatment is reserved for focal chrome or summary surfaces.

Motion vocabulary: use `--ds-motion-duration-short` for immediate feedback,
`--ds-motion-duration-medium` for continuity between related states, and
`--ds-motion-duration-long` only when a larger layout or view change needs
continuity. Use the `--ds-motion-easing-*` roles for transitions that
communicate hierarchy or continuity. The duration roles become zero under
`prefers-reduced-motion`; a component must still preserve the same visible
state and layout when motion is disabled.

Deferred from D1: a published package, a component library, and a full
migration of existing feature CSS.
