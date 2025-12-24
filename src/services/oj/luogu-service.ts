/**
 * Luogu (洛谷) OJ 集成服务
 */

import type { SolvedProblem } from "@/data/mock";
import type {
  LuoguUserSearchResponse,
  LuoguUserSummary,
  LuoguRecordListResponse,
  LuoguRecord,
  LuoguPracticeResponse,
} from "./oj-types";

const LUOGU_PROXY_BASE = "/api/luogu";

const LUOGU_CF_RATING_MAP: Record<number, number> = {
  // 红 入门 -> 800
  1: 800,
  // 橙 普及- -> 1100
  2: 1100,
  // 黄 普及/提高- -> 1500
  3: 1500,
  // 绿 普及+/提高 -> 1800
  4: 1800,
  // 蓝 提高+/省选- -> 2200
  5: 2200,
  // 紫 省选/NOI- -> 2600
  6: 2600,
  // 黑 NOI/NOI+ -> 3200
  7: 3200,
};

function createLuoguUrl(
  path: string,
  params?: Record<string, string | number | boolean | undefined>
): string {
  const base =
    typeof window === "undefined"
      ? new URL(LUOGU_PROXY_BASE + path, "http://localhost")
      : new URL(LUOGU_PROXY_BASE + path, window.location.origin);

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined) {
      base.searchParams.set(key, String(value));
    }
  });

  return base.toString();
}

async function luoguFetch(
  path: string,
  params?: Record<string, string | number | boolean | undefined>
) {
  const url = createLuoguUrl(path, params);
  const cookie = getLuoguCookie();
  const res = await fetch(url, {
    headers: [
      ["Accept", "application/json"],
      ...(cookie
        ? ([["x-luogu-cookie", cookie]] as [string, string][])
        : []),
    ],
  });

  if (res.status === 404) {
    throw new Error(
      "洛谷代理未开启：本地请使用 `netlify dev` 或配置开发代理到 /.netlify/functions/luogu-proxy"
    );
  }

  return res;
}

function normalizeLuoguRecords(
  records: LuoguRecord[] | Record<string, LuoguRecord>
): LuoguRecord[] {
  return Array.isArray(records) ? records : Object.values(records);
}

function formatTimestamp(seconds: number): number {
  // Convert to milliseconds if needed (Luogu timestamps may be in seconds or milliseconds)
  const millis = seconds > 1e12 ? seconds : seconds * 1000;
  return millis;
}

function luoguDifficultyToCfRating(
  difficulty: number | null | undefined
): string | undefined {
  if (difficulty === null || difficulty === undefined) return undefined;
  const rating = LUOGU_CF_RATING_MAP[difficulty];
  return rating ? rating.toString() : undefined;
}

function buildLuoguCookie(uid: string, clientId: string): string {
  if (!uid || !clientId) return "";
  return `_uid=${uid}; __client_id=${clientId};`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getLuoguCookie(): string {
  if (typeof import.meta !== "undefined") {
    if (import.meta.env?.VITE_LUOGU_COOKIE) {
      return import.meta.env.VITE_LUOGU_COOKIE as string;
    }
    const envUid = import.meta.env?.VITE_LUOGU_UID as string | undefined;
    const envClientId = import.meta.env
      ?.VITE_LUOGU_CLIENT_ID as string | undefined;
    const envCookie = buildLuoguCookie(envUid ?? "", envClientId ?? "");
    if (envCookie) return envCookie;
  }

  if (typeof window !== "undefined") {
    const storedUid = window.localStorage.getItem("luogu_uid") ?? "";
    const storedClient = window.localStorage.getItem("luogu_client_id") ?? "";
    const composed = buildLuoguCookie(storedUid, storedClient);
    if (composed) return composed;

    const legacy = window.localStorage.getItem("luogu_cookie");
    return legacy ?? "";
  }

  return "";
}

/**
 * 解析洛谷用户标识（用户名或 UID）为 UID
 */
async function resolveLuoguUid(identifier: string): Promise<number> {
  if (/^\d+$/.test(identifier)) {
    return Number(identifier);
  }

  const searchResponse = await luoguFetch("/api/user/search", {
    keyword: identifier,
  });

  if (!searchResponse.ok) {
    throw new Error("洛谷用户搜索失败");
  }

  const searchData: LuoguUserSearchResponse = await searchResponse.json();
  const matchedUser = searchData.users
    .filter((u): u is LuoguUserSummary => Boolean(u))
    .find(
      (u) => u.name.toLowerCase() === identifier.toLowerCase()
    ) ?? searchData.users.find((u): u is LuoguUserSummary => Boolean(u));

  if (!matchedUser) {
    throw new Error("未找到对应的洛谷用户");
  }

  return matchedUser.uid;
}

/**
 * 获取洛谷用户的 AC 提交记录
 */
export async function fetchLuogu(handle: string): Promise<SolvedProblem[]> {
  const uid = await resolveLuoguUid(handle);
  const acceptedStatus = 12;
  type LuoguAcceptedRecord = LuoguRecord & { submitTime: number };
  const cookie = getLuoguCookie();
  if (!cookie) {
    throw new Error(
      "洛谷请求需要 Cookie，请先在导入弹窗填写并保存 Cookie"
    );
  }

  // 获取已解决题目列表（包含 vjudge）
  const practiceResponse = await luoguFetch(`/user/${uid}/practice`);

  if (!practiceResponse.ok) {
    throw new Error("获取洛谷练习数据失败");
  }

  const practiceData: LuoguPracticeResponse = await practiceResponse.json();
  const passedProblems = practiceData.data?.passed ?? [];
  const passedSet = new Set(passedProblems.map((p) => p.pid));

  // 延迟以避免请求过快
  await sleep(100);

  // 遍历 AC 记录以收集每道题最早的 AC 时间
  const earliestRecord = new Map<string, LuoguAcceptedRecord>();
  let page = 1;

  while (true) {
    const recordsResponse = await luoguFetch("/record/list", {
      _contentOnly: 1,
      page,
      user: uid,
      status: acceptedStatus,
    });

    if (!recordsResponse.ok) {
      throw new Error("获取洛谷提交记录失败");
    }

    const recordsData: LuoguRecordListResponse = await recordsResponse.json();
    const listData = recordsData.currentData?.records;
    if (!listData) {
      if (page === 1) {
        throw new Error("解析洛谷提交记录失败");
      }
      break;
    }

    const records = normalizeLuoguRecords(listData.result ?? []);
    for (const record of records) {
      if (record.status !== acceptedStatus) continue;
      if (record.submitTime === null) continue;
      const pid = record.problem.pid;
      if (passedSet.size && !passedSet.has(pid)) continue;

      const current = earliestRecord.get(pid);
      if (!current || current.submitTime > record.submitTime) {
        earliestRecord.set(pid, { ...record, submitTime: record.submitTime });
      }
    }

    const perPage = listData.perPage ?? records.length;
    const total = listData.count ?? records.length;
    const reachedEnd =
      perPage === 0 ||
      records.length === 0 ||
      page * perPage >= total;
    if (reachedEnd) break;

    // make chen_zhe happy
    await sleep(500);
    page += 1;
  }

  const problems = Array.from(earliestRecord.values())
    .sort((a, b) => a.submitTime - b.submitTime)
    .map((record, index) => ({
      id: index + 1,
      题目: `https://www.luogu.com.cn/problem/${record.problem.pid}`,
      题目名称: record.problem.title,
      难度: luoguDifficultyToCfRating(record.problem.difficulty),
      题解: "",
      关键词: "",
      日期: formatTimestamp(record.submitTime), // Already returns timestamp in milliseconds
    }));

  return problems;
}

/**
 * 导出 Cookie 获取函数供外部使用
 */
export { getLuoguCookie };
