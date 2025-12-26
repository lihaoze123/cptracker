/**
 * 来源和标签相关数据分析服务
 * 包括 OJ 来源分布、标签统计等
 */

import type { SolvedProblem } from "@/data/mock";
import { extractProblemInfo } from "@/lib/problem-utils";
import type { SourceData, TagData } from "@/lib/year-review/types";

/**
 * 计算 OJ 来源分布
 */
export function calculateSourceBreakdown(problems: SolvedProblem[]): SourceData[] {
  const sourceCounts = new Map<string, number>();

  problems.forEach((p) => {
    const info = extractProblemInfo(p.题目);
    const source = info.source || "Other";
    sourceCounts.set(source, (sourceCounts.get(source) || 0) + 1);
  });

  const total = problems.length;

  return Array.from(sourceCounts.entries())
    .map(([source, count]) => ({
      source,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * 计算热门标签
 */
export function calculateTopTags(
  problems: SolvedProblem[],
  limit: number = 7
): TagData[] {
  const tagCounts = new Map<string, number>();

  problems.forEach((p) => {
    if (!p.关键词) return;
    p.关键词.split(",").forEach((tag) => {
      const trimmed = tag.trim();
      if (trimmed) {
        tagCounts.set(trimmed, (tagCounts.get(trimmed) || 0) + 1);
      }
    });
  });

  const total = problems.length;

  return Array.from(tagCounts.entries())
    .map(([tag, count]) => ({
      tag,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
