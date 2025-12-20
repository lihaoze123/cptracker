import { useState, useEffect, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { ProblemsTable } from "@/components/problems-table";
import {
  ProblemCountHeatmap,
  MaxDifficultyHeatmap,
  getAvailableYears,
} from "@/components/problem-heatmaps";
import { OverviewStats } from "@/components/overview-stats";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { ArrowLeft, ExternalLink, Github } from "lucide-react";
import type { SolvedProblem } from "@/data/mock";
import { getProblemsByUsername, type UserProfile } from "@/lib/supabase/profiles";
import { toLocalProblem } from "@/lib/supabase/database";

interface PublicProfileViewProps {
  username: string;
  onBack?: () => void;
}

export function PublicProfileView({ username, onBack }: PublicProfileViewProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [problems, setProblems] = useState<SolvedProblem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filteredProblems, setFilteredProblems] = useState<SolvedProblem[]>([]);
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getProblemsByUsername(username);
        setProfile(data.profile);

        const localProblems = data.problems.map((p, idx) =>
          toLocalProblem(p, idx + 1)
        );
        setProblems(localProblems);
        setFilteredProblems(localProblems);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load user profile"
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [username]);

  const availableYears = useMemo(
    () => getAvailableYears(problems),
    [problems]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Error</h2>
          <p className="text-muted-foreground">{error}</p>
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-4 md:py-8 px-4 space-y-6">
        {/* Header */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 select-none">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              {onBack && (
                <Button variant="ghost" size="icon" onClick={onBack}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              <UserAvatar hash={profile?.avatar_hash} size={48} />
              <div>
                <h1 className="text-xl md:text-2xl font-bold">
                  {profile?.display_name || `@${username}`}
                </h1>
                <p className="text-muted-foreground">@{username}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Public profile • {problems.length} problem{problems.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
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
            <Button variant="outline" size="sm" asChild className="flex-1 md:flex-none">
              <Link to="/" className="flex items-center justify-center gap-2">
                <ExternalLink className="h-4 w-4" />
                View My Tracker
              </Link>
            </Button>
          </div>
        </header>

        <OverviewStats problems={problems} isLoading={isLoading} />

        {/* Heatmaps */}
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

        {/* Problems Table (Read-only) */}
        <ProblemsTable
          problems={problems}
          onFilteredDataChange={setFilteredProblems}
          onAddProblem={() => Promise.resolve(false)}
          onEditProblem={() => Promise.resolve(false)}
          readOnly
          ownerUsername={username}
        />
      </div>
    </div>
  );
}
