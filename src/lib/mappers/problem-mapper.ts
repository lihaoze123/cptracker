/**
 * 问题数据映射器
 * 负责领域模型与数据库模型之间的转换
 * 降低存储层与业务层的耦合度
 */

import type {
  SolvedProblem,
  ProblemInput,
  ProblemUpdate,
} from "@/types/domain.types";
import type {
  LocalDBProblem,
  SupabaseProblemDB,
  SupabaseProblemCreate,
  SupabaseProblemUpdate,
} from "@/types/database.types";

// ==================== IndexedDB 映射 ====================

/**
 * 领域模型 → LocalDB 模型 (用于新增)
 */
export function toLocalDBProblem(problem: ProblemInput): Omit<LocalDBProblem, "id"> {
  return {
    题目: problem.题目,
    题目名称: problem.题目名称,
    难度: problem.难度,
    题解: problem.题解,
    关键词: problem.关键词,
    日期: problem.日期,
    syncedAt: Date.now(),
    supabase_id: problem.supabase_id,
  };
}

/**
 * LocalDB 模型 → 领域模型
 */
export function fromLocalDBProblem(dbProblem: LocalDBProblem): SolvedProblem {
  return {
    id: dbProblem.id,
    题目: dbProblem.题目,
    题目名称: dbProblem.题目名称,
    难度: dbProblem.难度,
    题解: dbProblem.题解,
    关键词: dbProblem.关键词,
    日期: dbProblem.日期,
    supabase_id: dbProblem.supabase_id,
  };
}

/**
 * 批量转换 LocalDB → 领域模型
 */
export function fromLocalDBProblems(dbProblems: LocalDBProblem[]): SolvedProblem[] {
  return dbProblems.map(fromLocalDBProblem);
}

/**
 * 领域模型更新 → LocalDB 更新数据
 */
export function toLocalDBUpdate(changes: ProblemUpdate): Partial<LocalDBProblem> {
  const update: Partial<LocalDBProblem> = {
    ...changes,
    syncedAt: Date.now(),
  };
  return update;
}

// ==================== Supabase 映射 ====================

/**
 * 领域模型 → Supabase 创建数据
 */
export function toSupabaseCreate(problem: ProblemInput): SupabaseProblemCreate {
  return {
    题目: problem.题目,
    题目名称: problem.题目名称,
    难度: problem.难度,
    题解: problem.题解,
    关键词: problem.关键词,
    日期: problem.日期,
  };
}

/**
 * 领域模型更新 → Supabase 更新数据
 */
export function toSupabaseUpdate(changes: ProblemUpdate): SupabaseProblemUpdate {
  const { id, supabase_id, ...data } = changes;
  return {
    ...data,
    updated_at: new Date().toISOString(),
  } as SupabaseProblemUpdate;
}

/**
 * Supabase 模型 → 领域模型
 */
export function fromSupabaseProblem(
  dbProblem: SupabaseProblemDB,
  localId?: number
): SolvedProblem {
  return {
    id: localId ?? 0,
    supabase_id: dbProblem.id,
    题目: dbProblem.题目,
    题目名称: dbProblem.题目名称,
    难度: dbProblem.难度,
    题解: dbProblem.题解,
    关键词: dbProblem.关键词,
    日期: dbProblem.日期,
  };
}

/**
 * 批量转换 Supabase → 领域模型
 */
export function fromSupabaseProblems(
  dbProblems: SupabaseProblemDB[]
): SolvedProblem[] {
  return dbProblems.map((p) => fromSupabaseProblem(p));
}

// ==================== 跨存储映射 ====================

/**
 * LocalDB → Supabase 创建数据
 * 用于本地数据上传到云端
 */
export function localDBToSupabaseCreate(dbProblem: LocalDBProblem): SupabaseProblemCreate {
  return {
    题目: dbProblem.题目,
    题目名称: dbProblem.题目名称,
    难度: dbProblem.难度,
    题解: dbProblem.题解,
    关键词: dbProblem.关键词,
    日期: dbProblem.日期,
  };
}

/**
 * Supabase → LocalDB 创建数据 (不含 id)
 * 用于云端数据下载到本地
 */
export function supabaseToLocalDBCreate(
  dbProblem: SupabaseProblemDB
): Omit<LocalDBProblem, "id"> {
  return {
    题目: dbProblem.题目,
    题目名称: dbProblem.题目名称,
    难度: dbProblem.难度,
    题解: dbProblem.题解,
    关键词: dbProblem.关键词,
    日期: dbProblem.日期,
    syncedAt: Date.now(),
    supabase_id: dbProblem.id,
  };
}
