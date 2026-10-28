# Code conventions

Code ships readable by a person new to the file. Apply these rules while implementing; the PM reviews the final diff:

- splits long or deeply nested functions into small, well-named ones;
- removes duplication, dead code, and speculative options;
- gives a UI piece used in more than one place (or a large component's
  distinct parts) its own component file: cross-feature ones in
  `components/`, feature-only ones in the feature's `components/`;
- reuses before it adds: search for an existing component that shows the
  same thing and extend it (a prop or a slot) instead of writing a near-copy
  file or an inline component that duplicates one; merge duplicates found
  in the diff;
- names things for what they mean in the domain, not how they are computed;
- gives every variable, parameter, and function a name that says what it
  holds or does (`favoriteTeams`, `updatedRowCount`, `isLabelTooLong`), not
  `data`, `res`, `e`, `tmp`, `x`, or a bare `updated`/`normalized`;
- keeps data flow one-directional and obvious (no hidden mutation, no flags
  that change a function's meaning, no reaching across layers);
- names functions for what they do, as a verb phrase (`listFavoriteTeams`,
  `parseCategoryUpdate`), not `handle`, `process`, `doStuff`, or `helper`;
- writes idiomatic code for the language and the file's existing style
  (e.g. CommonJS and `async`/`await` in the API, typed React function
  components and hooks in the frontend); no patterns borrowed from another
  language;
- puts comments on functions to say what they do; inline comments inside a
  function body are rare and only explain a non-obvious why.

Behavior must not change: the same checks must still pass afterwards.
