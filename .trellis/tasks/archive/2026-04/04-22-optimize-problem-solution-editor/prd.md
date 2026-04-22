# Optimize Add/Edit Problem Solution Editor UX

## Goal

Improve the solution editing experience inside the add/edit problem dialogs so writing Markdown-based solutions feels easier, clearer, and closer to the final rendered result.

## What I already know

- The add/edit problem dialogs live in `src/components/add-problem-sheet.tsx` and `src/components/edit-problem-sheet.tsx`.
- Both dialogs share state and submit logic through `src/components/features/forms/hooks/use-problem-form.ts`.
- The current solution editing UI is only a plain `Textarea` bound to `form.formData.题解`.
- The rendered solution viewer already supports Markdown, GFM, math, KaTeX, and code highlighting via `src/components/markdown-renderer.tsx`.
- `src/components/solution-dialog.tsx` lazy-loads the Markdown renderer, which suggests preview can likely reuse the same rendering path without duplicating parsing logic.
- Add/edit dialogs already support card/fullscreen mode, so fullscreen gives us room for a richer editor UX.
- There is copy inconsistency today: edit placeholder says Markdown/math is supported, while add placeholder still suggests a raw URL.
- Current textarea styling in `src/components/ui/textarea.tsx` uses `field-sizing-content min-h-16`, but there is no dedicated preview, editing mode switch, or Markdown affordance.

## Assumptions (temporary)

- The user wants to improve UX, not replace Markdown storage format.
- The MVP should stay within the existing add/edit dialog flow rather than introducing a separate page/editor route.
- Reusing the existing Markdown rendering stack is preferred over adding a new editor dependency unless there is a strong reason.

## Open Questions

- None.

## Requirements (evolving)

- Improve the add/edit problem solution editing experience.
- Use a `Write / Preview` editing flow for the solution field.
- Add lightweight insertion buttons for `code block`, `inline code`, and `math` snippets.
- Keep existing add/edit submit flow and stored data shape unchanged.
- Apply the solution consistently to both add and edit dialogs.
- Preserve Markdown/math compatibility with the current solution renderer.
- Keep the toolbar lightweight rather than exposing a full Markdown action set.

## Acceptance Criteria (evolving)

- [ ] Solution editing is more comfortable than the current plain textarea flow.
- [ ] Add and edit dialogs provide the same `Write / Preview` solution editing experience.
- [ ] Users can insert `code block`, `inline code`, and `math` snippets via lightweight buttons.
- [ ] Preview uses the same Markdown capabilities as the current solution viewer.
- [ ] Existing solution content still renders correctly in the public/internal solution viewer.
- [ ] Form submission behavior and saved data format remain compatible with current code.

## Definition of Done (team quality bar)

- Tests added/updated where appropriate
- Lint / typecheck / CI green
- Docs/notes updated if behavior changes
- Rollout/rollback considered if risky

## Out of Scope (explicit)

- Replacing Markdown with a different persisted format
- Building a standalone rich-text editor with a custom document model
- Changing unrelated add/edit problem fields

## Research Notes

### What the repo already enables

- Existing Markdown renderer already supports the final presentation features users care about: GFM, math, and fenced code blocks.
- Fullscreen mode already exists for the dialogs, so richer editing layouts can be introduced without changing route structure.
- There is no existing reusable tabs/split-preview component in `src/components/ui/` that this flow can directly adopt.

### Constraints from our repo/project

- We should prefer editing existing components over adding heavy new dependencies.
- The rendered viewer is lazy-loaded today to avoid shipping markdown-heavy dependencies in the main bundle before needed.
- Add and edit forms are currently duplicated at the presentation layer, so any UX improvement probably needs to be applied in both places unless we do a small shared extraction.

### Feasible approaches here

**Approach A: Write/Preview tabs** (Chosen)

- How it works: keep a textarea editor, add tabs like `Write` / `Preview`, and reuse the existing Markdown renderer for preview.
- Pros: low-risk, clear mental model, works well in both card and fullscreen modes, minimal dependency cost.
- Cons: cannot view source and rendered result at the same time.

**Approach B: Split editor + live preview**

- How it works: show textarea and rendered preview side by side in fullscreen, stacked on small screens/card mode.
- Pros: strongest authoring feedback loop, best for longer solutions.
- Cons: more layout work, more visual density, harder to make elegant in compact card mode.

**Approach C: Lightweight textarea polish only**

- How it works: keep a single textarea, but improve placeholder/help text, height, markdown hinting, and maybe add template/toolbar shortcuts.
- Pros: smallest change, lowest implementation risk.
- Cons: may feel like only a partial UX improvement because users still cannot preview final rendering.

## Decision (ADR-lite)

**Context**: The current solution field is only a plain textarea, while the display side already supports rich Markdown rendering. The user wants a meaningfully better authoring flow without replacing the existing storage format or moving editing to a new page.
**Decision**: Use a `Write / Preview` flow and include lightweight insertion buttons for `code block`, `inline code`, and `math` in the MVP.
**Consequences**: This gives users fast feedback plus quicker authoring for the highest-frequency题解 structures, while keeping implementation lighter than a full split-view or rich-text editor and avoiding a heavy toolbar.

## Expansion Sweep

### Future evolution

- If solution content grows longer, fullscreen could eventually become the default authoring mode for solution-heavy entries.
- A later iteration could add persisted draft state, keyboard shortcuts, or snippet insertion without changing storage format.

### Related scenarios

- Add and edit should feel identical; otherwise users will learn two authoring experiences for the same field.
- The authoring affordance should stay aligned with the existing solution viewer so users trust what they see.

### Failure & edge cases

- Preview should reflect empty content and partially written Markdown without breaking the dialog.
- Any richer layout must not interfere with form submission, validation, or dialog scrolling.

## Technical Approach

- Extract the solution field UI into a shared editor component used by both add and edit dialogs.
- Keep the underlying value as plain Markdown text bound to `form.formData.题解`.
- Provide a local `Write / Preview` toggle inside the solution field area.
- Reuse the existing Markdown rendering path so preview behavior matches the current solution viewer.
- Add a compact snippet toolbar for `code block`, `inline code`, and `math` insertion.
- Keep the experience usable in both card mode and fullscreen mode without introducing a new route or dependency-heavy editor.

## Technical Notes

- Files inspected:
  - `src/components/add-problem-sheet.tsx`
  - `src/components/edit-problem-sheet.tsx`
  - `src/components/features/forms/hooks/use-problem-form.ts`
  - `src/components/solution-dialog.tsx`
  - `src/components/markdown-renderer.tsx`
- Related prior tasks:
  - `.trellis/tasks/archive/2026-04/04-22-refactor-problem-dialog/prd.md`
  - `.trellis/tasks/archive/2026-04/04-22-problem-sheet-mode-toggle/prd.md`
