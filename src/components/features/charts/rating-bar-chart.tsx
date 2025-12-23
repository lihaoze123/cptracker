/**
 * Rating Distribution Bar Chart
 * Shows solve count grouped by difficulty rating
 */
import { useMemo } from "react";
import { Bar, BarChart, Cell, XAxis, YAxis, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { getDifficultyLevel, DIFFICULTY_COLORS, DIFFICULTY_LABELS } from "@/components/problem-heatmaps";
import type { SolvedProblem } from "@/data/mock";

interface RatingDistributionBarChartProps {
  problems: SolvedProblem[];
  isLoading?: boolean;
}

export function RatingDistributionBarChart({
  problems,
  isLoading,
}: RatingDistributionBarChartProps) {
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
