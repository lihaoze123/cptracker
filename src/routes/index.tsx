import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import {
  ProblemCountHeatmap,
  MaxDifficultyHeatmap,
  getAvailableYears,
} from "@/components/problem-heatmaps";
import { ProblemsTable } from "@/components/problems-table";
import { CSVToolbar } from "@/components/csv-toolbar";
import { OJImport } from "@/components/oj-import";
import { SettingsSheet } from "@/components/settings-sheet";
import { useProblems } from "@/hooks/use-problems-queries";
import { useAuth } from "@/contexts/auth-context";
import type { SolvedProblem } from "@/data/mock";
import { Button } from "@/components/ui/button";
import { Cloud, RefreshCw, User, Github } from "lucide-react";

export const Route = createFileRoute("/")({
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
              {isCloudMode && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Cloud className="h-4 w-4" />
                  <span className="hidden sm:inline">Cloud</span>
                  {isSyncing && <RefreshCw className="h-3 w-3 animate-spin" />}
                </div>
              )}
            </div>
            <p className="text-sm md:text-base text-muted-foreground">
              Track your problem-solving progress and performance
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              asChild
            >
              <a
                href="https://github.com/lihaoze123/cptracker"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View on GitHub"
              >
                <Github className="h-4 w-4" />
              </a>
            </Button>
            {!user && (
              <Button variant="outline" size="sm" onClick={handleNavigateToAuth}>
                <User className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            )}
            <div className="flex items-center gap-2 ml-auto md:ml-0">
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
          </div>
        </header>

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

        <ProblemsTable
          problems={dbProblems}
          onFilteredDataChange={setFilteredProblems}
          onAddProblem={handleAddProblem}
          onEditProblem={handleEditProblem}
        />
      </div>
    </div>
  );
}
