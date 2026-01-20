/**
 * Activity Stacked Chart
 * Shows daily/monthly activity stacked by difficulty rating
 */
import { useMemo } from "react";
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { getDifficultyLevel, DIFFICULTY_COLORS, DIFFICULTY_LABELS } from "@/components/problem-heatmaps";
import type { SolvedProblem } from "@/data/mock";
import { difficultyChartConfig, parseDate, type TimeRange, formatDateLabel, isValidTimestamp } from "./chart-utils";

interface ActivityStackedChartProps {
  problems: SolvedProblem[];
  timeRange: TimeRange;
  isLoading?: boolean;
}

export function ActivityStackedChart({
  problems,
  timeRange,
  isLoading,
}: ActivityStackedChartProps) {
  const data = useMemo(() => {
    // Filter out problems with invalid dates to prevent "Invalid time value" errors
    const validProblems = problems.filter((p) => isValidTimestamp(p.日期));

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
        const monthProblems = validProblems.filter((p) => {
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
    validProblems.forEach((p) => {
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
