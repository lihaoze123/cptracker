# State Management

> How state is managed in this project.

---

## Overview

State is split across four categories, each with a dedicated tool:

| Category | Tool | Purpose |
|----------|------|---------|
| Server state | TanStack Query | Problems data, caching, mutations |
| Global client state | Zustand | Auth, storage mode, UI state |
| Local component state | `useState` / `useReducer` | Form inputs, toggle flags |
| URL state | nuqs | Table pagination, filters, sort |

---

## State Categories

### Server State — TanStack Query

All problem data flows through `useProblems()` hook. Never call `db.ts` or `supabase/database.ts` directly from components.

```tsx
// src/hooks/use-problems-queries.ts
const { data: problems = [], isLoading, addProblems, updateProblem } = useProblems();
```

Key patterns:
- **Query keys**: `["problems"]` with storage-mode suffix (`"local"` / `"cloud"`)
- **Cache invalidation**: `queryClient.invalidateQueries({ queryKey: PROBLEMS_QUERY_KEY })` on every mutation success
- **Optimistic lookups**: `useMemo` + `Map` for O(1) problem lookups by ID

### Global Client State — Zustand

Two stores, both use `devtools` middleware:

- **`useAuthStore`** (`src/stores/auth-store.ts`): Auth state, storage mode. Uses `persist` middleware to save `storageMode` to localStorage. Lazy-loads Supabase only in cloud mode.
- **`useUIStore`** (`src/stores/ui-store.ts`): Dialog/sheet open states, selected year, filter state. Not persisted.

```tsx
// Store pattern: interface → create → devtools
export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({ /* state + actions */ }),
      { name: 'cptracker-auth', partialize: (state) => ({ storageMode: state.storageMode }) }
    ),
    { name: 'AuthStore' }
  )
);
```

### URL State — nuqs

Used for TanStack Table state (pagination, sorting, filters). Type-safe search params via `nuqs`.

### Local State — React hooks

Form state, component-level toggles, derived data via `useMemo`.

---

## When to Use Global State

State goes to Zustand when:
- Multiple unrelated components need it (auth, storage mode)
- It survives navigation (UI panel states, selected year)
- It needs devtools inspection

State stays local when:
- Only one component uses it (form inputs, hover states)
- It's derived from props or server state

---

## Derived State

Use `useMemo` for expensive computations on server state:

```tsx
// O(1) lookup map from problems array
const problemMap = useMemo(() => {
  const map = new Map<number, SolvedProblem>();
  problems.forEach((p) => map.set(p.id, p));
  return map;
}, [problems]);

// Unique tags from all problems
const allTags = useMemo(() => {
  const tagSet = new Set<string>();
  problems.forEach((p) => p.关键词.split(",").forEach((t) => tagSet.add(t.trim())));
  return Array.from(tagSet).sort();
}, [problems]);
```

---

## Common Mistakes

- **Do NOT duplicate server state in Zustand** — TanStack Query is the cache; don't copy `problems` into a store
- **Do NOT import storage backends directly** — always go through `useProblems()` hook
- **Do NOT forget `partialize`** when using `persist` — only persist what's needed (e.g., `storageMode`, not the whole auth state)
- **Do NOT create Zustand stores for feature-local state** — use `useState` for component-scoped state
