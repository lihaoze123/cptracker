import type { AggregateStats, ArchetypeResult } from "./types";

// CP Archetype definitions
export const CP_ARCHETYPES: Record<string, ArchetypeResult> = {
  "The Consistent": {
    name: "The Consistent",
    description: "Day after day, persistence is your superpower",
    icon: "Target",
  },
  "Weekend Warrior": {
    name: "Weekend Warrior",
    description: "Saturday and Sunday are your playground",
    icon: "Calendar",
  },
  "Theory Master": {
    name: "Theory Master",
    description: "Easy problems bore you. Mathematical challenges are your passion",
    icon: "Brain",
  },
  "Speed Demon": {
    name: "Speed Demon",
    description: "When you're in the zone, nothing can stop you",
    icon: "Zap",
  },
  "The Versatile": {
    name: "The Versatile",
    description: "Graphs, DP, math, greedy—you master them all",
    icon: "Award",
  },
  "The Grinder": {
    name: "The Grinder",
    description: "You don't stop. 300+ problems of pure determination",
    icon: "Cpu",
  },
  "Contest Crusher": {
    name: "Contest Crusher",
    description: "You thrive under pressure. The leaderboard is your home",
    icon: "Trophy",
  },
  "The Explorer": {
    name: "The Explorer",
    description: "Codeforces, AtCoder, LeetCode—you try them all",
    icon: "Compass",
  },
  "Night Owl": {
    name: "Night Owl",
    description: "Midnight is your golden hour",
    icon: "Moon",
  },
  "Rising Star": {
    name: "Rising Star",
    description: "Every master was once a beginner. Your journey has just begun",
    icon: "Star",
  },
};

/**
 * Calculate CP archetype based on user behavior patterns
 * Priority order determines which archetype is assigned
 */
export function calculateCPArchetype(stats: AggregateStats): ArchetypeResult {
  // 1. The Consistent - Longest streak > 30 days
  if (stats.longestStreak > 30) {
    return CP_ARCHETYPES["The Consistent"];
  }

  // 2. Theory Master - Average difficulty >= 1900
  if (stats.avgDifficulty >= 1900) {
    return CP_ARCHETYPES["Theory Master"];
  }

  // 3. Weekend Warrior - Weekend percentage > 40%
  if (stats.weekendPercentage > 40) {
    return CP_ARCHETYPES["Weekend Warrior"];
  }

  // 4. Night Owl - Night percentage > 40%
  if (stats.nightPercentage > 40) {
    return CP_ARCHETYPES["Night Owl"];
  }

  // 5. The Grinder - Total problems >= 300
  if (stats.totalProblems >= 300) {
    return CP_ARCHETYPES["The Grinder"];
  }

  // 6. Contest Crusher - Codeforces/AtCoder > 80%
  const contestPlatforms = ["Codeforces", "AtCoder"];
  const contestPercentage = stats.sourceBreakdown
    .filter((s) => contestPlatforms.includes(s.source))
    .reduce((sum, s) => sum + s.percentage, 0);
  if (contestPercentage > 80) {
    return CP_ARCHETYPES["Contest Crusher"];
  }

  // 7. The Versatile - Unique tags >= 20
  if (stats.uniqueTags >= 20) {
    return CP_ARCHETYPES["The Versatile"];
  }

  // 8. The Explorer - Platform count >= 5
  if (stats.platformCount >= 5) {
    return CP_ARCHETYPES["The Explorer"];
  }

  // 9. Speed Demon - High problem density when active
  // Check if average problems per active day > 3
  const weekdaySum = stats.weekdayStats.reduce((a, b) => a + b, 0);
  const activeDays = stats.weekdayStats.filter((count) => count > 0).length;
  if (activeDays > 0) {
    const avgPerActiveDay = weekdaySum / activeDays;
    if (avgPerActiveDay > 3 && stats.totalProblems >= 50) {
      return CP_ARCHETYPES["Speed Demon"];
    }
  }

  // 10. Default: Rising Star
  return CP_ARCHETYPES["Rising Star"];
}
