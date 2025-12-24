/**
 * 数据库模型类型
 * 存储层特定的数据模型，与具体存储实现相关
 */

/**
 * IndexedDB 本地存储模型
 */
export interface LocalDBProblem {
  id: number;
  题目: string;
  题目名称?: string;
  难度?: string;
  题解: string;
  关键词: string;
  日期: string;
  syncedAt: number;
  supabase_id?: string;
  pending_sync?: boolean;
  pending_delete?: boolean;
}

/**
 * Supabase 云端存储模型
 */
export interface SupabaseProblemDB {
  id: string;
  user_id: string;
  题目: string;
  题目名称?: string;
  难度?: string;
  题解: string;
  关键词: string;
  日期: string;
  created_at: string;
  updated_at: string;
}

/**
 * 用于创建 Supabase 问题的数据（不含 id, user_id, timestamps）
 */
export interface SupabaseProblemCreate {
  题目: string;
  题目名称?: string;
  难度?: string;
  题解: string;
  关键词: string;
  日期: string;
}

/**
 * 用于更新 Supabase 问题的数据
 */
export interface SupabaseProblemUpdate {
  题目?: string;
  题目名称?: string;
  难度?: string;
  题解?: string;
  关键词?: string;
  日期?: string;
  updated_at: string;
}
