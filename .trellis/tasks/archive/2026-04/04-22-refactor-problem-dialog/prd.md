# Refactor: Replace Add/Edit Problem Sheet with Centered Dialog Card

## Goal

Replace the current side panel Sheet (slide-in from right, `sm:max-w-md`) with a larger, centered dialog/card that provides a more comfortable form-filling experience.

## What I already know

- Current implementation uses the local `Sheet` wrapper in `src/components/ui/sheet.tsx`, which is built on Radix Dialog primitives and animates from the side
- The repo already has a reusable centered `Dialog` wrapper in `src/components/ui/dialog.tsx` with overlay, Escape / outside-click close behavior, and a built-in close button
- `add-problem-sheet.tsx` and `edit-problem-sheet.tsx` are near-identical, both use `SheetContent` with `sm:max-w-md`
- Form fields: Problem URL (textarea), Problem Name, Difficulty, Solution (textarea), Tags (TagsInput), AC Time
- Both share `useProblemForm` hook for logic
- The Sheet's default `sm:max-w-sm` is overridden to `sm:max-w-md` in both components
- Form content area is constrained to `max-h-[calc(100vh-12rem)]` with overflow-y-auto
- `AddProblemSheet` is used with both trigger rendering and controlled open state; `EditProblemSheet` is always controlled from `src/components/problems-table.tsx`
- Existing dialog usage in the repo already uses patterns like `sm:max-w-2xl` plus `max-h-[80vh] overflow-y-auto` for larger modal content

## Assumptions

- User wants a centered modal/dialog instead of a side sheet
- The form fields and validation logic remain the same
- The MVP includes light internal layout polish for the wider dialog surface, but not behavioral changes to the form flow

## Decisions

- **Scope**: Replace the side sheet with a centered dialog and apply light internal spacing/layout polish, while keeping the same fields, logic, and overall workflow
- **Width**: `sm:max-w-xl` (36rem) — balances spaciousness with screen fit

## Requirements

- Replace Sheet with a centered Dialog/Card component
- Larger width than current `sm:max-w-md` for more comfortable editing
- Centered on screen with overlay backdrop
- Preserve all existing form fields, validation, and submission logic
- Maintain add vs edit mode distinction
- Apply light internal layout polish for the wider dialog surface (for example spacing, container padding, and footer layout)
- Smooth open/close animation
- Scrollable content area when form exceeds viewport height

## Acceptance Criteria

- [ ] Add problem opens as a centered dialog/card (not side sheet)
- [ ] Edit problem opens as a centered dialog/card (not side sheet)
- [ ] Dialog is noticeably larger than the previous `sm:max-w-md` sheet
- [ ] All form fields work identically to current implementation
- [ ] URL auto-parsing preview still works
- [ ] Tags input with suggestions still works
- [ ] Add/Edit submission and error handling work correctly
- [ ] Close on Escape key, overlay click, and cancel button
- [ ] Responsive on mobile (full-width on small screens)
- [ ] Lint and typecheck pass

## Definition of Done

- Lint / typecheck / CI green
- No regressions in add/edit functionality
- Mobile-friendly

## Out of Scope

- Changes to form field types or adding new fields
- Changes to useProblemForm hook logic
- Unifying add/edit into a single component (could be a future refactor)
- Structural changes made primarily to prepare for future shared add/edit abstractions
- Extra robustness/UX behavior beyond the current requirement, such as sticky footers or new mobile-specific interaction patterns

## Technical Approach

Use the existing `Dialog` primitives from `src/components/ui/dialog.tsx` to replace the current `Sheet` containers in both add and edit flows. Keep the current form body and `useProblemForm` logic intact, but adjust the dialog width and internal spacing/footer layout to better fit a centered modal surface while preserving controlled-open behavior.

## Decision (ADR-lite)

**Context**: The current side sheet is functional but narrow for a multi-field form, and the repo already includes a reusable centered dialog primitive.
**Decision**: Reuse the existing dialog component and limit the task to a presentation-layer refactor with light layout polish.
**Consequences**: This keeps the change low-risk and avoids behavioral regressions, but it does not address larger future refactors like sharing add/edit markup or adding more advanced modal UX.

## Technical Notes

- Files to modify:
  - `src/components/add-problem-sheet.tsx` → switch container from `Sheet` to `Dialog`
  - `src/components/edit-problem-sheet.tsx` → switch container from `Sheet` to `Dialog`
  - `src/components/problems-table.tsx` likely stays unchanged because the add/edit components already support controlled open state
- `src/components/ui/dialog.tsx` already exists and provides centered modal behavior, overlay, animations, and a close button; no new primitive is needed unless spacing defaults become a blocker
- Existing repo convention for large dialogs is `sm:max-w-2xl max-h-[80vh] overflow-y-auto` (`src/components/solution-dialog.tsx`)
- Sheet and Dialog share the same Radix root semantics, so Escape key and overlay click behavior should carry over naturally
- Current footer layout differs between Sheet and Dialog defaults, so the add/edit action buttons may need explicit layout classes to preserve a good mobile and desktop layout
