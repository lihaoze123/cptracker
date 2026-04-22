# Import Embedding Contract

> Executable contract for the CP Tracker userscript handoff into the root app `/import` route.

---

## Scenario: Userscript → `/import` embedded handoff

### 1. Scope / Trigger
- Trigger: the import workflow now crosses two frontend packages: `extension/` userscript shell and root-app `src/routes/import.lazy.tsx`.
- Trigger: the handoff is not a generic UI preference; it is a concrete route/query/message contract that future changes must preserve.

### 2. Signatures
- Userscript iframe URL:
  - `GET /import?source=userscript&embedded=1&url=<current-page-url>`
- Standalone fallback URL:
  - `GET /import?source=userscript&url=<current-page-url>`
- Legacy route compatibility:
  - `GET /import?source=extension&data=<encoded-json>`
- Legacy message compatibility:
  - request message: `{ type: "REQUEST_IMPORT_DATA" }`
  - response message: `{ type: "CPTRACKER_IMPORT_DATA", payload: unknown }`
- Userscript storage key:
  - `GM_getValue("cptracker-app-base-url")`
  - `GM_setValue("cptracker-app-base-url", normalizedBaseUrl)`

### 3. Contracts
- Query fields:
  - `source: string | null`
    - `userscript` means current URL comes from the OJ page and the page should act as manual import UI.
    - `extension` is legacy compatibility only and may prefill fields from `data`/`postMessage`.
  - `embedded: "1" | null`
    - `"1"` means the route is rendered inside the userscript iframe and must avoid duplicate outer page chrome.
  - `url: string | null`
    - When present, becomes the initial value for `题目`.
  - `data: string | null`
    - Legacy JSON payload, parsed defensively for prefilling only.
- Manual-entry rule:
  - The current OJ page contributes only the current URL.
  - All other fields (`题目名称`, `难度`, `关键词`, `题解`, `日期`) are user-authored form values.
- Persistence rule:
  - Route components must submit through `useProblems().addProblems()`.
  - Route components must not import `db.ts` or storage backends directly.
- Embedded rendering rule:
  - `embedded=1` renders form content sized for an iframe.
  - Do not duplicate userscript-shell title/help text/card chrome inside the embedded route.
  - Do not introduce nested fixed-height scroll containers around the embedded form body.
- Success-state rule:
  - Embedded success UI must provide a way to verify the result from outside the iframe flow.
  - Keep at least one action that opens the main app directly.

### 4. Validation & Error Matrix
| Condition | Expected behavior |
|---|---|
| Userscript base URL is empty | Show URL settings UI instead of iframe |
| Userscript base URL is invalid | `createImportUrl()` returns empty string; do not crash |
| `url` query param is missing | Open the manual form with blank `题目` |
| `data` query param is malformed JSON | Ignore payload and keep safe defaults |
| `postMessage` payload is malformed | Ignore unknown fields and keep safe defaults |
| `embedded=1` | Render iframe-friendly layout only |
| Submit succeeds | Switch from editing state to success state |
| Submit fails | Stay in editing state; rely on existing mutation error handling |
| Legacy payload contains `code` and optional `language` | Convert to fenced markdown and prefill `题解` |

### 5. Good / Base / Bad Cases
- Good:
  - Userscript opens `/import?source=userscript&embedded=1&url=https%3A%2F%2Fcodeforces.com%2F...`
  - The form shows that URL in `题目`, other fields remain editable and user-controlled.
  - Submit uses `useProblems()` and success UI offers `打开 CP Tracker`.
- Base:
  - User opens `/import` directly with no query params.
  - The same shared form renders with empty defaults and normal standalone layout.
- Bad:
  - Userscript parses OJ-specific title/rating/tags itself and silently writes them into storage.
  - `src/routes/import.lazy.tsx` imports `addProblem` from `@/lib/db`.
  - Embedded route renders the same explanatory header as the userscript shell, causing duplicated chrome.
  - Embedded route wraps the shared form in another fixed-height card scroll area, causing broken layout.

### 6. Tests Required
- Manual verification:
  - Open `/import?source=userscript&url=<oj-url>` and assert the shared form renders instead of legacy auto-import status UI.
  - Open `/import?source=userscript&embedded=1&url=<oj-url>` inside the userscript flow and assert there is no duplicated shell header/help text.
  - Submit a problem from embedded mode and assert the success state is visually centered and offers a direct app-open action.
- Static checks:
  - Run `npm run generate` after route changes.
  - Run root app `npm run lint`.
  - Run root app `npm run build`.
  - Run `extension/` `npm run build`.
- Assertion points:
  - `题目` initializes from query/message input.
  - Other fields are not auto-derived from OJ-specific scraping.
  - No direct storage import is added to route components.
  - Embedded mode uses shared form fields without duplicated outer chrome.

### 7. Wrong vs Correct
#### Wrong
```tsx
// src/routes/import.lazy.tsx
import { addProblem } from "@/lib/db";

useEffect(() => {
  void addProblem(parsedPayload);
}, [parsedPayload]);
```

#### Correct
```tsx
const { addProblems } = useProblems();

const form = useProblemForm({
  mode: "add",
  initialValues,
  onSubmit: async (data) => addProblems([data]),
});
```

#### Wrong
```tsx
return (
  <Card>
    <CardHeader>
      <CardTitle>Import Problem</CardTitle>
      <CardDescription>当前页面链接会自动带入...</CardDescription>
    </CardHeader>
    <ProblemFormFields form={form} />
  </Card>
);
```

#### Correct
```tsx
return (
  <div className="flex h-full min-h-0 flex-col bg-background text-foreground">
    <div className="min-h-0 flex-1 overflow-y-auto">
      <ProblemFormFields form={form} embedded />
    </div>
    <div className="flex justify-end border-t px-6 py-4">...</div>
  </div>
);
```
