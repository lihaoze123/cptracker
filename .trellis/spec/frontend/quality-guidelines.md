# Quality Guidelines

> Code quality standards for frontend development.

---

## Overview

TypeScript strict mode with ESLint enforcement. No Prettier — formatting relies on editor settings and consistent conventions. No test framework configured — quality is enforced through TypeScript, lint, and manual review.

---

## Linting

ESLint 9 flat config (`eslint.config.js`):

- `@eslint/js` recommended rules
- `typescript-eslint` recommended rules
- `react-hooks` plugin (rules of hooks)
- `react-refresh` plugin (Vite HMR) — set to `off` for `only-export-components`

Run: `npm run lint`

Key rules enforced:
- Exhaustive deps for React hooks
- TypeScript strict checks
- No unused variables (TypeScript level)

---

## Required Patterns

- **Always run `npm run generate`** after modifying route files in `src/routes/`
- **Always use `useProblems()` hook** — never import `db.ts` or `supabase/database.ts` directly
- **Named exports** for all components — no default exports
- **`cn()` for class merging** — never concatenate Tailwind classes manually with string templates
- **Type-safe query keys** — use `as const` and spread from a base key
- **Error handling in mutations** — wrap with try/catch + toast, return boolean
- **`useMemo` for derived data** — problem maps, tag lists, computed stats

---

## Forbidden Patterns

- **Direct storage imports in components**: `import { db } from "@/lib/db"` — use `useProblems()` instead
- **Default exports for components**: Breaks fast refresh and naming consistency
- **`any` type**: Use `unknown` + type narrowing
- **Non-null assertions (`!`)**: Handle null/undefined explicitly
- **Inline business logic in JSX**: Extract to hooks, services, or utility functions
- **Chinese field names outside domain types**: `题目`, `难度` etc. belong only in domain/db types and mappers, not in UI component props

---

## Testing

No automated test framework is configured. Quality is verified through:

1. **`tsc -b`** — TypeScript type checking (run via `npm run build`)
2. **`npm run lint`** — ESLint checks
3. **`npm run build`** — Full build pipeline (generate routes → type check → bundle)

For UI changes, verify manually in the dev server (`npm run dev`). In this repo, do not add or rely on browser/E2E verification from Claude; the user performs final UI validation personally.

---

## Code Review Checklist

- [ ] No direct storage imports — all data access through hooks
- [ ] `npm run generate` run if route files changed
- [ ] `tsc -b` passes with no errors
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds
- [ ] UI changes handed off for user manual verification (do not use Claude-driven browser/E2E checks)
- [ ] Storage mode switching works (local ↔ cloud) if data layer changed
