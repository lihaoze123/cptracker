/**
 * 领域模型类型
 * 核心的业务实体定义
 */

/**
 * 已解决的题目（领域模型）
 * 这是应用的核心数据类型
 */
export interface SolvedProblem {
  id: number;
  题目: string;
  题目名称?: string;
  难度?: string;
  题解: string;
  关键词: string;
  日期: number; // Unix timestamp in milliseconds (UTC)
  supabase_id?: string;
}

/**
 * 用于创建新题目的输入类型（不包含 id）
 */
export type ProblemInput = Omit<SolvedProblem, "id">;

/**
 * 用于更新题目的类型（所有字段都是可选的）
 */
export type ProblemUpdate = Partial<SolvedProblem>;

/**
 * 题目统计信息
 */
export interface ProblemStats {
  total: number;
  thisWeek: number;
  thisMonth: number;
  thisYear: number;
}
