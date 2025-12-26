/**
 * 时间相关数据分析服务
 * 包括速度、连续性、星期、小时等时间维度的统计
 */

import type { SolvedProblem } from "@/data/mock";
import type { VelocityDataPoint } from "@/lib/year-review/types";

/**
 * 从时间戳创建 Date 对象
 */
function parseDate(timestamp: number): Date | null {
  const date = new Date(timestamp);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * 从时间戳中提取小时
 */
function extractHour(timestamp: number): number {
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return -1;
  return date.getHours();
}

/**
 * 计算速度数据（每日题目数量）
 */
export function calculateVelocityData(
  problems: SolvedProblem[],
  year: number
): VelocityDataPoint[] {
  const dateCounts = new Map<string, number>();

  problems.forEach((p) => {
    const date = parseDate(p.日期);
    if (!date || date.getFullYear() !== year) return;

    const dateStr = date.toISOString().split("T")[0]; // "yyyy-mm-dd"
    dateCounts.set(dateStr, (dateCounts.get(dateStr) || 0) + 1);
  });

  // 生成年中所有日期
  const velocityData: VelocityDataPoint[] = [];
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0];
    velocityData.push({
      date: dateStr,
      count: dateCounts.get(dateStr) || 0,
    });
  }

  return velocityData;
}

/**
 * 计算最长连续打卡天数
 */
export function calculateLongestStreak(problems: SolvedProblem[]): number {
  if (problems.length === 0) return 0;

  const dates = problems
    .map((p) => parseDate(p.日期))
    .filter((d): d is Date => d !== null)
    .map((d) => d.toISOString().split("T")[0])
    .sort();

  const uniqueDates = Array.from(new Set(dates));

  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < uniqueDates.length; i++) {
    const prevDate = new Date(uniqueDates[i - 1]);
    const currDate = new Date(uniqueDates[i]);
    const diffDays = Math.floor(
      (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return maxStreak;
}

/**
 * 计算星期统计 [周日, 周一, 周二, 周三, 周四, 周五, 周六]
 */
export function calculateWeekdayStats(problems: SolvedProblem[]): number[] {
  const weekdayStats = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat

  problems.forEach((p) => {
    const date = parseDate(p.日期);
    if (!date) return;
    weekdayStats[date.getDay()]++;
  });

  return weekdayStats;
}

/**
 * 获取最忙碌的星期名称
 */
export function getBusiestDay(weekdayStats: number[]): string {
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const maxIndex = weekdayStats.indexOf(Math.max(...weekdayStats));
  return dayNames[maxIndex];
}

/**
 * 计算周末解题百分比
 */
export function calculateWeekendPercentage(weekdayStats: number[]): number {
  const weekendCount = weekdayStats[0] + weekdayStats[6]; // Sun + Sat
  const totalCount = weekdayStats.reduce((sum, count) => sum + count, 0);
  return totalCount > 0 ? (weekendCount / totalCount) * 100 : 0;
}

/**
 * 计算小时统计 [0-23 小时]
 */
export function calculateHourlyStats(problems: SolvedProblem[]): number[] {
  const hourlyStats = new Array(24).fill(0);

  problems.forEach((p) => {
    const hour = extractHour(p.日期);
    if (hour >= 0 && hour < 24) {
      hourlyStats[hour]++;
    }
  });

  return hourlyStats;
}

/**
 * 判断主要解题时间段
 */
export function determineTimeOfDay(hourlyStats: number[]): {
  timeOfDay: string;
  peakHour: number;
} {
  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

  const morning = sum(hourlyStats.slice(6, 12)); // 06-12
  const afternoon = sum(hourlyStats.slice(12, 18)); // 12-18
  const evening = sum(hourlyStats.slice(18, 22)); // 18-22
  const night = sum([...hourlyStats.slice(22, 24), ...hourlyStats.slice(0, 6)]); // 22-06

  const max = Math.max(morning, afternoon, evening, night);
  let timeOfDay = "Morning";
  if (max === afternoon) timeOfDay = "Afternoon";
  else if (max === evening) timeOfDay = "Evening";
  else if (max === night) timeOfDay = "Night";

  const peakHour = hourlyStats.indexOf(Math.max(...hourlyStats));

  return { timeOfDay, peakHour };
}

/**
 * 计算夜间解题百分比 (22:00-06:00)
 */
export function calculateNightPercentage(hourlyStats: number[]): number {
  const nightCount =
    hourlyStats.slice(22, 24).reduce((a, b) => a + b, 0) +
    hourlyStats.slice(0, 6).reduce((a, b) => a + b, 0);
  const totalCount = hourlyStats.reduce((a, b) => a + b, 0);
  return totalCount > 0 ? (nightCount / totalCount) * 100 : 0;
}
