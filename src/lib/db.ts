import Dexie, { type EntityTable } from "dexie";
import type { LocalDBProblem } from "@/types/database.types";
import {
  toLocalDBProblem,
  fromLocalDBProblems,
  toLocalDBUpdate,
} from "@/lib/mappers/problem-mapper";
import type { ProblemInput, ProblemUpdate, SolvedProblem } from "@/types/domain.types";
import { legacyDateStringToTimestamp } from "@/services/date-service";

/**
 * IndexedDB 存储模型
 * @deprecated 直接使用 LocalDBProblem 类型
 */
export interface StoredProblem extends LocalDBProblem {}

const db = new Dexie("ProblemsDB") as Dexie & {
  problems: EntityTable<StoredProblem, "id">;
};

// Version 4: 日期字段从字符串改为时间戳（毫秒）
db.version(4).stores({
  problems: "++id, 难度, 日期, 题目名称, syncedAt, supabase_id, pending_sync, pending_delete",
}).upgrade(async (tx) => {
  // 迁移版本 3 到版本 4：将字符串日期转换为时间戳
  await tx.table("problems").toCollection().modify((problem) => {
    if (typeof problem.日期 === "string") {
      problem.日期 = legacyDateStringToTimestamp(problem.日期);
    }
  });
});

// Version 3: 原有版本
db.version(3).stores({
  problems: "++id, 难度, 日期, 题目名称, syncedAt, supabase_id, pending_sync, pending_delete",
});

export { db };

export async function getAllProblems(): Promise<SolvedProblem[]> {
  const dbProblems = await db.problems.toArray();
  return fromLocalDBProblems(dbProblems);
}

export async function addProblem(
  problem: ProblemInput
): Promise<number> {
  const dbProblem = toLocalDBProblem(problem);
  const id = await db.problems.add(dbProblem as StoredProblem);
  return id as number;
}

export async function addProblems(
  problems: ProblemInput[]
): Promise<number> {
  const dbProblems = problems.map(toLocalDBProblem) as StoredProblem[];
  const lastKey = await db.problems.bulkAdd(dbProblems);
  return lastKey as number;
}

export async function updateProblem(
  id: number,
  changes: ProblemUpdate
): Promise<void> {
  const dbUpdate = toLocalDBUpdate(changes);
  await db.problems.update(id, dbUpdate);
}

export async function deleteProblem(id: number): Promise<void> {
  await db.problems.delete(id);
}

export async function deleteAllProblems(): Promise<void> {
  await db.problems.clear();
}

export async function importProblems(
  problems: ProblemInput[],
  clearExisting = false
): Promise<number> {
  if (clearExisting) {
    await db.problems.clear();
    const dbProblems = problems.map(toLocalDBProblem) as StoredProblem[];
    await db.problems.bulkAdd(dbProblems);
    return dbProblems.length;
  }

  // 去重导入：按题目 URL 合并，保留最新的日期
  const existingProblems = await db.problems.toArray();
  const problemMap = new Map<string, StoredProblem>();

  // 先将现有题目按 URL 建立 map
  for (const p of existingProblems) {
    problemMap.set(p.题目, p);
  }

  // 合并新题目，保留日期更新的记录
  for (const problem of problems) {
    const existing = problemMap.get(problem.题目);
    if (!existing || problem.日期 > existing.日期) {
      const dbProblem = toLocalDBProblem(problem) as StoredProblem;
      if (existing) {
        // 更新现有记录
        await db.problems.update(existing.id, dbProblem);
      } else {
        // 新增记录
        await db.problems.add(dbProblem);
      }
      problemMap.set(problem.题目, dbProblem);
    }
  }

  return problemMap.size;
}

export async function getProblemsCount(): Promise<number> {
  return await db.problems.count();
}
