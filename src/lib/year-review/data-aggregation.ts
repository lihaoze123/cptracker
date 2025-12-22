import type { SolvedProblem } from "@/data/mock";
import { getDifficultyLevel, DIFFICULTY_COLORS, DIFFICULTY_LABELS } from "@/components/problem-heatmaps";
import { extractProblemInfo } from "@/lib/problem-utils";
import { calculateCPArchetype } from "./archetype-calculation";
import type {
  CPYearReviewData,
  VelocityDataPoint,
  MonthData,
  DifficultyData,
  SourceData,
  TagData,
  AggregateStats,
} from "./types";

// Helper function to parse date
function parseDate(dateStr: string): Date | null {
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

// Extract hour from date string: "2025-04-02 09:10:00" → 9
function extractHour(dateStr: string): number {
  const timePart = dateStr.split(" ")[1]; // "09:10:00"
  if (!timePart) return -1;
  const hour = parseInt(timePart.split(":")[0], 10);
  return isNaN(hour) ? -1 : hour;
}

// Calculate velocity data (daily problem count)
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

  // Generate all dates in the year
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

// Calculate longest streak
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

// Calculate weekday stats [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
export function calculateWeekdayStats(problems: SolvedProblem[]): number[] {
  const weekdayStats = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat

  problems.forEach((p) => {
    const date = parseDate(p.日期);
    if (!date) return;
    weekdayStats[date.getDay()]++;
  });

  return weekdayStats;
}

// Get busiest day name
export function getBusiestDay(weekdayStats: number[]): string {
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const maxIndex = weekdayStats.indexOf(Math.max(...weekdayStats));
  return dayNames[maxIndex];
}

// Calculate weekend percentage
export function calculateWeekendPercentage(weekdayStats: number[]): number {
  const weekendCount = weekdayStats[0] + weekdayStats[6]; // Sun + Sat
  const totalCount = weekdayStats.reduce((sum, count) => sum + count, 0);
  return totalCount > 0 ? (weekendCount / totalCount) * 100 : 0;
}

// Calculate hourly stats [0-23 hours]
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

// Determine time of day
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

// Calculate night percentage (22:00-06:00)
export function calculateNightPercentage(hourlyStats: number[]): number {
  const nightCount = hourlyStats.slice(22, 24).reduce((a, b) => a + b, 0) +
    hourlyStats.slice(0, 6).reduce((a, b) => a + b, 0);
  const totalCount = hourlyStats.reduce((a, b) => a + b, 0);
  return totalCount > 0 ? (nightCount / totalCount) * 100 : 0;
}

// Calculate difficulty breakdown
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

  const total = Array.from(levelCounts.values()).reduce((sum, count) => sum + count, 0);

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

// Calculate source breakdown
export function calculateSourceBreakdown(
  problems: SolvedProblem[]
): SourceData[] {
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

// Calculate top tags
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

// Calculate monthly progress
export function calculateMonthlyProgress(
  problems: SolvedProblem[],
  year: number
): MonthData[] {
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const monthData: MonthData[] = monthNames.map((month, index) => ({
    month,
    monthNum: index + 1,
    count: 0,
    byDifficulty: {},
  }));

  problems.forEach((p) => {
    const date = parseDate(p.日期);
    if (!date || date.getFullYear() !== year) return;

    const monthIndex = date.getMonth();
    monthData[monthIndex].count++;

    // Track difficulty distribution
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

// Calculate average difficulty
export function calculateAvgDifficulty(problems: SolvedProblem[]): number {
  const ratings = problems
    .map((p) => (p.难度 ? parseInt(p.难度, 10) : null))
    .filter((r): r is number => r !== null && !isNaN(r));

  if (ratings.length === 0) return 0;

  return Math.round(
    ratings.reduce((sum, r) => sum + r, 0) / ratings.length
  );
}

// Get hardest problems
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

// User profile info for year review
export interface YearReviewUserInfo {
  username: string;
  displayName?: string;
  avatarHash?: string;
}

// Main aggregation function
export function aggregateYearReviewData(
  allProblems: SolvedProblem[],
  year: number,
  userInfo: YearReviewUserInfo = { username: "Anonymous" }
): CPYearReviewData {
  // Filter problems for the target year
  const problems = allProblems.filter((p) => {
    const date = parseDate(p.日期);
    return date && date.getFullYear() === year;
  });

  // Calculate all metrics
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
  const monthlyProgress = calculateMonthlyProgress(allProblems, year);

  const avgDifficulty = calculateAvgDifficulty(problems);
  const topSource = sourceBreakdown[0]?.source || "Unknown";
  const uniqueTags = topTags.length;
  const platformCount = sourceBreakdown.length;

  // Calculate archetype
  const stats: AggregateStats = {
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
