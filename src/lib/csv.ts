import Papa from "papaparse";
import type { SolvedProblem } from "@/data/mock";
import { ProblemService } from "@/services/problem-service";

export interface CSVExportOptions {
  problems: SolvedProblem[];
  filename?: string;
}

export interface CSVImportResult {
  success: Omit<SolvedProblem, "id">[];
  errors: { row: number; message: string }[];
}

const CSV_HEADERS = ["题目", "题目名称", "难度", "题解", "关键词", "日期"] as const;

export function exportToCSV({
  problems,
  filename = `problems-${new Date().toISOString().split("T")[0]}.csv`,
}: CSVExportOptions): void {
  const data = problems.map((p) => ({
    题目: p.题目,
    题目名称: p.题目名称 || "",
    难度: p.难度 || "",
    题解: p.题解,
    关键词: p.关键词,
    日期: p.日期,
  }));

  const csv = Papa.unparse(data, {
    header: true,
    columns: CSV_HEADERS as unknown as string[],
  });

  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function parseCSV(file: File): Promise<CSVImportResult> {
  return new Promise((resolve) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      encoding: "UTF-8",
      complete: (results) => {
        const success: Omit<SolvedProblem, "id">[] = [];
        const errors: { row: number; message: string }[] = [];

        results.data.forEach((row, index) => {
          const rowNum = index + 2; // +2 because of header and 0-index

          // Validate required fields
          if (!row.题目?.trim()) {
            errors.push({ row: rowNum, message: "缺少题目字段" });
            return;
          }

          // Validate difficulty if provided
          const difficulty = row.难度?.trim();
          if (difficulty && !/^\d+$/.test(difficulty)) {
            errors.push({ row: rowNum, message: "难度必须是数字" });
            return;
          }

          // 使用统一的标签服务规范化标签
          const normalizedTags = ProblemService.normalizeTags(row.关键词?.trim() || "");

          success.push({
            题目: row.题目.trim(),
            题目名称: row.题目名称?.trim() || undefined,
            难度: difficulty || undefined,
            题解: row.题解?.trim() || "",
            关键词: normalizedTags,
            日期: row.日期?.trim() || (() => {
              const iso = new Date().toISOString();
              return `${iso.slice(0, 4)}/${iso.slice(5, 7)}/${iso.slice(8, 10)} ${iso.slice(11, 19)}`;
            })(),
          });
        });

        resolve({ success, errors });
      },
      error: (error) => {
        resolve({
          success: [],
          errors: [{ row: 0, message: `解析失败: ${error.message}` }],
        });
      },
    });
  });
}

export function generateCSVTemplate(): void {
  const templateData = [
    {
      题目: "https://codeforces.com/contest/1234/problem/A",
      题目名称: "Example Problem",
      难度: "1600",
      题解: "https://github.com/user/solutions/1234A.cpp",
      关键词: "DP, 贪心",
      日期: "2025/01/01 10:00:00",
    },
  ];

  const csv = Papa.unparse(templateData, {
    header: true,
    columns: CSV_HEADERS as unknown as string[],
  });

  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "problems-template.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
