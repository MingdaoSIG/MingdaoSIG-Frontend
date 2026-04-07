# MDSIG Frontend — Agent Guide

MDSIG is a community sharing platform for Mingdao High School students and teachers to exchange ideas and insights.

## Commands

```bash
pnpm install       # Install dependencies
pnpm dev           # Dev server (DO NOT use for build verification)
pnpm build         # Production build (USE THIS for build verification)
pnpm check         # Format and lint with Biome — run after making any changes
```

## Code Style Rules (Biome)

Run `pnpm check` after every change. All generated code **must** follow these rules (enforced by Biome via `biome.json`):

### Formatting

- Use **2 spaces** for indentation, never tabs
- Keep lines within **80 characters**
- Always end statements with a **semicolon**
- Use **double quotes** for strings and JSX attributes
- Always include **trailing commas** in JS/TS (but never in JSON)
- Always wrap arrow function parameters in **parentheses**: `(x) => x`
- Include spaces inside braces: `{ value }`

### Code You Must Write

- Always use **block statements** (`{}`) with `if`, `else`, `for`, `while` — no single-line bodies
- Use **`for...of`** instead of `.forEach()` for iteration
- Use **`console.error`**, **`console.warn`**, **`console.info`**, or **`console.assert`** only — never bare `console.log`
- Keep Tailwind CSS class names **sorted** (Biome enforces `useSortedClasses`)

### Code You Must Avoid

- Do NOT leave **unused imports** or **unused variables** — remove them
- Do NOT use **array index as React key** when a stable identifier is available
- Do NOT leave **empty block statements** (`{}`) — add a comment or remove the block
- Do NOT write **`else` after `return`/`break`/`continue`** — use early return instead
- Avoid **`any`** type — use a specific type whenever possible

### Rules That Are NOT Enforced

These rules are intentionally **off** — do not "fix" code to satisfy them:

- `useImportType` — using `import` instead of `import type` is fine
- `useExhaustiveDependencies` — React hook dependency arrays are not auto-checked
- `noInferrableTypes` — explicit type annotations on inferred values are allowed
- `noStaticElementInteractions`, `noSvgWithoutTitle`, `useKeyWithClickEvents` — a11y rules are off

## Docs

- [Architecture & project structure](docs/architecture.md)
- [API patterns & authentication](docs/api.md)
- [Code style & naming conventions](docs/code-style.md)
- [TypeScript interfaces & permissions](docs/data-types.md)
- [Feature implementation details](docs/features.md)
