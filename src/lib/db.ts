import Dexie, { type EntityTable } from "dexie";
import type { LocalDBProblem } from "@/types/database.types";
import {
  toLocalDBProblem,
  fromLocalDBProblems,
  toLocalDBUpdate,
} from "@/lib/mappers/problem-mapper";
import type { ProblemInput, ProblemUpdate, SolvedProblem } from "@/types/domain.types";

/**
 * IndexedDB 存储模型
 * @deprecated 直接使用 LocalDBProblem 类型
 */
export interface StoredProblem extends LocalDBProblem {}

const db = new Dexie("ProblemsDB") as Dexie & {
  problems: EntityTable<StoredProblem, "id">;
};

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
  }
  const dbProblems = problems.map(toLocalDBProblem) as StoredProblem[];
  await db.problems.bulkAdd(dbProblems);
  return dbProblems.length;
}

export async function getProblemsCount(): Promise<number> {
  return await db.problems.count();
}
