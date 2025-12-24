/**
 * @deprecated This file has been reorganized into src/services/analytics/
 * Please import from @/services/analytics instead
 *
 * This file is kept for backward compatibility
 * Most exports are re-exported from the new service modules
 */

import type { SolvedProblem } from "@/data/mock";
import { calculateCPArchetype } from "./archetype-calculation";
import type {
  CPYearReviewData,
  MonthData,
} from "./types";

// 重新导出所有分析函数
export {
  calculateVelocityData,
  calculateLongestStreak,
  calculateWeekdayStats,
  getBusiestDay,
  calculateWeekendPercentage,
  calculateHourlyStats,
  determineTimeOfDay,
  calculateNightPercentage,
  calculateDifficultyBreakdown,
  calculateAvgDifficulty,
  getHardestProblems,
  calculateMonthlyProgress,
  calculateSourceBreakdown,
  calculateTopTags,
} from "@/services/analytics";

/**
 * 用户信息接口（年度回顾用）
 */
export interface YearReviewUserInfo {
  username: string;
  displayName?: string;
  avatarHash?: string;
}

/**
 * 主聚合函数（保留在此文件，因为它协调所有分析函数）
 */
export function aggregateYearReviewData(
  allProblems: SolvedProblem[],
  year: number,
  userInfo: YearReviewUserInfo = { username: "Anonymous" }
): CPYearReviewData {
  // 导入分析函数
  const {
    calculateVelocityData,
    calculateLongestStreak,
    calculateWeekdayStats,
    getBusiestDay,
    calculateWeekendPercentage,
    calculateHourlyStats,
    determineTimeOfDay,
    calculateNightPercentage,
    calculateDifficultyBreakdown,
    calculateAvgDifficulty,
    getHardestProblems,
    calculateMonthlyProgress,
    calculateSourceBreakdown,
    calculateTopTags,
  } = require("@/services/analytics");

  // 解析日期
  function parseDate(timestamp: number): Date | null {
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? null : date;
  }

  // 筛选指定年份的题目
  const problems = allProblems.filter((p) => {
    const date = parseDate(p.日期);
    return date && date.getFullYear() === year;
  });

  // 计算所有指标
  const velocityData = calculateVelocityData(allProblems, year);
  const longestStreak = calculateLongestStreak(problems);
  const weekdayStats = calculateWeekdayStats(problems);
  const busiestDay = getBusiestDay(weekdayStats);
  const weekendPercentage = calculateWeekendPercentage(weekdayStats);

  const hourlyStats = calculateHourlyStats(problems);
  const { timeOfDay, peakHour } = determineTimeOfDay(hourlyStats);
  const nightPercentage = calculateNightPercentage(hourlyStats);

  const difficultyBreakdown = calculateDifficultyBreakdown(problems);
  const sourceBreakdown = calculateSourceBreakdown(problems);
  const topTags = calculateTopTags(problems, 7);
  const hardestProblems = getHardestProblems(problems, 5);
  const monthlyProgress = calculateMonthlyProgress(allProblems, year) as MonthData[];

  const avgDifficulty = calculateAvgDifficulty(problems);
  const topSource = sourceBreakdown[0]?.source || "Unknown";
  const uniqueTags = topTags.length;
  const platformCount = sourceBreakdown.length;

  // 计算原型
  const stats = {
    totalProblems: problems.length,
    longestStreak,
    weekdayStats,
    avgDifficulty,
    uniqueTags,
    platformCount,
    topSource,
    weekendPercentage,
    nightPercentage,
    sourceBreakdown,
  };

  const archetypeResult = calculateCPArchetype(stats);
  const archetype = archetypeResult.name;
  const archetypeDescription = archetypeResult.description;

  return {
    year,
    username: userInfo.username,
    displayName: userInfo.displayName,
    avatarHash: userInfo.avatarHash,
    totalProblems: problems.length,
    longestStreak,
    busiestDay,
    peakHour,
    timeOfDay,
    velocityData,
    weekdayStats,
    hourlyStats,
    monthlyProgress,
    difficultyBreakdown,
    sourceBreakdown,
    topTags,
    hardestProblems,
    archetype,
    archetypeDescription,
    avgDifficulty,
    weekendPercentage,
    nightPercentage,
    topSource,
    uniqueTags,
    platformCount,
  };
}
