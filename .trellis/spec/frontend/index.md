# Frontend Development Guidelines

> Best practices for frontend development in this project.

---

## Overview

This directory contains guidelines for frontend development, documented from actual codebase patterns.

---

## Guidelines Index

| Guide | Description | Status |
|-------|-------------|--------|
| [Directory Structure](./directory-structure.md) | Module organization and file layout | Done |
| [Component Guidelines](./component-guidelines.md) | Component patterns, props, composition | Done |
| [Hook Guidelines](./hook-guidelines.md) | Custom hooks, data fetching patterns | Done |
| [State Management](./state-management.md) | TanStack Query, Zustand, nuqs | Done |
| [Quality Guidelines](./quality-guidelines.md) | ESLint, TypeScript, code review checklist | Done |
| [Type Safety](./type-safety.md) | Domain types, mappers, Zod validation | Done |

---

## Quick Reference

- **Data access**: Always use `useProblems()` hook — never import storage backends directly
- **Styling**: Tailwind CSS v4 + `cn()` utility for class merging
- **Components**: Named exports, shadcn/ui primitives, controlled/uncontrolled pattern
- **State**: TanStack Query (server), Zustand (global client), nuqs (URL), useState (local)
- **Types**: Domain types with Chinese field names, separated from DB types via mappers
- **Routes**: TanStack Router file-based — run `npm run generate` after route changes
