/**
 * 难度相关数据分析服务
 * 包括难度分布、平均难度、最难题目等
 */

import type { SolvedProblem } from "@/data/mock";
import {
  getDifficultyLevel,
  DIFFICULTY_COLORS,
  DIFFICULTY_LABELS,
} from "@/components/problem-heatmaps";
import type { DifficultyData } from "@/lib/year-review/types";

/**
 * 计算难度分布
 */
export function calculateDifficultyBreakdown(
  problems: SolvedProblem[]
): DifficultyData[] {
  const levelCounts = new Map<number, number>();

  problems.forEach((p) => {
    if (!p.难度) return;
    const rating = parseInt(p.难度, 10);
    if (isNaN(rating)) return;

    const level = getDifficultyLevel(rating);
    levelCounts.set(level, (levelCounts.get(level) || 0) + 1);
  });

  const total = Array.from(levelCounts.values()).reduce(
    (sum, count) => sum + count,
    0
  );

  const breakdown: DifficultyData[] = [];
  for (let level = 1; level <= 9; level++) {
    const count = levelCounts.get(level) || 0;
    if (count > 0) {
      breakdown.push({
        level: DIFFICULTY_LABELS[level - 1],
        levelNum: level,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
        color: DIFFICULTY_COLORS[level - 1],
      });
    }
  }

  return breakdown.sort((a, b) => b.count - a.count);
}

/**
 * 计算平均难度
 */
export function calculateAvgDifficulty(problems: SolvedProblem[]): number {
  const ratings = problems
    .map((p) => (p.难度 ? parseInt(p.难度, 10) : null))
    .filter((r): r is number => r !== null && !isNaN(r));

  if (ratings.length === 0) return 0;

  return Math.round(ratings.reduce((sum, r) => sum + r, 0) / ratings.length);
}

/**
 * 获取最难的题目
 */
export function getHardestProblems(
  problems: SolvedProblem[],
  limit: number = 5
): SolvedProblem[] {
  return problems
    .filter((p) => p.难度 && !isNaN(parseInt(p.难度, 10)))
    .sort((a, b) => {
      const ratingA = parseInt(a.难度!, 10);
      const ratingB = parseInt(b.难度!, 10);
      return ratingB - ratingA;
    })
    .slice(0, limit);
}

/**
 * 计算月度进展（包含难度分布）
 */
export function calculateMonthlyProgress(
  problems: SolvedProblem[],
  year: number
): Array<{
  month: string;
  monthNum: number;
  count: number;
  byDifficulty: Record<string, number>;
}> {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const monthData = monthNames.map((month, index) => ({
    month,
    monthNum: index + 1,
    count: 0,
    byDifficulty: {} as Record<string, number>,
  }));

  function parseDate(dateStr: string): Date | null {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  }

  problems.forEach((p) => {
    const date = parseDate(p.日期);
    if (!date || date.getFullYear() !== year) return;

    const monthIndex = date.getMonth();
    monthData[monthIndex].count++;

    // 跟踪难度分布
    if (p.难度) {
      const rating = parseInt(p.难度, 10);
      if (!isNaN(rating)) {
        const level = getDifficultyLevel(rating);
        const levelLabel = DIFFICULTY_LABELS[level - 1];
        monthData[monthIndex].byDifficulty[levelLabel] =
          (monthData[monthIndex].byDifficulty[levelLabel] || 0) + 1;
      }
    }
  });

  return monthData;
}
