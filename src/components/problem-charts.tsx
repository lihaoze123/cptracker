/**
 * Problem Charts Section
 * Main container that orchestrates all chart components
 */
import { useMemo, useState } from "react";
import type { SolvedProblem } from "@/data/mock";
import {
  RatingDistributionBarChart,
  RatingDistributionPieChart,
  ActivityStackedChart,
  TimeRangeSelector,
  filterProblemsByTimeRange,
  type TimeRange,
} from "@/components/features/charts";

interface ProblemChartsSectionProps {
  problems: SolvedProblem[];
  isLoading?: boolean;
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
