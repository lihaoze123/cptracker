/**
 * IndexedDB 与 Supabase 同步机制
 *
 * 策略：本地优先 (Local-First)
 * - 所有操作首先写入 IndexedDB
 * - 后台同步到 Supabase
 * - 支持离线操作，上线后自动同步
 */

import { db, type StoredProblem } from "@/lib/db";
import {
  fetchRawProblems,
  insertRawProblem,
  insertRawProblems,
  updateProblemById,
  deleteProblemById,
  deleteAllUserProblems,
} from "./database";
import type { ProblemInput, ProblemUpdate } from "@/types/domain.types";

/**
 * 从云端拉取所有数据并合并到本地
 * 策略：云端数据优先，本地未同步的数据保留
 */
export async function pullFromCloud(): Promise<void> {
  const cloudProblems = await fetchRawProblems();
  const localProblems = await db.problems.toArray();

  // 创建 supabase_id 到本地问题的映射
  const localBySupabaseId = new Map<string, StoredProblem>();
  const localWithoutSupabaseId: StoredProblem[] = [];

  for (const problem of localProblems) {
    if (problem.supabase_id) {
      localBySupabaseId.set(problem.supabase_id, problem);
    } else if (problem.pending_sync) {
      localWithoutSupabaseId.push(problem);
    }
  }

  // 处理云端数据
  for (const cloudProblem of cloudProblems) {
    const localProblem = localBySupabaseId.get(cloudProblem.id);

    if (localProblem) {
      // 云端数据存在于本地，更新本地数据
      await db.problems.update(localProblem.id, {
        题目: cloudProblem.题目,
        难度: cloudProblem.难度,
        题解: cloudProblem.题解,
        关键词: cloudProblem.关键词,
        日期: cloudProblem.日期,
        syncedAt: Date.now(),
        pending_sync: false,
        pending_delete: false,
      });
      localBySupabaseId.delete(cloudProblem.id);
    } else {
      // 云端有但本地没有，添加到本地
      await db.problems.add({
        题目: cloudProblem.题目,
        难度: cloudProblem.难度,
        题解: cloudProblem.题解,
        关键词: cloudProblem.关键词,
        日期: cloudProblem.日期,
        supabase_id: cloudProblem.id,
        syncedAt: Date.now(),
        pending_sync: false,
        pending_delete: false,
      } as StoredProblem);
    }
  }

  // 删除本地有 supabase_id 但云端没有的数据（被其他设备删除）
  for (const [, problem] of localBySupabaseId) {
    if (!problem.pending_sync) {
      await db.problems.delete(problem.id);
    }
  }
}

/**
 * 推送本地待同步的更改到云端
 */
export async function pushToCloud(): Promise<void> {
  const pendingProblems = await db.problems
    .filter((p) => p.pending_sync === true || p.pending_delete === true)
    .toArray();

  for (const problem of pendingProblems) {
    try {
      if (problem.pending_delete && problem.supabase_id) {
        // 删除云端数据
        await deleteProblemById(problem.supabase_id);
        await db.problems.delete(problem.id);
      } else if (problem.pending_sync) {
        if (problem.supabase_id) {
          // 更新云端数据
          await updateProblemById(problem.supabase_id, {
            题目: problem.题目,
            难度: problem.难度,
            题解: problem.题解,
            关键词: problem.关键词,
            日期: problem.日期,
          });
        } else {
          // 新增到云端
          const cloudProblem = await insertRawProblem({
            题目: problem.题目,
            难度: problem.难度,
            题解: problem.题解,
            关键词: problem.关键词,
            日期: problem.日期,
          });
          await db.problems.update(problem.id, {
            supabase_id: cloudProblem.id,
          });
        }
        // 标记同步完成
        await db.problems.update(problem.id, {
          syncedAt: Date.now(),
          pending_sync: false,
        });
      }
    } catch (error) {
      console.error("同步失败:", error);
      // 保留 pending 状态，下次重试
    }
  }
}

/**
 * 完整同步：先推送本地更改，再拉取云端数据
 */
export async function fullSync(): Promise<void> {
  await pushToCloud();
  await pullFromCloud();
}

/**
 * 初始上传：将所有本地数据上传到云端
 * 用于首次启用云端模式时
 */
export async function initialUpload(): Promise<void> {
  const localProblems = await db.problems.toArray();
  const problemsToUpload = localProblems.filter((p) => !p.supabase_id);

  if (problemsToUpload.length === 0) return;

  const cloudProblems = await insertRawProblems(
    problemsToUpload.map((p) => ({
      题目: p.题目,
      难度: p.难度,
      题解: p.题解,
      关键词: p.关键词,
      日期: p.日期,
    }))
  );

  // 更新本地记录的 supabase_id
  for (let i = 0; i < problemsToUpload.length; i++) {
    await db.problems.update(problemsToUpload[i].id, {
      supabase_id: cloudProblems[i].id,
      syncedAt: Date.now(),
      pending_sync: false,
    });
  }
}

/**
 * 从云端下载所有数据（覆盖本地）
 */
export async function downloadFromCloud(): Promise<void> {
  const cloudProblems = await fetchRawProblems();

  // 清空本地数据
  await db.problems.clear();

  // 导入云端数据
  const storedProblems: StoredProblem[] = cloudProblems.map((p) => ({
    题目: p.题目,
    难度: p.难度,
    题解: p.题解,
    关键词: p.关键词,
    日期: p.日期,
    supabase_id: p.id,
    syncedAt: Date.now(),
    pending_sync: false,
    pending_delete: false,
  } as StoredProblem));

  await db.problems.bulkAdd(storedProblems);
}

/**
 * 清空云端数据
 */
export async function clearCloudData(): Promise<void> {
  await deleteAllUserProblems();
}

// ============ 本地操作 + 同步标记 ============

/**
 * 添加问题（标记待同步）
 */
export async function addProblemWithSync(
  problem: ProblemInput
): Promise<number> {
  const id = await db.problems.add({
    ...problem,
    syncedAt: Date.now(),
    pending_sync: true,
  } as StoredProblem);
  return id as number;
}

/**
 * 批量添加问题（标记待同步）
 */
export async function addProblemsWithSync(
  problems: ProblemInput[]
): Promise<number> {
  const storedProblems = problems.map(
    (p) =>
      ({
        ...p,
        syncedAt: Date.now(),
        pending_sync: true,
      }) as StoredProblem
  );
  const lastKey = await db.problems.bulkAdd(storedProblems);
  return lastKey as number;
}

/**
 * 更新问题（标记待同步）
 */
export async function updateProblemWithSync(
  id: number,
  changes: ProblemUpdate
): Promise<void> {
  await db.problems.update(id, {
    ...changes,
    syncedAt: Date.now(),
    pending_sync: true,
  });
}

/**
 * 删除问题（标记待删除）
 */
export async function deleteProblemWithSync(id: number): Promise<void> {
  const problem = await db.problems.get(id);
  if (problem?.supabase_id) {
    // 有云端 ID，标记待删除
    await db.problems.update(id, {
      pending_delete: true,
      pending_sync: false,
    });
  } else {
    // 没有云端 ID，直接删除
    await db.problems.delete(id);
  }
}

/**
 * 导入问题（标记待同步）
 */
export async function importProblemsWithSync(
  problems: ProblemInput[],
  clearExisting = false
): Promise<number> {
  if (clearExisting) {
    // 标记所有现有数据待删除
    const existing = await db.problems.toArray();
    for (const p of existing) {
      if (p.supabase_id) {
        await db.problems.update(p.id, { pending_delete: true });
      } else {
        await db.problems.delete(p.id);
      }
    }
  }

  const storedProblems = problems.map(
    (p) =>
      ({
        ...p,
        syncedAt: Date.now(),
        pending_sync: true,
      }) as StoredProblem
  );
  await db.problems.bulkAdd(storedProblems);
  return storedProblems.length;
}
