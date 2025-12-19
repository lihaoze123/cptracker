import { useState, useEffect, useMemo } from "react";
import { NuqsAdapter } from "nuqs/adapters/react";
import {
  ProblemCountHeatmap,
  MaxDifficultyHeatmap,
  getAvailableYears,
} from "@/components/problem-heatmaps";
import { ProblemsTable } from "@/components/problems-table";
import { CSVToolbar } from "@/components/csv-toolbar";
import { OJImport } from "@/components/oj-import";
import { SettingsSheet } from "@/components/settings-sheet";
import { AuthPage, type AuthView } from "@/components/auth-page";
import { PublicProfileView } from "@/components/public-profile-view";
import { Toaster } from "@/components/ui/toaster";
import { useProblemsDB } from "@/hooks/use-problems-db";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import type { SolvedProblem } from "@/data/mock";
import { Button } from "@/components/ui/button";
import { Cloud, RefreshCw, User, Github } from "lucide-react";

type AppView = "dashboard" | "auth" | "public-profile";

function Dashboard() {
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
  } = useProblemsDB();

  const { user } = useAuth();
  const [appView, setAppView] = useState<AppView>("dashboard");
  const [authView, setAuthView] = useState<AuthView>("login");
  const [viewingUsername, setViewingUsername] = useState<string | null>(null);

  // 处理 URL 路由（pathname 和 hash）
  useEffect(() => {
    const handleRouteChange = () => {
      const pathname = window.location.pathname;
      const hash = window.location.hash.slice(1);

      // 处理 hash 路由（认证页面）
      if (hash === "login" || hash === "sign-up" || hash === "forgot-password" || hash === "update-password") {
        setAppView("auth");
        setAuthView(hash as AuthView);
        return;
      }

      // 处理 pathname 路由（公开资料页）
      if (pathname !== "/" && pathname.length > 1) {
        const username = pathname.slice(1); // 去除前导 '/'
        setViewingUsername(username);
        setAppView("public-profile");
      } else {
        setViewingUsername(null);
        setAppView("dashboard");
      }
    };

    handleRouteChange();
    window.addEventListener("hashchange", handleRouteChange);
    window.addEventListener("popstate", handleRouteChange);
    return () => {
      window.removeEventListener("hashchange", handleRouteChange);
      window.removeEventListener("popstate", handleRouteChange);
    };
  }, []);

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

  const handleAuthSuccess = () => {
    setAppView("dashboard");
    window.location.hash = "";
  };

  const handleNavigateToAuth = (view: AuthView = "login") => {
    setAuthView(view);
    setAppView("auth");
    window.location.hash = view;
  };

  const handleBackFromAuth = () => {
    setAppView("dashboard");
    window.location.hash = "";
  };

  const handleBackToHome = () => {
    setAppView("dashboard");
    setViewingUsername(null);
    window.history.pushState({}, "", "/");
  };

  // 显示公开资料页面
  if (appView === "public-profile" && viewingUsername) {
    return (
      <PublicProfileView
        username={viewingUsername}
        onBack={handleBackToHome}
      />
    );
  }

  // 显示认证页面
  if (appView === "auth") {
    return (
      <AuthPage
        initialView={authView}
        onBack={handleBackFromAuth}
        onSuccess={handleAuthSuccess}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 space-y-6">
        <header className="flex items-start justify-between select-none">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Competitive Programming Tracker</h1>
              {isCloudMode && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Cloud className="h-4 w-4" />
                  <span>Cloud</span>
                  {isSyncing && <RefreshCw className="h-3 w-3 animate-spin" />}
                </div>
              )}
            </div>
            <p className="text-muted-foreground">
              Track your problem-solving progress and performance
            </p>
          </div>
          <div className="flex items-center gap-2">
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
              <Button variant="outline" size="sm" onClick={() => handleNavigateToAuth("login")}>
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

export function App() {
  return (
    <AuthProvider>
      <NuqsAdapter>
        <Dashboard />
        <Toaster />
      </NuqsAdapter>
    </AuthProvider>
  );
}

export default App;
