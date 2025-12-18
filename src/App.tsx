import { useState, useEffect, useMemo } from "react";
import { NuqsAdapter } from "nuqs/adapters/react";
import {
  ProblemCountHeatmap,
  MaxDifficultyHeatmap,
  getAvailableYears,
} from "@/components/problem-heatmaps";
import { ProblemsTable } from "@/components/problems-table";
import { CSVToolbar } from "@/components/csv-toolbar";
import { useProblemsDB } from "@/hooks/use-problems-db";
import type { SolvedProblem } from "@/data/mock";

function Dashboard() {
  const {
    problems: dbProblems,
    isLoading,
    addProblems,
    updateProblem,
    importProblems,
    clearAllProblems,
    resetToMockData,
  } = useProblemsDB();

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 space-y-6">
        <header className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Competitive Programming Tracker</h1>
            <p className="text-muted-foreground">
              Track your problem-solving progress and performance
            </p>
          </div>
          <CSVToolbar
            problems={dbProblems}
            onImport={importProblems}
            onClearAll={clearAllProblems}
            onReset={resetToMockData}
          />
        </header>

        <div className="grid gap-6 md:grid-cols-2">
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

export function App() {
  return (
    <NuqsAdapter>
      <Dashboard />
    </NuqsAdapter>
  );
}

export default App;
