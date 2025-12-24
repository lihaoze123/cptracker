/**
 * Codeforces OJ 集成服务
 */

import type { SolvedProblem } from "@/data/mock";
import type { CodeforcesResponse } from "./oj-types";

/**
 * 获取 Codeforces 用户的 AC 提交记录
 */
export async function fetchCodeforces(handle: string): Promise<SolvedProblem[]> {
  const response = await fetch(
    `https://codeforces.com/api/user.status?handle=${handle}`
  );
  const data: CodeforcesResponse = await response.json();

  if (data.status !== "OK") {
    throw new Error("Failed to fetch Codeforces submissions");
  }

  const solvedMap = new Map<string, CodeforcesResponse["result"][number]>();

  for (const submission of data.result) {
    if (submission.verdict === "OK") {
      const problemKey = `${submission.contestId}-${submission.problem.index}`;
      if (
        !solvedMap.has(problemKey) ||
        submission.creationTimeSeconds <
          solvedMap.get(problemKey)!.creationTimeSeconds
      ) {
        solvedMap.set(problemKey, submission);
      }
    }
  }

  const problems: SolvedProblem[] = [];
  let id = 1;

  for (const submission of solvedMap.values()) {
    // Convert Unix timestamp (seconds) to milliseconds
    const timestamp = submission.creationTimeSeconds * 1000;

    problems.push({
      id: id++,
      题目: `https://codeforces.com/contest/${submission.contestId}/problem/${submission.problem.index}`,
      题目名称: submission.problem.name,
      难度: submission.problem.rating?.toString(),
      题解: "",
      关键词: submission.problem.tags.join(", "),
      日期: timestamp,
    });
  }

  return problems;
}
