/**
 * Rating Distribution Pie Chart
 * Shows percentage distribution of problems by difficulty rating
 */
import { useMemo } from "react";
import { Pie, PieChart, Cell, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { getDifficultyLevel, DIFFICULTY_COLORS, DIFFICULTY_LABELS } from "@/components/problem-heatmaps";
import type { SolvedProblem } from "@/data/mock";
import { difficultyChartConfig } from "./chart-utils";

interface RatingDistributionPieChartProps {
  problems: SolvedProblem[];
  isLoading?: boolean;
}

export function RatingDistributionPieChart({
  problems,
  isLoading,
}: RatingDistributionPieChartProps) {
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
