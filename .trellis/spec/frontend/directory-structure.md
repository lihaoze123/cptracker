# Directory Structure

> How frontend code is organized in this project.

---

## Overview

Single-page application using TanStack Router file-based routing. The codebase follows a layered architecture: routes → components → hooks/services → lib/stores → types. Chinese field names are used in domain types (e.g., `题目`, `难度`) to match the competitive programming domain.

---

## Directory Layout

```
src/
├── routes/                    # TanStack Router file-based routes
│   ├── __root.tsx             # Root layout with providers
│   ├── index.tsx              # Dashboard (/)
│   ├── auth.tsx               # Auth page (/auth)
│   ├── year-review.tsx        # Fullscreen year review
│   └── $username/             # Dynamic user profile routes
│       ├── index.lazy.tsx     # Public profile (code-split)
│       └── solutions/         # Solution sharing redirects
├── components/
│   ├── ui/                    # Shadcn/ui primitives (Button, Sheet, Dialog, etc.)
│   ├── data-table/            # Generic TanStack Table components
│   ├── features/              # Feature-scoped components
│   │   ├── charts/            # Statistics charts (activity, rating)
│   │   ├── forms/             # Form components and hooks
│   │   │   └── hooks/         # Form-specific hooks (use-problem-form)
│   │   ├── problems/          # Problem table feature
│   │   │   ├── columns/       # Individual column components
│   │   │   └── hooks/         # Column assembly hook
│   │   └── settings/          # Settings sheet sections
│   ├── year-review/           # Year review feature
│   │   └── slides/            # Individual slide components
│   ├── *.tsx                  # Page-level composite components
│   └── *.tsx                  # Shared feature components (oj-import, csv-toolbar)
├── hooks/                     # Shared React hooks
├── stores/                    # Zustand stores (auth-store, ui-store)
├── lib/                       # Pure utility functions and low-level libs
│   ├── mappers/               # Data mappers (domain ↔ DB models)
│   └── supabase/              # Supabase client and database ops
├── services/                  # Business logic services
│   ├── analytics/             # Statistics calculations
│   └── oj/                    # Online Judge API integrations
├── types/                     # TypeScript type definitions
├── config/                    # App configuration
└── data/                      # Mock data and seed data
```

---

## Module Organization

### Feature-based grouping

Feature components live under `src/components/features/<feature>/`. Each feature directory can contain:
- UI components (`.tsx`)
- Column definitions (`columns/`)
- Feature-specific hooks (`hooks/`)

Examples: `src/components/features/problems/`, `src/components/features/settings/`

### Shared vs feature-scoped

- **Shared hooks** (`src/hooks/`): Reusable across features (e.g., `use-data-table.ts`, `use-toast.ts`)
- **Feature hooks** (`src/components/features/*/hooks/`): Scoped to one feature (e.g., `use-problem-columns.tsx`)
- **Utility functions** (`src/lib/`): Pure functions with no React dependency
- **Services** (`src/services/`): Business logic that may call external APIs

---

## Naming Conventions

- **Files**: kebab-case for all files (e.g., `add-problem-sheet.tsx`, `use-problems-queries.ts`)
- **Components**: PascalCase exports matching filename (e.g., `AddProblemSheet` in `add-problem-sheet.tsx`)
- **Hooks**: `use-` prefix in filename, `use` prefix in export (e.g., `use-problems-queries.ts` → `useProblems`)
- **Stores**: `*-store.ts` suffix (e.g., `auth-store.ts`, `ui-store.ts`)
- **Types**: `*.types.ts` suffix for type-only files (e.g., `domain.types.ts`, `database.types.ts`)
- **Route files**: Follow TanStack Router conventions (`__root.tsx`, `.lazy.tsx` for code-splitting)

---

## Examples

- Well-organized feature module: `src/components/features/problems/` — columns, hooks, all self-contained
- Service layer pattern: `src/services/oj/` — each OJ has its own service file with a shared `oj-types.ts`
- Data mapper pattern: `src/lib/mappers/problem-mapper.ts` — converts between domain and DB models
