import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { z } from "zod";
import { motion } from "framer-motion";
import {
  ProblemCountHeatmap,
  MaxDifficultyHeatmap,
  getAvailableYears,
} from "@/components/problem-heatmaps";
import { ProblemChartsSection } from "@/components/problem-charts";
import { ProblemsTable } from "@/components/problems-table";
import { CSVToolbar } from "@/components/csv-toolbar";
import { OJImport } from "@/components/oj-import";
import { SettingsSheet } from "@/components/settings-sheet";
import { OverviewStats } from "@/components/overview-stats";
import { StorageModeBadge } from "@/components/storage-mode-badge";
import { useProblems } from "@/hooks/use-problems-queries";
import { useAuth } from "@/contexts/auth-context";
import type { SolvedProblem } from "@/data/mock";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { User, Github } from "lucide-react";

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <div className="min-h-screen bg-transparent">
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4 select-none">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <h1 className="text-xl font-bold tracking-tight">CP Tracker</h1>
            <StorageModeBadge isCloudMode={isCloudMode} isSyncing={isSyncing} />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <a
                href="https://github.com/lihaoze123/cptracker"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View on GitHub"
              >
                <Github className="h-4 w-4" />
              </a>
            </Button>
            {user ? (
              <UserAvatar
                email={user.email}
                size={32}
                className="cursor-pointer"
              />
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleNavigateToAuth}
              >
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
        </div>
      </header>

      <motion.div
        className="container mx-auto py-8 px-4 space-y-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants}>
          <div className="space-y-1 mb-6">
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground">
              Track your problem-solving progress and performance
            </p>
          </div>
          <OverviewStats problems={dbProblems} isLoading={isLoading} />
        </motion.div>

        <motion.div variants={itemVariants}>
          <ProblemChartsSection problems={dbProblems} isLoading={isLoading} />
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="grid gap-6 md:grid-cols-2 select-none"
        >
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
        </motion.div>

        <motion.div variants={itemVariants}>
          <ProblemsTable
            problems={dbProblems}
            onFilteredDataChange={setFilteredProblems}
            onAddProblem={handleAddProblem}
            onEditProblem={handleEditProblem}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
