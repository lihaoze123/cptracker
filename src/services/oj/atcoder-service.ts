/**
 * AtCoder OJ 集成服务
 */

import type { SolvedProblem } from "@/data/mock";
import type {
  AtCoderSubmission,
  AtCoderProblemModels,
  AtCoderProblem,
} from "./oj-types";

/**
 * AtCoder 难度裁剪函数
 */
function clipDifficulty(difficulty: number): number {
  return Math.round(
    difficulty >= 400
      ? difficulty
      : 400 / Math.exp(1.0 - difficulty / 400)
  );
}

/**
 * 将 AtCoder 难度转换为 Codeforces 等级
 */
function convertAC2CFrating(a: number): number {
  const x1 = 0;
  const x2 = 3900;
  const y1 = -1000 + 60;
  const y2 = 4130 + 85;
  const res = ((x2 * (a - y1)) + x1 * (y2 - a)) / (y2 - y1);
  return res | 0;
}

/**
 * 获取 AtCoder 用户的 AC 提交记录
 */
export async function fetchAtCoder(handle: string): Promise<SolvedProblem[]> {
  // 并行获取提交记录、题目模型和题目名称
  const [submissionsResponse, modelsResponse, problemsResponse] =
    await Promise.all([
      fetch(
        `https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=${handle}&from_second=0`
      ),
      fetch("https://kenkoooo.com/atcoder/resources/problem-models.json"),
      fetch("https://kenkoooo.com/atcoder/resources/problems.json"),
    ]);

  const submissions: AtCoderSubmission[] =
    await submissionsResponse.json();
  const problemModels: AtCoderProblemModels = await modelsResponse.json();
  const problemsData: AtCoderProblem[] = await problemsResponse.json();

  // 创建题目 ID 到名称的映射
  const problemNames = new Map<string, string>();
  for (const problem of problemsData) {
    problemNames.set(problem.id, problem.name);
  }

  // 筛选 AC 提交并保留每道题最早的通过记录
  const solvedMap = new Map<string, AtCoderSubmission>();

  for (const submission of submissions) {
    if (submission.result === "AC") {
      const problemKey = submission.problem_id;
      if (
        !solvedMap.has(problemKey) ||
        submission.epoch_second < solvedMap.get(problemKey)!.epoch_second
      ) {
        solvedMap.set(problemKey, submission);
      }
    }
  }

  const problems: SolvedProblem[] = [];
  let id = 1;

  for (const submission of solvedMap.values()) {
    // Convert Unix timestamp (seconds) to milliseconds
    const timestamp = submission.epoch_second * 1000;

    // 获取难度并转换为 CF 等级
    const model = problemModels[submission.problem_id];
    let difficultyStr = "";
    if (model?.difficulty !== undefined) {
      const clippedDifficulty = clipDifficulty(model.difficulty);
      const cfRating = convertAC2CFrating(clippedDifficulty);
      difficultyStr = cfRating.toString();
    }

    // 获取题目名称
    const problemName = problemNames.get(submission.problem_id);

    problems.push({
      id: id++,
      题目: `https://atcoder.jp/contests/${submission.contest_id}/tasks/${submission.problem_id}`,
      题目名称: problemName,
      难度: difficultyStr || undefined,
      题解: "",
      关键词: "",
      日期: timestamp,
    });
  }

  return problems;
}
