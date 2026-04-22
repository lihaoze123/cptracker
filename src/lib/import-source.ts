import type { ProblemFormInitialValues } from "@/components/features/forms/hooks/use-problem-form";

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
  initialValues: ProblemFormInitialValues;
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

export function parseImportRouteState(search: URLSearchParams): ImportRouteState {
  const url = search.get("url")?.trim() ?? "";
  const source = search.get("source");
  const embedded = search.get("embedded") === "1";
  const initialValues: ProblemFormInitialValues = {
    题目: url,
  };

  const dataParam = search.get("data");
  if (!dataParam) {
    return { source, embedded, initialValues };
  }

  try {
    const decoded = JSON.parse(decodeURIComponent(atob(dataParam)));
    return {
      source,
      embedded,
      initialValues: {
        ...initialValues,
        ...parseLegacyPayload(decoded),
        题目: url || parseLegacyPayload(decoded).题目 || "",
      },
    };
  } catch {
    return { source, embedded, initialValues };
  }
}

export function parseImportMessagePayload(payload: unknown): ProblemFormInitialValues {
  return parseLegacyPayload(payload);
}
