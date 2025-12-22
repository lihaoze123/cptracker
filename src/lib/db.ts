import Dexie, { type EntityTable } from "dexie";
import type { SolvedProblem } from "@/data/mock";

export interface StoredProblem extends SolvedProblem {
  syncedAt: number;
  supabase_id?: string; // 云端同步时的 Supabase UUID
  pending_sync?: boolean; // 标记需要同步到云端
  pending_delete?: boolean; // 标记需要从云端删除
}

const db = new Dexie("ProblemsDB") as Dexie & {
  problems: EntityTable<StoredProblem, "id">;
};

db.version(3).stores({
  problems: "++id, 难度, 日期, 题目名称, syncedAt, supabase_id, pending_sync, pending_delete",
});

export { db };

export async function getAllProblems(): Promise<StoredProblem[]> {
  return await db.problems.toArray();
}

export async function addProblem(
  problem: Omit<SolvedProblem, "id">
): Promise<number> {
  const id = await db.problems.add({
    ...problem,
    syncedAt: Date.now(),
  } as StoredProblem);
  return id as number;
}

export async function addProblems(
  problems: Omit<SolvedProblem, "id">[]
): Promise<number> {
  const storedProblems = problems.map((p) => ({
    ...p,
    syncedAt: Date.now(),
  })) as StoredProblem[];
  const lastKey = await db.problems.bulkAdd(storedProblems);
  return lastKey as number;
}

export async function updateProblem(
  id: number,
  changes: Partial<SolvedProblem>
): Promise<void> {
  await db.problems.update(id, { ...changes, syncedAt: Date.now() });
}

export async function deleteProblem(id: number): Promise<void> {
  await db.problems.delete(id);
}

export async function deleteAllProblems(): Promise<void> {
  await db.problems.clear();
}

export async function importProblems(
  problems: Omit<SolvedProblem, "id">[],
  clearExisting = false
): Promise<number> {
  if (clearExisting) {
    await db.problems.clear();
  }
  const storedProblems = problems.map((p) => ({
    ...p,
    syncedAt: Date.now(),
  })) as StoredProblem[];
  await db.problems.bulkAdd(storedProblems);
  return storedProblems.length;
}

export async function getProblemsCount(): Promise<number> {
  return await db.problems.count();
}
