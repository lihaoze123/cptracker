import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  getDifficultyLevel,
  DIFFICULTY_COLORS,
  DIFFICULTY_LABELS,
} from "@/components/problem-heatmaps";
import type { SolvedProblem } from "@/data/mock";
import { cn } from "@/lib/utils";

type TimeRange = "7d" | "30d" | "365d";

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "365d", label: "1Y" },
];

interface ProblemChartsSectionProps {
  problems: SolvedProblem[];
  isLoading?: boolean;
}

function parseDate(dateStr: string): Date {
  return new Date(dateStr.split(" ")[0].replace(/\//g, "-"));
}

function filterProblemsByTimeRange(
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

function TimeRangeSelector({
  value,
  onChange,
}: {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
}) {
  return (
    <div className="flex gap-1 border border-border rounded-none p-0.5">
      {TIME_RANGE_OPTIONS.map((option) => (
        <Button
          key={option.value}
          variant={value === option.value ? "default" : "ghost"}
          size="xs"
          onClick={() => onChange(option.value)}
          className={cn(
            "h-6 px-2 text-xs",
            value === option.value && "bg-primary text-primary-foreground"
          )}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}

// Build chart config for difficulty levels
const difficultyChartConfig: ChartConfig = DIFFICULTY_LABELS.reduce(
  (acc, label, index) => {
    acc[label] = {
      label: label,
      color: DIFFICULTY_COLORS[index],
    };
    return acc;
  },
  {} as ChartConfig
);

function RatingDistributionBarChart({
  problems,
  isLoading,
}: {
  problems: SolvedProblem[];
  isLoading?: boolean;
}) {
  const data = useMemo(() => {
    return DIFFICULTY_LABELS.map((label, index) => {
      const count = problems.filter((p) => {
        if (!p.难度) return false;
        const rating = parseInt(p.难度, 10);
        return !isNaN(rating) && getDifficultyLevel(rating) === index + 1;
      }).length;
      return {
        rating: label,
        count,
        fill: DIFFICULTY_COLORS[index],
      };
    });
  }, [problems]);

  const chartConfig: ChartConfig = {
    count: { label: "Problems" },
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Solve Count by Rating</CardTitle>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center">
          <div className="text-muted-foreground text-sm">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Solve Count by Rating</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="rating"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10 }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={50}
            />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, _name, item) => (
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: item.payload.fill }}
                      />
                      <span>{item.payload.rating}: </span>
                      <span className="font-mono font-medium">{value}</span>
                    </div>
                  )}
                  hideIndicator
                  hideLabel
                />
              }
            />
            <Bar dataKey="count" radius={[2, 2, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function RatingDistributionPieChart({
  problems,
  isLoading,
}: {
  problems: SolvedProblem[];
  isLoading?: boolean;
}) {
  const data = useMemo(() => {
    const total = problems.length;
    return DIFFICULTY_LABELS.map((label, index) => {
      const count = problems.filter((p) => {
        if (!p.难度) return false;
        const rating = parseInt(p.难度, 10);
        return !isNaN(rating) && getDifficultyLevel(rating) === index + 1;
      }).length;
      return {
        rating: label,
        count,
        fill: DIFFICULTY_COLORS[index],
        percentage: total > 0 ? ((count / total) * 100).toFixed(1) : "0",
      };
    }).filter((d) => d.count > 0);
  }, [problems]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Rating Distribution</CardTitle>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center">
          <div className="text-muted-foreground text-sm">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Rating Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={difficultyChartConfig} className="h-[200px] w-full">
          <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, _name, item) => (
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: item.payload.fill }}
                      />
                      <span>{item.payload.rating}: </span>
                      <span className="font-mono font-medium">
                        {value} ({item.payload.percentage}%)
                      </span>
                    </div>
                  )}
                  hideIndicator
                  hideLabel
                />
              }
            />
            <Pie
              data={data}
              dataKey="count"
              nameKey="rating"
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={70}
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Legend
              content={({ payload }) => {
                if (!payload) return null;
                return (
                  <div className="flex flex-wrap justify-center gap-2 mt-2 text-xs">
                    {payload.map((entry, index) => (
                      <div key={index} className="flex items-center gap-1">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-muted-foreground">
                          {entry.value}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              }}
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function ActivityStackedChart({
  problems,
  timeRange,
  isLoading,
}: {
  problems: SolvedProblem[];
  timeRange: TimeRange;
  isLoading?: boolean;
}) {
  const data = useMemo(() => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);

    // For 365d, aggregate by month; otherwise by day
    if (timeRange === "365d") {
      // Generate last 12 months
      const months: { start: Date; end: Date; label: string }[] = [];
      for (let i = 11; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
        months.push({
          start: monthStart,
          end: monthEnd,
          label: monthStart.toLocaleDateString("en-US", { month: "short" }),
        });
      }

      return months.map(({ start, end, label }) => {
        const monthProblems = problems.filter((p) => {
          const date = parseDate(p.日期);
          return date >= start && date <= end;
        });

        const result: Record<string, number | string> = {
          date: label,
          fullDate: `${start.toISOString().split("T")[0]} - ${end.toISOString().split("T")[0]}`,
        };

        DIFFICULTY_LABELS.forEach((diffLabel, index) => {
          result[diffLabel] = monthProblems.filter((p) => {
            if (!p.难度) return false;
            const rating = parseInt(p.难度, 10);
            return !isNaN(rating) && getDifficultyLevel(rating) === index + 1;
          }).length;
        });

        return result;
      });
    }

    // 7d or 30d: daily data
    const days = timeRange === "7d" ? 7 : 30;
    const dates: Date[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      date.setHours(0, 0, 0, 0);
      dates.push(date);
    }

    const problemsByDate: Record<string, SolvedProblem[]> = {};
    problems.forEach((p) => {
      const date = parseDate(p.日期);
      const dateStr = date.toISOString().split("T")[0];
      if (!problemsByDate[dateStr]) {
        problemsByDate[dateStr] = [];
      }
      problemsByDate[dateStr].push(p);
    });

    return dates.map((date) => {
      const dateStr = date.toISOString().split("T")[0];
      const dayProblems = problemsByDate[dateStr] || [];

      const result: Record<string, number | string> = {
        date: formatDateLabel(date, timeRange),
        fullDate: dateStr,
      };

      DIFFICULTY_LABELS.forEach((label, index) => {
        result[label] = dayProblems.filter((p) => {
          if (!p.难度) return false;
          const rating = parseInt(p.难度, 10);
          return !isNaN(rating) && getDifficultyLevel(rating) === index + 1;
        }).length;
      });

      return result;
    });
  }, [problems, timeRange]);

  const title = timeRange === "365d" ? "Monthly Activity" : "Daily Activity";

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center">
          <div className="text-muted-foreground text-sm">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={difficultyChartConfig} className="h-[200px] w-full">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10 }}
              interval={timeRange === "7d" ? 0 : timeRange === "30d" ? 4 : 0}
            />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) => {
                    if (payload?.[0]?.payload?.fullDate) {
                      const fullDate = payload[0].payload.fullDate;
                      // For monthly view, fullDate is a range like "2024-01-01 - 2024-01-31"
                      if (fullDate.includes(" - ")) {
                        const [start, end] = fullDate.split(" - ");
                        const startDate = new Date(start);
                        const endDate = new Date(end);
                        return `${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
                      }
                      const date = new Date(fullDate);
                      return date.toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      });
                    }
                    return "";
                  }}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent className="flex-wrap" />} />
            {DIFFICULTY_LABELS.map((label, index) => (
              <Bar
                key={label}
                dataKey={label}
                stackId="a"
                fill={DIFFICULTY_COLORS[index]}
                radius={
                  index === DIFFICULTY_LABELS.length - 1 ? [2, 2, 0, 0] : [0, 0, 0, 0]
                }
              />
            ))}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function formatDateLabel(date: Date, timeRange: TimeRange): string {
  if (timeRange === "7d") {
    return date.toLocaleDateString("en-US", { weekday: "short" });
  }
  if (timeRange === "30d") {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  // 365d
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ProblemChartsSection({
  problems,
  isLoading,
}: ProblemChartsSectionProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

  const filteredProblems = useMemo(
    () => filterProblemsByTimeRange(problems, timeRange),
    [problems, timeRange]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Charts Overview</h2>
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <RatingDistributionBarChart
          problems={filteredProblems}
          isLoading={isLoading}
        />
        <RatingDistributionPieChart
          problems={filteredProblems}
          isLoading={isLoading}
        />
        <ActivityStackedChart
          problems={problems}
          timeRange={timeRange}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
