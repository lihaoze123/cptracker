import type { SolvedProblem } from "@/data/mock";

export interface ProblemStats {
  total: number;
  weekly: number;
  monthly: number;
  yearly: number;
}

function parseProblemDate(dateStr: string): Date | null {
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

export function calculateProblemStats(problems: SolvedProblem[]): ProblemStats {
  const now = new Date();
  const currentYear = now.getFullYear();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  let weekly = 0;
  let monthly = 0;
  let yearly = 0;

  problems.forEach((problem) => {
    const date = parseProblemDate(problem.日期);
    if (!date) return;

    if (date >= sevenDaysAgo) weekly++;
    if (date >= thirtyDaysAgo) monthly++;
    if (date.getFullYear() === currentYear) yearly++;
  });

  return {
    total: problems.length,
    weekly,
    monthly,
    yearly,
  };
}
