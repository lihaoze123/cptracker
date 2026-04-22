# Hook Guidelines

> Custom hook patterns and conventions used in this project.

---

## Overview

Hooks are the primary data access layer. Server state is managed via TanStack Query hooks (`useProblems`). UI logic hooks encapsulate form handling, column definitions, and table state.

---

## Hook Organization

| Location | Purpose | Examples |
|----------|---------|----------|
| `src/hooks/` | Shared hooks used across features | `use-problems-queries.ts`, `use-data-table.ts`, `use-toast.ts` |
| `src/components/features/*/hooks/` | Feature-scoped hooks | `use-problem-columns.tsx`, `use-problem-form.ts` |

---

## Naming Conventions

- **Filename**: `use-<name>.ts` (kebab-case with `use-` prefix)
- **Export**: `use<Name>` (camelCase) — e.g., `use-problems-queries.ts` → `useProblems`
- **Query hooks**: Named after the entity — `useProblems()`, not `useProblemsQuery()`
- **Mutation hooks**: Named after the action — `useProblemMutation<T>()`

---

## Data Fetching Pattern

The main data hook (`useProblems`) follows this pattern:

1. Read `storageMode` from `useAuthStore()`
2. Create TanStack Query with storage-mode-aware `queryFn`
3. Create mutations with storage-mode-aware `mutationFn`
4. Wrap mutations in `useCallback` with error handling + toast notifications
5. Return a flat object with data, loading state, and action functions

```tsx
// src/hooks/use-problems-queries.ts
export function useProblems() {
  const { storageMode, user } = useAuthStore();
  const queryClient = useQueryClient();
  const isCloudMode = storageMode === "cloud" && user !== null;

  const { data: problems = [], isLoading } = useQuery({
    queryKey: [...PROBLEMS_QUERY_KEY, isCloudMode ? "cloud" : "local"],
    queryFn: async () => { /* storage-mode-aware fetch */ },
  });

  // Mutations wrap storage operations...
  // useCallback wrappers with toast error handling...

  return {
    problems, isLoading, isCloudMode,
    addProblems, updateProblem, deleteProblem, /* ... */
  };
}
```

---

## Query Key Convention

```tsx
const PROBLEMS_QUERY_KEY = ["problems"] as const;
// Scoped variants:
[...PROBLEMS_QUERY_KEY, isCloudMode ? "cloud" : "local"]
```

Always use `as const` for query keys. Invalidate on mutation success.

---

## Mutation Error Handling Pattern

Mutations are wrapped in `useCallback` with consistent error handling:

```tsx
const addProblems = useCallback(async (newProblems: ProblemInput[]) => {
  try {
    await addProblemsMutation.mutateAsync(newProblems);
    return true;
  } catch (err) {
    toast({
      title: "添加失败",
      description: err instanceof Error ? err.message : "添加题目时发生错误",
      variant: "destructive",
    });
    return false;
  }
}, [addProblemsMutation]);
```

All mutation wrappers return `boolean` — `true` on success, `false` on error.

---

## Feature Hooks

Feature-scoped hooks live alongside their components:

```tsx
// src/components/features/problems/hooks/use-problem-columns.tsx
export function useProblemColumns({ readOnly, onEdit, ownerUsername }: Options = {}) {
  return useMemo<ColumnDef<SolvedProblem>[]>(() => {
    // Assemble column definitions
  }, [readOnly, onEdit, ownerUsername]);
}
```

```tsx
// src/components/features/forms/hooks/use-problem-form.ts
export function useProblemForm({ mode, onSubmit, onSheetOpen }: Options) {
  // Form state, validation, submission logic
  return { formData, errors, handleChange, handleSubmit, isSubmitting, allTags, reset };
}
```

---

## Common Mistakes

- **Do NOT create new query instances** — use the existing `useProblems()` hook
- **Do NOT call hooks conditionally** — always call at the top level
- **Do NOT skip `useMemo`/`useCallback`** for expensive computations or callback props passed to memoized children
- **Do NOT put toast/UI logic in `mutationFn`** — keep `mutationFn` pure, add toast in the wrapper
