import type { SolvedProblem } from "@/data/mock";

// Main data structure for year review
export interface CPYearReviewData {
  year: number;
  username: string;
  displayName?: string;
  avatarHash?: string;
  totalProblems: number;
  longestStreak: number;
  busiestDay: string; // e.g., "周日"
  peakHour: number; // 0-23
  timeOfDay: string; // "早晨" | "下午" | "傍晚" | "深夜"

  // Chart data
  velocityData: VelocityDataPoint[];
  weekdayStats: number[]; // [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
  hourlyStats: number[]; // [0-23 hours]
  monthlyProgress: MonthData[];

  // Breakdowns
  difficultyBreakdown: DifficultyData[];
  sourceBreakdown: SourceData[];
  topTags: TagData[];

  // Highlights
  hardestProblems: SolvedProblem[];
  archetype: string;
  archetypeDescription: string;

  // Additional stats
  avgDifficulty: number;
  weekendPercentage: number;
  nightPercentage: number;
  topSource: string;
  uniqueTags: number;
  platformCount: number;
}

// Velocity data point (for line chart)
export interface VelocityDataPoint {
  date: string; // "yyyy-mm-dd"
  count: number;
}

// Monthly progress data
export interface MonthData {
  month: string; // "Jan", "Feb", etc.
  monthNum: number; // 1-12
  count: number;
  byDifficulty: Record<string, number>; // difficulty level -> count
}

// Difficulty breakdown data
export interface DifficultyData {
  level: string; // e.g., "1600-1899"
  levelNum: number; // 1-9
  count: number;
  percentage: number;
  color: string; // hex color
}

// Source breakdown data
export interface SourceData {
  source: string; // "Codeforces", "AtCoder", etc.
  count: number;
  percentage: number;
}

// Tag data
export interface TagData {
  tag: string;
  count: number;
  percentage: number;
}

// Archetype result
export interface ArchetypeResult {
  name: string;
  description: string;
  icon?: string; // Optional icon name
}

// Slide types constants
export const CPSlideType = {
  TITLE: 0,
  VELOCITY: 1,
  GRID: 2,
  COMPOSITION: 3,
  ROUTINE: 4,
  PRODUCTIVITY: 5,
  PROGRESS: 6,
  SOURCES: 7,
  TOPICS: 8,
  ARCHETYPE: 9,
  POSTER: 10,
} as const;

// Stats for archetype calculation
export interface AggregateStats {
  totalProblems: number;
  longestStreak: number;
  weekdayStats: number[];
  avgDifficulty: number;
  uniqueTags: number;
  platformCount: number;
  topSource: string;
  weekendPercentage: number;
  nightPercentage: number;
  sourceBreakdown: SourceData[];
}
