/**
 * Supabase 数据库操作
 * 对应 IndexedDB 的 problems 表
 */

import { createClient } from "./client";
import type {
  SupabaseProblemDB,
  SupabaseProblemCreate,
} from "@/types/database.types";
import {
  toSupabaseCreate,
  toSupabaseUpdate,
  fromSupabaseProblems,
} from "@/lib/mappers/problem-mapper";
import type { ProblemInput, ProblemUpdate, SolvedProblem } from "@/types/domain.types";

/**
 * Supabase 数据库模型
 * @deprecated 直接使用 SupabaseProblemDB 类型
 */
export interface SupabaseProblem extends SupabaseProblemDB {}

// ==================== 重新导出映射函数（保持向后兼容）====================

// 转换 Supabase 格式到本地格式
export function toLocalProblem(
  problem: SupabaseProblemDB,
  localId?: number
): SolvedProblem & { supabase_id: string } {
  return {
    id: localId ?? 0,
    supabase_id: problem.id,
    题目: problem.题目,
    题目名称: problem.题目名称,
    难度: problem.难度,
    题解: problem.题解,
    关键词: problem.关键词,
    日期: problem.日期,
  };
}

// 转换本地格式到 Supabase 格式（不含 id 和 user_id）
export function toSupabaseData(problem: ProblemInput): SupabaseProblemCreate {
  return toSupabaseCreate(problem);
}

// ==================== 数据库操作 ====================

export async function fetchAllProblems(): Promise<SolvedProblem[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("problems")
    .select("*")
    .eq("user_id", user.id)
    .order("日期", { ascending: false });

  if (error) throw error;
  return fromSupabaseProblems(data ?? []);
}

/**
 * 获取原始 Supabase 数据库记录（用于同步）
 */
export async function fetchRawProblems(): Promise<SupabaseProblemDB[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("problems")
    .select("*")
    .eq("user_id", user.id)
    .order("日期", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function insertProblem(
  problem: ProblemInput
): Promise<SolvedProblem> {
  const supabase = createClient();
  const createData = toSupabaseCreate(problem);
  const { data, error } = await supabase
    .from("problems")
    .insert(createData)
    .select()
    .single();

  if (error) throw error;
  return fromSupabaseProblems([data])[0];
}

/**
 * 插入问题并返回原始 Supabase 记录（用于同步）
 */
export async function insertRawProblem(
  problem: ProblemInput
): Promise<SupabaseProblemDB> {
  const supabase = createClient();
  const createData = toSupabaseCreate(problem);
  const { data, error } = await supabase
    .from("problems")
    .insert(createData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function insertProblems(
  problems: ProblemInput[]
): Promise<SolvedProblem[]> {
  const supabase = createClient();
  const createData = problems.map(toSupabaseCreate);
  const { data, error } = await supabase
    .from("problems")
    .insert(createData)
    .select();

  if (error) throw error;
  return fromSupabaseProblems(data ?? []);
}

/**
 * 批量插入问题并返回原始 Supabase 记录（用于同步）
 */
export async function insertRawProblems(
  problems: ProblemInput[]
): Promise<SupabaseProblemDB[]> {
  const supabase = createClient();
  const createData = problems.map(toSupabaseCreate);
  const { data, error } = await supabase
    .from("problems")
    .insert(createData)
    .select();

  if (error) throw error;
  return data ?? [];
}

export async function updateProblemById(
  id: string,
  changes: ProblemUpdate
): Promise<SolvedProblem> {
  const supabase = createClient();
  const updateData = toSupabaseUpdate(changes);
  const { data, error } = await supabase
    .from("problems")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return fromSupabaseProblems([data])[0];
}

export async function deleteProblemById(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("problems").delete().eq("id", id);

  if (error) throw error;
}

export async function deleteAllUserProblems(): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("problems")
    .delete()
    .eq("user_id", user.id);

  if (error) throw error;
}
