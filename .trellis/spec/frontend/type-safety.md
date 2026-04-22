# Type Safety

> Type safety patterns in this project.

---

## Overview

TypeScript strict mode. The type system enforces a clear separation between domain models, database models, and UI types. Runtime validation uses Zod. Chinese field names in domain types match the competitive programming context.

---

## Type Organization

| File | Purpose |
|------|---------|
| `src/types/domain.types.ts` | Core business entities (`SolvedProblem`, `ProblemInput`, `ProblemUpdate`) |
| `src/types/database.types.ts` | Storage-layer models (`LocalDBProblem`, `SupabaseProblemDB`) |
| `src/types/data-table.ts` | TanStack Table extensions (column meta, row actions) |
| `src/types/error.types.ts` | Error type definitions |
| `src/types/index.ts` | Barrel re-exports |

### Domain → Database type separation

Domain types and database types are distinct. Mappers in `src/lib/mappers/` convert between them:

```
SolvedProblem (domain) ←→ LocalDBProblem (IndexedDB)
SolvedProblem (domain) ←→ SupabaseProblemDB (Supabase)
```

```tsx
// Domain type (src/types/domain.types.ts)
export interface SolvedProblem {
  id: number;
  题目: string;       // Problem URL
  题目名称?: string;  // Problem name
  难度?: string;      // Difficulty rating
  题解: string;       // Solution link
  关键词: string;     // Tags (comma-separated)
  日期: number;       // Unix timestamp ms
  supabase_id?: string;
}

// Derived types using utility patterns
export type ProblemInput = Omit<SolvedProblem, "id">;
export type ProblemUpdate = Partial<SolvedProblem>;
```

---

## Validation

Zod is used for runtime validation of URL search params (via nuqs parsers):

```tsx
// src/lib/parsers.ts
const sortingItemSchema = z.object({
  id: z.string(),
  desc: z.boolean(),
});
```

Zod schemas live alongside the code that uses them (e.g., table parsers in `src/lib/parsers.ts`).

---

## Type Patterns

### Utility types for CRUD operations

```tsx
// Input = domain type without id
export type ProblemInput = Omit<SolvedProblem, "id">;
// Update = all fields optional
export type ProblemUpdate = Partial<SolvedProblem>;
```

### Module augmentation for TanStack Table

```tsx
// src/types/data-table.ts
declare module "@tanstack/react-table" {
  interface ColumnMeta<TData, TValue> {
    label?: string;
    variant?: FilterVariant;
    options?: Option[];
  }
}
```

### Generic parsers with type constraints

```tsx
// src/lib/parsers.ts — generic parser with column ID validation
export const getSortingStateParser = <TData>(columnIds?: string[] | Set<string>) => {
  // Returns ExtendedColumnSort<TData>[] with compile-time column ID checking
};
```

---

## Forbidden Patterns

- **No `any`** — use `unknown` when type is genuinely unknown, then narrow
- **No non-null assertion (`!`)** — handle `null`/`undefined` explicitly
- **No `@ts-ignore`** — fix the type error instead
- **No barrel imports from `@/data/mock`** for types — import from `@/types/` instead (mock re-exports types for convenience but types should come from the canonical source)
