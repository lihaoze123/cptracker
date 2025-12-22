import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Heatmap } from "@/components/ui/heatmap";
import type { SolvedProblem } from "@/data/mock";
import { getProblemDisplayName } from "@/lib/problem-utils";

interface ProblemHeatmapsProps {
  problems: SolvedProblem[];
}

interface YearHeatmapProps extends ProblemHeatmapsProps {
  selectedYear: number;
  onYearChange: (year: number) => void;
  availableYears: number[];
}

interface DayProblemMeta {
  problems: Array<{
    name: string;
    difficulty?: string;
    url: string;
  }>;
}

function parseDate(dateStr: string): string {
  // Convert yyyy/mm/dd or yyyy-mm-dd to yyyy-mm-dd for HeatMap compatibility
  return dateStr.split(" ")[0].replace(/\//g, "-");
}

function getYearStartDate(year: number): Date {
  return new Date(year, 0, 1);
}

function getYearEndDate(year: number): Date {
  return new Date(year, 11, 31);
}

function getAvailableYears(problems: SolvedProblem[]): number[] {
  const years = new Set<number>();
  const currentYear = new Date().getFullYear();
  years.add(currentYear);

  problems.forEach((p) => {
    const date = parseDate(p.日期);
    const year = parseInt(date.split("-")[0], 10);
    if (!isNaN(year)) {
      years.add(year);
    }
  });

  return Array.from(years).sort((a, b) => b - a);
}

function YearSelector({
  selectedYear,
  onYearChange,
  availableYears,
}: {
  selectedYear: number;
  onYearChange: (year: number) => void;
  availableYears: number[];
}) {
  return (
    <Select
      value={selectedYear.toString()}
      onValueChange={(value) => onYearChange(parseInt(value, 10))}
    >
      <SelectTrigger className="w-24 h-7">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {availableYears.map((year) => (
          <SelectItem key={year} value={year.toString()}>
            {year}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function formatDateDisplay(date: string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Color palette for problem count (green gradient like GitHub)
const COUNT_COLORS = ["#9be9a8", "#40c463", "#30a14e", "#216e39"];

export function ProblemCountHeatmap({
  problems,
  selectedYear,
  onYearChange,
  availableYears,
}: YearHeatmapProps) {
  const heatmapData = useMemo(() => {
    const dataByDate: Record<string, DayProblemMeta> = {};

    problems.forEach((p) => {
      const date = parseDate(p.日期);
      if (!dataByDate[date]) {
        dataByDate[date] = { problems: [] };
      }
      dataByDate[date].problems.push({
        name: getProblemDisplayName(p.题目),
        difficulty: p.难度,
        url: p.题目,
      });
    });

    return Object.entries(dataByDate).map(([date, meta]) => ({
      date,
      count: meta.problems.length,
      meta,
    }));
  }, [problems]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Daily Problem Count</CardTitle>
          <YearSelector
            selectedYear={selectedYear}
            onYearChange={onYearChange}
            availableYears={availableYears}
          />
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Heatmap<DayProblemMeta>
          data={heatmapData}
          startDate={getYearStartDate(selectedYear)}
          endDate={getYearEndDate(selectedYear)}
          colors={COUNT_COLORS}
          renderTooltip={(date, count, meta) => (
            <div className="space-y-1">
              <div className="font-medium">{formatDateDisplay(date)}</div>
              <div className="text-muted-foreground">
                {count} problem{count !== 1 ? "s" : ""}
              </div>
              {meta && meta.problems.length > 0 && (
                <ul className="mt-1 space-y-0.5">
                  {meta.problems.map((p, i) => (
                    <li key={i} className="flex items-center gap-1">
                      <span>{p.name}</span>
                      <span className="text-muted-foreground">({p.difficulty})</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        />
      </CardContent>
    </Card>
  );
}

export function getDifficultyLevel(rating: number): number {
  if (rating < 1200) return 1;
  if (rating < 1400) return 2;
  if (rating < 1600) return 3;
  if (rating < 1900) return 4;
  if (rating < 2100) return 5;
  if (rating < 2400) return 6;
  if (rating < 2600) return 7;
  if (rating < 3000) return 8;
  return 9;
}

// Difficulty color palette
export const DIFFICULTY_COLORS = [
  "#9ca3af", // 1: gray (<1200)
  "#22c55e", // 2: green (1200-1399)
  "#06b6d4", // 3: cyan (1400-1599)
  "#3b82f6", // 4: blue (1600-1899)
  "#a855f7", // 5: purple (1900-2099)
  "#f97316", // 6: orange (2100-2399)
  "#f87171", // 7: light red (2400-2599)
  "#ef4444", // 8: red (2600-2999)
  "#991b1b", // 9: dark red (3000+)
];

export const DIFFICULTY_LABELS = [
  "<1200",
  "1200-1399",
  "1400-1599",
  "1600-1899",
  "1900-2099",
  "2100-2399",
  "2400-2599",
  "2600-2999",
  "3000+",
];

export function MaxDifficultyHeatmap({
  problems,
  selectedYear,
  onYearChange,
  availableYears,
}: YearHeatmapProps) {
  const heatmapData = useMemo(() => {
    const dataByDate: Record<string, { maxRating: number; problems: DayProblemMeta["problems"] }> = {};

    problems.forEach((p) => {
      const date = parseDate(p.日期);
      if (!p.难度) return;
      const rating = parseInt(p.难度, 10);
      if (!isNaN(rating)) {
        if (!dataByDate[date]) {
          dataByDate[date] = { maxRating: 0, problems: [] };
        }
        dataByDate[date].maxRating = Math.max(dataByDate[date].maxRating, rating);
        dataByDate[date].problems.push({
          name: getProblemDisplayName(p.题目),
          difficulty: p.难度,
          url: p.题目,
        });
      }
    });

    return Object.entries(dataByDate).map(([date, data]) => ({
      date,
      count: getDifficultyLevel(data.maxRating),
      meta: { problems: data.problems } as DayProblemMeta,
    }));
  }, [problems]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Daily Max Difficulty</CardTitle>
          <YearSelector
            selectedYear={selectedYear}
            onYearChange={onYearChange}
            availableYears={availableYears}
          />
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Heatmap<DayProblemMeta>
          data={heatmapData}
          startDate={getYearStartDate(selectedYear)}
          endDate={getYearEndDate(selectedYear)}
          colors={DIFFICULTY_COLORS}
          getColorIndex={(count) => count - 1}
          renderTooltip={(date, count, meta) => (
            <div className="space-y-1">
              <div className="font-medium">{formatDateDisplay(date)}</div>
              <div className="text-muted-foreground">
                Max: {count > 0 ? DIFFICULTY_LABELS[count - 1] : "No data"}
              </div>
              {meta && meta.problems.length > 0 && (
                <ul className="mt-1 space-y-0.5">
                  {meta.problems.map((p, i) => (
                    <li key={i} className="flex items-center gap-1">
                      <span>{p.name}</span>
                      <span className="text-muted-foreground">({p.difficulty})</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        />
        <div className="flex gap-2 mt-3 text-xs text-muted-foreground flex-wrap">
          {DIFFICULTY_COLORS.map((color, i) => (
            <span key={i} className="flex items-center gap-1">
              <span className="w-3 h-3" style={{ backgroundColor: color }} />
              {DIFFICULTY_LABELS[i]}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export { getAvailableYears };
