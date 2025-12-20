import { useMemo } from "react";
import { StatsCard } from "@/components/stats-card";
import { Trophy, TrendingUp, Calendar, Target } from "lucide-react";
import { calculateProblemStats } from "@/lib/stats-utils";
import type { SolvedProblem } from "@/data/mock";

interface OverviewStatsProps {
  problems: SolvedProblem[];
  isLoading?: boolean;
}

export function OverviewStats({ problems, isLoading }: OverviewStatsProps) {
  const stats = useMemo(
    () => calculateProblemStats(problems),
    [problems]
  );

  return (
    <div className="grid gap-6 grid-cols-2 md:grid-cols-4">
      <StatsCard
        title="Total Problems"
        value={stats.total}
        icon={Trophy}
        isLoading={isLoading}
      />
      <StatsCard
        title="Last 7 Days"
        value={stats.weekly}
        icon={TrendingUp}
        isLoading={isLoading}
      />
      <StatsCard
        title="Last 30 Days"
        value={stats.monthly}
        icon={Calendar}
        isLoading={isLoading}
      />
      <StatsCard
        title="This Year"
        value={stats.yearly}
        icon={Target}
        isLoading={isLoading}
      />
    </div>
  );
}
