# Toggle Problem Sheet Fullscreen/Card

## Goal

Add a fullscreen/card mode capability for the add/edit problem dialog so the form can switch between a compact centered card and a larger fullscreen presentation without changing the underlying add/edit workflow.

## What I already know

- The current add/edit problem UI already uses centered `Dialog` components, not side sheets:
  - `src/components/add-problem-sheet.tsx`
  - `src/components/edit-problem-sheet.tsx`
- Both dialogs currently use the same layout shape and width: `sm:max-w-xl` with a scrollable body and bordered header/footer.
- Add and edit flows share the same form logic through `useProblemForm`, so this task is likely a presentation/state change rather than a form-logic change.
- The dialogs are opened from `src/components/problems-table.tsx`, where open state is still named `addSheetOpen` / `editSheetOpen` even though the UI is now dialog-based.
- The repo already has larger dialog patterns such as `sm:max-w-2xl` in `src/components/solution-dialog.tsx`.
- There is no existing reusable fullscreen dialog pattern in the problem form flow.

## Assumptions (temporary)

- The task is to support two presentation modes for the same add/edit form: centered card and fullscreen.
- The MVP should preserve all existing fields, validation, submission behavior, and close behavior.
- The mode switch will be an explicit manual toggle inside the dialog, not a responsive-only behavior or a persisted user preference.

## Requirements

- Add/edit problem form must support both card mode and fullscreen mode.
- Existing add/edit behavior should stay intact.
- The solution should apply consistently to both add and edit dialogs.
- Users must be able to manually switch the current dialog between card and fullscreen while it is open.
- Each dialog should manage its mode independently while open; add and edit do not need shared mode state.
- The dialog should open in card mode by default.
- The dialog should reset to card mode each time it opens.

## Acceptance Criteria

- [ ] Add problem supports both card and fullscreen presentation.
- [ ] Edit problem supports both card and fullscreen presentation.
- [ ] Users can manually toggle the current dialog between card and fullscreen mode.
- [ ] Add/edit dialogs open in card mode by default.
- [ ] Closing and reopening a dialog resets it to card mode.
- [ ] Toggling modes does not clear form fields or validation state.
- [ ] Form fields, validation, and submit flows behave the same as today.
- [ ] Dialog close behavior still works via Escape, overlay click, and action buttons.

## Expansion Sweep

### Future evolution

- This could later grow into a remembered per-user preference, but that is not required for the MVP.
- If the form gains more fields later, fullscreen mode may become the preferred editing surface.

### Related scenarios

- Add and edit should feel consistent so users do not learn two different dialog behaviors.
- The toggle behavior should fit the existing dialog primitive rather than introducing a separate fullscreen route/page.

### Failure & edge cases

- Toggling modes must not clear form state or interrupt validation errors.
- Fullscreen mode still needs a visible close path and workable scrolling on smaller screens.

## Definition of Done (team quality bar)

- Tests added/updated when appropriate
- Lint / typecheck / CI green
- Docs/notes updated if behavior changes
- Rollout/rollback considered if risky

## Out of Scope (explicit)

- Changing form fields or validation logic
- Refactoring add/edit into a shared component unless needed for this feature
- Unrelated visual redesign outside the problem dialog mode behavior

## Technical Notes

- Relevant files:
  - `src/components/add-problem-sheet.tsx`
  - `src/components/edit-problem-sheet.tsx`
  - `src/components/problems-table.tsx`
  - `src/components/ui/dialog.tsx`
- Related prior task: `.trellis/tasks/archive/2026-04/04-22-refactor-problem-dialog/prd.md`
- Current dialogs are implemented as centered cards with `sm:max-w-xl`, `max-h-[85vh]`, and internal scroll regions.
