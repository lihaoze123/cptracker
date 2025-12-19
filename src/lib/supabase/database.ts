/**
 * Supabase 数据库操作
 * 对应 IndexedDB 的 problems 表
 */

import { createClient } from "./client";
import type { SolvedProblem } from "@/data/mock";

export interface SupabaseProblem {
  id: string; // UUID
  user_id: string;
  题目: string;
  难度: string;
  题解: string;
  关键词: string;
  日期: string;
  created_at: string;
  updated_at: string;
}

// 转换 Supabase 格式到本地格式
export function toLocalProblem(
  problem: SupabaseProblem,
  localId?: number
): SolvedProblem & { supabase_id: string } {
  return {
    id: localId ?? 0,
    supabase_id: problem.id,
    题目: problem.题目,
    难度: problem.难度,
    题解: problem.题解,
    关键词: problem.关键词,
    日期: problem.日期,
  };
}

// 转换本地格式到 Supabase 格式（不含 id 和 user_id）
export function toSupabaseData(problem: Omit<SolvedProblem, "id">) {
  return {
    题目: problem.题目,
    难度: problem.难度,
    题解: problem.题解,
    关键词: problem.关键词,
    日期: problem.日期,
  };
}

export async function fetchAllProblems(): Promise<SupabaseProblem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("problems")
    .select("*")
    .order("日期", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function insertProblem(
  problem: Omit<SolvedProblem, "id">
): Promise<SupabaseProblem> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("problems")
    .insert(toSupabaseData(problem))
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function insertProblems(
  problems: Omit<SolvedProblem, "id">[]
): Promise<SupabaseProblem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("problems")
    .insert(problems.map(toSupabaseData))
    .select();

  if (error) throw error;
  return data ?? [];
}

export async function updateProblemById(
  id: string,
  changes: Partial<Omit<SolvedProblem, "id">>
): Promise<SupabaseProblem> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("problems")
    .update({ ...changes, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
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
