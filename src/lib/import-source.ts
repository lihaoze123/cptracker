import type { ProblemFormInitialValues } from "@/components/features/forms/hooks/use-problem-form";
import type { ProblemInput } from "@/types/domain.types";

interface LegacyImportData {
  url?: string;
  name?: string;
  rating?: number;
  tags?: string[] | string;
  code?: string;
  language?: string;
  solvedTime?: number;
}

export interface ImportRouteState {
  source: string | null;
  embedded: boolean;
  handoff: boolean;
  requestId: string | null;
  initialValues: ProblemFormInitialValues;
}

export const REQUEST_IMPORT_DATA_MESSAGE = "REQUEST_IMPORT_DATA";
export const IMPORT_DATA_MESSAGE = "CPTRACKER_IMPORT_DATA";
export const IMPORT_HANDOFF_SOURCE = "userscript";
export const IMPORT_HANDOFF_READY_MESSAGE = "CPTRACKER_IMPORT_HANDOFF_READY";
export const IMPORT_HANDOFF_SUBMIT_MESSAGE = "CPTRACKER_IMPORT_HANDOFF_SUBMIT";
export const IMPORT_HANDOFF_RESULT_MESSAGE = "CPTRACKER_IMPORT_HANDOFF_RESULT";

export interface ImportHandoffReadyMessage {
  type: typeof IMPORT_HANDOFF_READY_MESSAGE;
  source: typeof IMPORT_HANDOFF_SOURCE;
  requestId: string;
}

export interface ImportHandoffSubmitMessage {
  type: typeof IMPORT_HANDOFF_SUBMIT_MESSAGE;
  source: typeof IMPORT_HANDOFF_SOURCE;
  requestId: string;
  payload: ProblemInput;
}

export interface ImportHandoffResultMessage {
  type: typeof IMPORT_HANDOFF_RESULT_MESSAGE;
  source: typeof IMPORT_HANDOFF_SOURCE;
  requestId: string;
  success: boolean;
  importedProblemName?: string;
  error?: string;
}

function parseLegacyPayload(payload: unknown): ProblemFormInitialValues {
  if (!payload || typeof payload !== "object") {
    return {};
  }

  const data = payload as LegacyImportData;
  const tags = Array.isArray(data.tags)
    ? data.tags.join(", ")
    : typeof data.tags === "string"
      ? data.tags
      : "";

  return {
    题目: typeof data.url === "string" ? data.url : "",
    题目名称: typeof data.name === "string" ? data.name : "",
    难度: typeof data.rating === "number" ? String(data.rating) : "",
    关键词: tags,
    题解:
      typeof data.code === "string" && data.code.trim()
        ? `\`\`\`${typeof data.language === "string" && data.language ? data.language : "cpp"}\n${data.code}\n\`\`\``
        : "",
    日期: typeof data.solvedTime === "number" ? data.solvedTime : undefined,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === "string";
}

function isProblemInputPayload(value: unknown): value is ProblemInput {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.题目 === "string" &&
    isOptionalString(value.题目名称) &&
    isOptionalString(value.难度) &&
    typeof value.题解 === "string" &&
    typeof value.关键词 === "string" &&
    typeof value.日期 === "number" &&
    Number.isFinite(value.日期)
  );
}

export function parseImportRouteState(search: URLSearchParams): ImportRouteState {
  const url = search.get("url")?.trim() ?? "";
  const source = search.get("source");
  const embedded = search.get("embedded") === "1";
  const handoff = search.get("handoff") === "1";
  const requestId = search.get("requestId")?.trim() || null;
  const initialValues: ProblemFormInitialValues = {
    题目: url,
  };

  const dataParam = search.get("data");
  if (!dataParam) {
    return { source, embedded, handoff, requestId, initialValues };
  }

  try {
    const decoded = JSON.parse(decodeURIComponent(atob(dataParam)));
    const legacyValues = parseLegacyPayload(decoded);
    return {
      source,
      embedded,
      handoff,
      requestId,
      initialValues: {
        ...initialValues,
        ...legacyValues,
        题目: url || legacyValues.题目 || "",
      },
    };
  } catch {
    return { source, embedded, handoff, requestId, initialValues };
  }
}

export function parseImportMessagePayload(payload: unknown): ProblemFormInitialValues {
  return parseLegacyPayload(payload);
}

export function createImportHandoffReadyMessage(requestId: string): ImportHandoffReadyMessage {
  return {
    type: IMPORT_HANDOFF_READY_MESSAGE,
    source: IMPORT_HANDOFF_SOURCE,
    requestId,
  };
}

export function createImportHandoffSubmitMessage(
  requestId: string,
  payload: ProblemInput
): ImportHandoffSubmitMessage {
  return {
    type: IMPORT_HANDOFF_SUBMIT_MESSAGE,
    source: IMPORT_HANDOFF_SOURCE,
    requestId,
    payload,
  };
}

export function createImportHandoffResultMessage(
  requestId: string,
  success: boolean,
  options?: { importedProblemName?: string; error?: string }
): ImportHandoffResultMessage {
  return {
    type: IMPORT_HANDOFF_RESULT_MESSAGE,
    source: IMPORT_HANDOFF_SOURCE,
    requestId,
    success,
    importedProblemName: options?.importedProblemName,
    error: options?.error,
  };
}

export function isImportHandoffReadyMessage(value: unknown): value is ImportHandoffReadyMessage {
  return (
    isRecord(value) &&
    value.type === IMPORT_HANDOFF_READY_MESSAGE &&
    value.source === IMPORT_HANDOFF_SOURCE &&
    typeof value.requestId === "string"
  );
}

export function isImportHandoffSubmitMessage(value: unknown): value is ImportHandoffSubmitMessage {
  return (
    isRecord(value) &&
    value.type === IMPORT_HANDOFF_SUBMIT_MESSAGE &&
    value.source === IMPORT_HANDOFF_SOURCE &&
    typeof value.requestId === "string" &&
    isProblemInputPayload(value.payload)
  );
}

export function isImportHandoffResultMessage(value: unknown): value is ImportHandoffResultMessage {
  return (
    isRecord(value) &&
    value.type === IMPORT_HANDOFF_RESULT_MESSAGE &&
    value.source === IMPORT_HANDOFF_SOURCE &&
    typeof value.requestId === "string" &&
    typeof value.success === "boolean" &&
    isOptionalString(value.importedProblemName) &&
    isOptionalString(value.error)
  );
}
