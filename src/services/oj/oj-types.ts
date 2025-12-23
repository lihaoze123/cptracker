/**
 * OJ 集成的共享类型定义
 */

// Codeforces types
export interface CodeforcesSubmission {
  id: number;
  contestId: number;
  creationTimeSeconds: number;
  problem: {
    contestId: number;
    index: string;
    name: string;
    rating?: number;
    tags: string[];
  };
  verdict: string;
}

export interface CodeforcesResponse {
  status: string;
  result: CodeforcesSubmission[];
}

// AtCoder types
export interface AtCoderSubmission {
  id: number;
  epoch_second: number;
  problem_id: string;
  contest_id: string;
  user_id: string;
  language: string;
  point: number;
  length: number;
  result: string;
  execution_time: number | null;
}

export interface AtCoderProblemModel {
  slope?: number;
  intercept?: number;
  variance?: number;
  difficulty?: number;
  discrimination?: number;
  irt_loglikelihood?: number;
  irt_users?: number;
  is_experimental?: boolean;
}

export type AtCoderProblemModels = Record<string, AtCoderProblemModel>;

export interface AtCoderProblem {
  id: string;
  contest_id: string;
  problem_index: string;
  name: string;
  title: string;
}

// Luogu types
export interface LuoguUserSummary {
  uid: number;
  name: string;
}

export interface LuoguUserSearchResponse {
  users: Array<LuoguUserSummary | null>;
}

export interface LuoguProblemSummary {
  pid: string;
  title: string;
  difficulty: number | null;
}

export interface LuoguRecord {
  id: number;
  submitTime: number | null;
  status: number;
  problem: LuoguProblemSummary;
}

export interface LuoguRecordList {
  result: LuoguRecord[] | Record<string, LuoguRecord>;
  count: number;
  perPage: number | null;
}

export interface LuoguRecordListResponse {
  currentData: {
    records: LuoguRecordList;
  };
}

export interface LuoguPracticeData {
  passed: LuoguProblemSummary[];
}

export interface LuoguPracticeResponse {
  data: LuoguPracticeData;
}

// Common OJ types
export interface OJProblem {
  title: string;
  difficulty: string;
  url: string;
  tags?: string[];
}

export type OJName = 'codeforces' | 'atcoder' | 'luogu';
