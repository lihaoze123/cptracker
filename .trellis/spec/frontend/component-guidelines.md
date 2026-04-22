# Component Guidelines

> How components are built in this project.

---

## Overview

Components use React 19 with TypeScript. UI primitives come from shadcn/ui (built on Radix). Icons use `@hugeicons/react` with `@hugeicons/core-free-icons`. Styling is Tailwind CSS v4 with `cn()` utility for class merging.

---

## Component Structure

Function components with named exports. No default exports. Each component in its own file.

```tsx
// src/components/add-problem-sheet.tsx
export function AddProblemSheet({ onAdd, open, onOpenChange }: AddProblemSheetProps) {
  // hooks at top
  const form = useProblemForm({ ... });
  // derived state
  const parsedProblem = useMemo(() => { ... }, [form.formData.题目]);
  // render
  return ( ... );
}
```

Props interface defined immediately above the component:

```tsx
interface AddProblemSheetProps {
  onAdd: (problem: Omit<SolvedProblem, "id">) => Promise<boolean>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}
```

---

## Props Conventions

- **Optional props** use `?` with `undefined` as implicit default
- **Callback props** named `on<Action>` (e.g., `onAdd`, `onEdit`, `onOpenChange`)
- **Boolean props** prefixed with `is`/`has` (e.g., `isLoading`, `readOnly`)
- **Controlled/uncontrolled pattern**: Accept optional `open` + `onOpenChange`; fall back to internal `useState` when uncontrolled (see `AddProblemSheet`)

```tsx
export function AddProblemSheet({ onAdd, open: controlledOpen, onOpenChange }: AddProblemSheetProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (onOpenChange ?? (() => {})) : setInternalOpen;
```

---

## Styling Patterns

- **Tailwind CSS v4** with `@tailwindcss/vite` plugin — no `tailwind.config` file
- **Class merging**: Use `cn()` from `src/lib/utils.ts` (combines `clsx` + `tailwind-merge`)
- **Variants**: Use `class-variance-authority` (CVA) for component variants — standard shadcn pattern
- **Layout**: CSS Grid (`grid gap-2`) for form fields, Flexbox for toolbar/alignment
- **Responsive**: Shadcn `Sheet` slides in from side; responsive widths via `sm:max-w-md`

```tsx
// cn() for conditional classes
<Button variant="outline" size="sm" className="h-8">
// Grid layout for form sections
<div className="grid flex-1 auto-rows-min gap-4 px-4 py-4 overflow-y-auto">
```

---

## Accessibility

- All interactive elements use shadcn/ui components which include ARIA attributes
- Form labels use `<Label htmlFor="...">` linked to inputs
- Checkboxes include `aria-label` for selection (see `use-problem-columns.tsx`)
- Error messages shown via `<p className="text-xs text-destructive">` below inputs

---

## Common Mistakes

- **Do NOT import `db.ts` or `supabase/database.ts` directly in components** — always use `useProblems()` hook
- **Do NOT use default exports** for components — always named exports
- **Do NOT inline complex logic in JSX** — extract to hooks or utility functions
- **Do NOT put business logic in components** — delegate to services (e.g., `ProblemService`)
