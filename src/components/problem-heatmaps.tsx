import HeatMap from "@uiw/react-heat-map";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SolvedProblem } from "@/data/mock";

interface ProblemHeatmapsProps {
  problems: SolvedProblem[];
}

interface YearHeatmapProps extends ProblemHeatmapsProps {
  selectedYear: number;
  onYearChange: (year: number) => void;
  availableYears: number[];
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

export function ProblemCountHeatmap({
  problems,
  selectedYear,
  onYearChange,
  availableYears,
}: YearHeatmapProps) {
  const heatmapData = useMemo(() => {
    const countByDate: Record<string, number> = {};

    problems.forEach((p) => {
      const date = parseDate(p.日期);
      countByDate[date] = (countByDate[date] || 0) + 1;
    });

    return Object.entries(countByDate).map(([date, count]) => ({
      date,
      count,
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
      <CardContent className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <HeatMap
          value={heatmapData}
          startDate={getYearStartDate(selectedYear)}
          endDate={getYearEndDate(selectedYear)}
          style={{ color: "var(--foreground)", minWidth: 720 }}
          panelColors={{
            0: "var(--muted)",
            1: "#9be9a8",
            2: "#40c463",
            3: "#30a14e",
            4: "#216e39",
          }}
          rectSize={12}
          legendCellSize={12}
        />
      </CardContent>
    </Card>
  );
}

function getDifficultyLevel(rating: number): number {
  if (rating < 1200) return 1;
  if (rating < 1400) return 2;
  if (rating < 1600) return 3;
  if (rating < 1900) return 4;
  if (rating < 2100) return 5;
  if (rating < 2400) return 6;
  return 7;
}

function getDifficultyColor(level: number): string {
  switch (level) {
    case 1:
      return "#9ca3af"; // gray
    case 2:
      return "#22c55e"; // green
    case 3:
      return "#06b6d4"; // cyan
    case 4:
      return "#3b82f6"; // blue
    case 5:
      return "#a855f7"; // purple
    case 6:
      return "#f97316"; // orange
    case 7:
      return "#ef4444"; // red
    default:
      return "var(--muted)";
  }
}

export function MaxDifficultyHeatmap({
  problems,
  selectedYear,
  onYearChange,
  availableYears,
}: YearHeatmapProps) {
  const heatmapData = useMemo(() => {
    const maxByDate: Record<string, number> = {};

    problems.forEach((p) => {
      const date = parseDate(p.日期);
      const rating = parseInt(p.难度, 10);
      if (!isNaN(rating)) {
        maxByDate[date] = Math.max(maxByDate[date] || 0, rating);
      }
    });

    return Object.entries(maxByDate).map(([date, rating]) => ({
      date,
      count: getDifficultyLevel(rating),
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
      <CardContent className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <HeatMap
          value={heatmapData}
          startDate={getYearStartDate(selectedYear)}
          endDate={getYearEndDate(selectedYear)}
          style={{ color: "var(--foreground)", minWidth: 720 }}
          panelColors={{
            0: "var(--muted)",
            1: getDifficultyColor(1),
            2: getDifficultyColor(2),
            3: getDifficultyColor(3),
            4: getDifficultyColor(4),
            5: getDifficultyColor(5),
            6: getDifficultyColor(6),
            7: getDifficultyColor(7),
          }}
          rectSize={12}
          legendCellSize={12}
        />
        <div className="flex gap-2 mt-3 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <span
              className="w-3 h-3"
              style={{ backgroundColor: getDifficultyColor(1) }}
            />
            &lt;1200
          </span>
          <span className="flex items-center gap-1">
            <span
              className="w-3 h-3"
              style={{ backgroundColor: getDifficultyColor(2) }}
            />
            1200-1399
          </span>
          <span className="flex items-center gap-1">
            <span
              className="w-3 h-3"
              style={{ backgroundColor: getDifficultyColor(3) }}
            />
            1400-1599
          </span>
          <span className="flex items-center gap-1">
            <span
              className="w-3 h-3"
              style={{ backgroundColor: getDifficultyColor(4) }}
            />
            1600-1899
          </span>
          <span className="flex items-center gap-1">
            <span
              className="w-3 h-3"
              style={{ backgroundColor: getDifficultyColor(5) }}
            />
            1900-2099
          </span>
          <span className="flex items-center gap-1">
            <span
              className="w-3 h-3"
              style={{ backgroundColor: getDifficultyColor(6) }}
            />
            2100-2399
          </span>
          <span className="flex items-center gap-1">
            <span
              className="w-3 h-3"
              style={{ backgroundColor: getDifficultyColor(7) }}
            />
            2400+
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export { getAvailableYears };
