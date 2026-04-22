# Brainstorm: Optimize Solution Reading and Editing Experience

## Goal

Improve the reading and editing experience for solutions so long-form markdown notes are easier to scan, write, and revisit without changing the underlying data model or submission flow.

## What I already know

- Solution reading currently happens in `src/components/solution-dialog.tsx` via a centered dialog with `sm:max-w-2xl max-h-[80vh] overflow-y-auto`
- The dialog lazy-loads `src/components/markdown-renderer.tsx`, which supports GFM, math, and syntax highlighting
- Public solution links are exposed in the dialog header area when `ownerUsername` and `solutionId` exist
- The current read entry point in the table is a small `Solution` badge from `src/components/features/problems/columns/solution-column.tsx`
- Public solution routes currently redirect back to `/$username?solution=<id>` in `src/routes/$username/solutions/$solutionId.tsx`
- Solution editing currently happens inside the add/edit problem dialogs in `src/components/add-problem-sheet.tsx` and `src/components/edit-problem-sheet.tsx`
- The edit form uses a plain textarea for `题解` with only a placeholder, no preview or writing aids
- The recent archived task `04-22-refactor-problem-dialog` established a pattern of low-risk presentation-layer dialog UX improvements

## Assumptions (temporary)

- This task should stay in the UI/UX layer and avoid changing backend/storage logic
- The user wants to prioritize solution reading comfort over broader problem-form refactors
- The desired visual direction is to match the add problem dialog's card/fullscreen style rather than invent a new modal pattern

## Requirements

- Optimize solution reading first
- Use the same card/fullscreen visual style as the add problem dialog
- Improve long-form reading comfort inside the solution dialog beyond simple visual parity
- Improve typography, spacing hierarchy, and scroll behavior for long markdown content
- Improve markdown reading quality for headings, paragraphs, lists, blockquotes, formulas, and code blocks
- Keep the reading surface comfortable in both card mode and fullscreen mode, including sensible content width
- Improve the visibility/discoverability of the table entry that opens the solution
- Use a more noticeable icon + text badge/button style for the table entry
- Keep existing markdown rendering support intact
- Keep existing add/edit submission flow intact
- Favor low-risk UI refinements over structural product changes unless explicitly desired

## Acceptance Criteria

- [ ] Solution reading UX is noticeably improved
- [ ] Solution dialog visually aligns with the add problem dialog card/fullscreen style
- [ ] The solution dialog supports toggling between card mode and fullscreen mode
- [ ] Long markdown content is easier to read on desktop and mobile
- [ ] Typography and spacing feel more deliberate for long-form reading
- [ ] Headings, paragraphs, lists, formulas, and code blocks have improved readability
- [ ] Fullscreen mode improves immersion without making line length uncomfortable
- [ ] The solution entry in the table is more discoverable than the current small badge
- [ ] The table entry uses a clearer icon + text treatment
- [ ] Existing markdown rendering still works
- [ ] Existing add/edit flows still work
- [ ] Mobile usability does not regress
- [ ] Lint and typecheck pass

## Definition of Done (team quality bar)

- Tests added/updated where appropriate
- Lint / typecheck / CI green
- No regressions in add/edit or solution viewing behavior

## Technical Approach

Refactor `src/components/solution-dialog.tsx` to reuse the same card/fullscreen presentation pattern already established in the add/edit problem dialogs: bordered header, explicit fullscreen toggle, constrained internal scroll area, and more deliberate spacing around the reading surface. Keep the existing lazy markdown rendering and public-link behavior, but improve their visual hierarchy for long-form reading. Update `src/components/features/problems/columns/solution-column.tsx` so the open trigger becomes a more discoverable icon + text badge/button while preserving the same open behavior.

## Decision (ADR-lite)

**Context**: The current solution dialog works, but it feels more generic than the add problem dialog and the table entry is easy to miss.
**Decision**: Reuse the existing card/fullscreen dialog pattern from the problem form flow and pair it with a stronger icon + text trigger in the table.
**Consequences**: This keeps the change low-risk and visually consistent, while stopping short of larger product changes like a dedicated reading page or integrated read/edit workspace.

## Out of Scope (explicit)

- Changing the solution data schema
- Adding backend persistence features unrelated to UI/UX
- Large architectural rewrites unless explicitly chosen
- Building a dedicated solution page instead of the dialog flow
- Adding full markdown editing/preview features in this task

## Technical Notes

- Read surface:
  - `src/components/solution-dialog.tsx`
  - `src/components/features/problems/columns/solution-column.tsx`
  - `src/routes/$username/solutions/$solutionId.tsx`
- Edit surface:
  - `src/components/add-problem-sheet.tsx`
  - `src/components/edit-problem-sheet.tsx`
- Markdown renderer:
  - `src/components/markdown-renderer.tsx`
- Current gaps observed:
  - reading dialog is functional but still fairly generic for long-form notes
  - editing uses a plain textarea with no preview/help/split workflow
  - read and edit experiences are disconnected