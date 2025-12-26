/**
 * Chart Utilities
 * Shared constants and utilities for chart components
 */
import type { SolvedProblem } from "@/data/mock";
import { DIFFICULTY_COLORS, DIFFICULTY_LABELS } from "@/components/problem-heatmaps";
import type { ChartConfig } from "@/components/ui/chart";

export type TimeRange = "7d" | "30d" | "365d";

export const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "365d", label: "1Y" },
];

// Build chart config for difficulty levels
export const difficultyChartConfig: ChartConfig = DIFFICULTY_LABELS.reduce(
  (acc, label, index) => {
    acc[label] = {
      label: label,
      color: DIFFICULTY_COLORS[index],
    };
    return acc;
  },
  {} as ChartConfig
);

export function parseDate(timestamp: number): Date {
  return new Date(timestamp);
}

export function filterProblemsByTimeRange(
  problems: SolvedProblem[],
  timeRange: TimeRange
): SolvedProblem[] {
  const now = new Date();
  const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 365;
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  return problems.filter((p) => {
    const date = parseDate(p.日期);
    return date >= cutoff && date <= now;
  });
}

export function formatDateLabel(date: Date, timeRange: TimeRange): string {
  if (timeRange === "7d") {
    return date.toLocaleDateString("en-US", { weekday: "short" });
  }
  if (timeRange === "30d") {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  // 365d
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
