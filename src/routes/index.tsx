import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { z } from "zod";
import {
  ProblemCountHeatmap,
  MaxDifficultyHeatmap,
  getAvailableYears,
} from "@/components/problem-heatmaps";
import { CSVToolbar } from "@/components/csv-toolbar";
import { OJImport } from "@/components/oj-import";
import { SettingsSheet } from "@/components/settings-sheet";
import { StorageModeBadge } from "@/components/storage-mode-badge";
import { useProblems } from "@/hooks/use-problems-queries";
import { useAuth } from "@/contexts/auth-context";
import type { SolvedProblem } from "@/data/mock";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { User, Sparkles } from "lucide-react";

// Lazy load heavy components for better performance
const OverviewStats = lazy(() => import("@/components/overview-stats").then(m => ({ default: m.OverviewStats })));
const ProblemChartsSection = lazy(() => import("@/components/problem-charts").then(m => ({ default: m.ProblemChartsSection })));
const ProblemsTable = lazy(() => import("@/components/problems-table").then(m => ({ default: m.ProblemsTable })));

// Skeleton components for lazy loading state
function StatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
      ))}
    </div>
  );
}

function ChartsSkeleton() {
  return <div className="h-64 bg-muted animate-pulse rounded-lg" />;
}

function TableSkeleton() {
  return <div className="h-96 bg-muted animate-pulse rounded-lg" />;
}

export const Route = createFileRoute("/")({
  validateSearch: z.object({
    solution: z.string().optional(),
  }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const {
    problems: dbProblems,
    isLoading,
    isSyncing,
    isCloudMode,
    addProblems,
    updateProblem,
    importProblems,
    clearAllProblems,
    resetToMockData,
    uploadLocalToCloud,
    downloadCloudToLocal,
  } = useProblems();

  const { user } = useAuth();

  const handleAddProblem = async (problem: Omit<SolvedProblem, "id">) => {
    return await addProblems([problem]);
  };

  const handleEditProblem = async (id: number, changes: Partial<SolvedProblem>) => {
    return await updateProblem(id, changes);
  };

  const [filteredProblems, setFilteredProblems] = useState<SolvedProblem[]>([]);
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());

  const availableYears = useMemo(
    () => getAvailableYears(dbProblems),
    [dbProblems]
  );

  useEffect(() => {
    setFilteredProblems(dbProblems);
  }, [dbProblems]);

  const handleNavigateToAuth = () => {
    navigate({ to: "/auth", search: { view: "login" } });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-4 md:py-8 px-4 space-y-6">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 select-none">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-bold">CP Tracker</h1>
              <StorageModeBadge isCloudMode={isCloudMode} isSyncing={isSyncing} />
            </div>
            <p className="text-sm md:text-base text-muted-foreground">
              Track your problem-solving progress and performance
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {user ? (
              <UserAvatar email={user.email} size={32} className="cursor-pointer" />
            ) : (
              <Button variant="outline" size="sm" onClick={handleNavigateToAuth}>
                <User className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            )}
            <OJImport onImport={importProblems} />
            <CSVToolbar
              problems={dbProblems}
              onImport={importProblems}
              onClearAll={clearAllProblems}
              onReset={resetToMockData}
            />
            <SettingsSheet
              onUploadToCloud={uploadLocalToCloud}
              onDownloadFromCloud={downloadCloudToLocal}
              isSyncing={isSyncing}
            />
          </div>
        </header>

        <Suspense fallback={<StatsSkeleton />}>
          <OverviewStats problems={dbProblems} isLoading={isLoading} />
        </Suspense>

        {/* Year Review Button */}
        {dbProblems.length > 0 && (
          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={() => navigate({ to: "/year-review" })}
              className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-8"
            >
              <Sparkles className="h-5 w-5" />
              View {new Date().getFullYear()} Year in Review
            </Button>
          </div>
        )}

        <Suspense fallback={<ChartsSkeleton />}>
          <ProblemChartsSection problems={dbProblems} isLoading={isLoading} />
        </Suspense>

        <div className="grid gap-6 md:grid-cols-2 select-none">
          <ProblemCountHeatmap
            problems={filteredProblems}
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
            availableYears={availableYears}
          />
          <MaxDifficultyHeatmap
            problems={filteredProblems}
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
            availableYears={availableYears}
          />
        </div>

        <Suspense fallback={<TableSkeleton />}>
          <ProblemsTable
            problems={dbProblems}
            onFilteredDataChange={setFilteredProblems}
            onAddProblem={handleAddProblem}
            onEditProblem={handleEditProblem}
          />
        </Suspense>
      </div>
    </div>
  );
}
