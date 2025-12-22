import type { SolvedProblem } from "@/data/mock";

// AtCoder interfaces
interface AtCoderSubmission {
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

interface AtCoderProblemModel {
    slope?: number;
    intercept?: number;
    variance?: number;
    difficulty?: number;
    discrimination?: number;
    irt_loglikelihood?: number;
    irt_users?: number;
    is_experimental?: boolean;
}

type AtCoderProblemModels = Record<string, AtCoderProblemModel>;

interface AtCoderProblem {
    id: string;
    contest_id: string;
    problem_index: string;
    name: string;
    title: string;
}

// Luogu interfaces
interface LuoguUserSummary {
    uid: number;
    name: string;
}

interface LuoguUserSearchResponse {
    users: Array<LuoguUserSummary | null>;
}

interface LuoguProblemSummary {
    pid: string;
    title: string;
    difficulty: number | null;
}

interface LuoguRecord {
    id: number;
    submitTime: number | null;
    status: number;
    problem: LuoguProblemSummary;
}

interface LuoguRecordList {
    result: LuoguRecord[] | Record<string, LuoguRecord>;
    count: number;
    perPage: number | null;
}

interface LuoguRecordListResponse {
    currentData: {
        records: LuoguRecordList;
    };
}

interface LuoguPracticeData {
    passed: LuoguProblemSummary[];
}

interface LuoguPracticeResponse {
    data: LuoguPracticeData;
}

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

function createLuoguUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
    const base = typeof window === "undefined"
        ? new URL(LUOGU_PROXY_BASE + path, "http://localhost")
        : new URL(LUOGU_PROXY_BASE + path, window.location.origin);

    Object.entries(params ?? {}).forEach(([key, value]) => {
        if (value !== undefined) {
            base.searchParams.set(key, String(value));
        }
    });

    return base.toString();
}

async function luoguFetch(path: string, params?: Record<string, string | number | boolean | undefined>) {
    const url = createLuoguUrl(path, params);
    const cookie = getLuoguCookie();
    const res = await fetch(url, {
        headers: [
            ["Accept", "application/json"],
            ...(cookie ? [["x-luogu-cookie", cookie]] as [string, string][] : []),
        ],
    });

    if (res.status === 404) {
        throw new Error("洛谷代理未开启：本地请使用 `netlify dev` 或配置开发代理到 /.netlify/functions/luogu-proxy");
    }

    return res;
}

// AtCoder difficulty clipping function
function clipDifficulty(difficulty: number): number {
    return Math.round(
        difficulty >= 400 ? difficulty : 400 / Math.exp(1.0 - difficulty / 400)
    );
}

// Convert AtCoder difficulty to Codeforces rating equivalent
function convertAC2CFrating(a: number): number {
    const x1 = 0;
    const x2 = 3900;
    const y1 = -1000 + 60;
    const y2 = 4130 + 85;
    const res = ((x2 * (a - y1)) + (x1 * (y2 - a))) / (y2 - y1);
    return res | 0;
}

// Codeforces interfaces
interface CodeforcesSubmission {
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

interface CodeforcesResponse {
    status: string;
    result: CodeforcesSubmission[];
}

export async function fetchCodeforces(handle: string): Promise<SolvedProblem[]> {
    const response = await fetch(`https://codeforces.com/api/user.status?handle=${handle}`);
    const data: CodeforcesResponse = await response.json();

    if (data.status !== "OK") {
        throw new Error("Failed to fetch Codeforces submissions");
    }

    const solvedMap = new Map<string, CodeforcesSubmission>();

    for (const submission of data.result) {
        if (submission.verdict === "OK") {
            const problemKey = `${submission.contestId}-${submission.problem.index}`;
            if (!solvedMap.has(problemKey) ||
                submission.creationTimeSeconds < solvedMap.get(problemKey)!.creationTimeSeconds) {
                solvedMap.set(problemKey, submission);
            }
        }
    }

    const problems: SolvedProblem[] = [];
    let id = 1;

    for (const submission of solvedMap.values()) {
        const date = new Date(submission.creationTimeSeconds * 1000);
        const dateStr = date.toISOString().replace("T", " ").slice(0, 19);

        problems.push({
            id: id++,
            题目: `https://codeforces.com/contest/${submission.contestId}/problem/${submission.problem.index}`,
            题目名称: submission.problem.name,
            难度: submission.problem.rating?.toString(),
            题解: "",
            关键词: submission.problem.tags.join(", "),
            日期: dateStr,
        });
    }

    return problems;
}

export async function fetchAtCoder(handle: string): Promise<SolvedProblem[]> {
    // Fetch submissions, problem models, and problem names in parallel
    const [submissionsResponse, modelsResponse, problemsResponse] = await Promise.all([
        fetch(`https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=${handle}&from_second=0`),
        fetch(`https://kenkoooo.com/atcoder/resources/problem-models.json`),
        fetch(`https://kenkoooo.com/atcoder/resources/problems.json`),
    ]);

    const submissions: AtCoderSubmission[] = await submissionsResponse.json();
    const problemModels: AtCoderProblemModels = await modelsResponse.json();
    const problemsData: AtCoderProblem[] = await problemsResponse.json();

    // Create a map from problem_id to problem name
    const problemNames = new Map<string, string>();
    for (const problem of problemsData) {
        problemNames.set(problem.id, problem.name);
    }

    // Filter AC submissions and keep earliest solve for each problem
    const solvedMap = new Map<string, AtCoderSubmission>();

    for (const submission of submissions) {
        if (submission.result === "AC") {
            const problemKey = submission.problem_id;
            if (!solvedMap.has(problemKey) ||
                submission.epoch_second < solvedMap.get(problemKey)!.epoch_second) {
                solvedMap.set(problemKey, submission);
            }
        }
    }

    const problems: SolvedProblem[] = [];
    let id = 1;

    for (const submission of solvedMap.values()) {
        const date = new Date(submission.epoch_second * 1000);
        const dateStr = date.toISOString().replace("T", " ").slice(0, 19);

        // Get difficulty and convert to CF rating
        const model = problemModels[submission.problem_id];
        let difficultyStr = "";
        if (model?.difficulty !== undefined) {
            const clippedDifficulty = clipDifficulty(model.difficulty);
            const cfRating = convertAC2CFrating(clippedDifficulty);
            difficultyStr = cfRating.toString();
        }

        // Get problem name
        const problemName = problemNames.get(submission.problem_id);

        problems.push({
            id: id++,
            题目: `https://atcoder.jp/contests/${submission.contest_id}/tasks/${submission.problem_id}`,
            题目名称: problemName,
            难度: difficultyStr || undefined,
            题解: "",
            关键词: "",
            日期: dateStr,
        });
    }

    return problems;
}

// Resolve Luogu UID from either numeric id or username
async function resolveLuoguUid(identifier: string): Promise<number> {
    if (/^\d+$/.test(identifier)) {
        return Number(identifier);
    }

    const searchResponse = await luoguFetch("/api/user/search", { keyword: identifier });

    if (!searchResponse.ok) {
        throw new Error("洛谷用户搜索失败");
    }

    const searchData: LuoguUserSearchResponse = await searchResponse.json();
    const matchedUser = searchData.users
        .filter((u): u is LuoguUserSummary => Boolean(u))
        .find((u) => u.name.toLowerCase() === identifier.toLowerCase())
        ?? searchData.users.find((u): u is LuoguUserSummary => Boolean(u));

    if (!matchedUser) {
        throw new Error("未找到对应的洛谷用户");
    }

    return matchedUser.uid;
}

function normalizeLuoguRecords(records: LuoguRecord[] | Record<string, LuoguRecord>): LuoguRecord[] {
    return Array.isArray(records) ? records : Object.values(records);
}

function formatTimestamp(seconds: number): string {
    const millis = seconds > 1e12 ? seconds : seconds * 1000;
    const date = new Date(millis);
    return date.toISOString().replace("T", " ").slice(0, 19);
}

function luoguDifficultyToCfRating(difficulty: number | null | undefined): string | undefined {
    if (difficulty === null || difficulty === undefined) return undefined;
    const rating = LUOGU_CF_RATING_MAP[difficulty];
    return rating ? rating.toString() : undefined;
}

function buildLuoguCookie(uid: string, clientId: string): string {
    if (!uid || !clientId) return "";
    return `_uid=${uid}; __client_id=${clientId};`;
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchLuogu(handle: string): Promise<SolvedProblem[]> {
    const uid = await resolveLuoguUid(handle);
    const acceptedStatus = 12;
    type LuoguAcceptedRecord = LuoguRecord & { submitTime: number };
    const cookie = getLuoguCookie();
    if (!cookie) {
        throw new Error("洛谷请求需要 Cookie，请先在导入弹窗填写并保存 Cookie");
    }

    // Fetch solved list to know which problems were passed (covers vjudge as well)
    const practiceResponse = await luoguFetch(`/user/${uid}/practice`);

    if (!practiceResponse.ok) {
        throw new Error("获取洛谷练习数据失败");
    }

    const practiceData: LuoguPracticeResponse = await practiceResponse.json();
    const passedProblems = practiceData.data?.passed ?? [];
    const passedSet = new Set(passedProblems.map((p) => p.pid));

    // Add delay before fetching records
    await sleep(100);

    // Traverse accepted records to collect earliest AC time per problem
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
        const reachedEnd = perPage === 0 || records.length === 0 || page * perPage >= total;
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
            日期: formatTimestamp(record.submitTime),
        }));

    return problems;
}

function getLuoguCookie(): string {
    if (typeof import.meta !== "undefined") {
        if (import.meta.env?.VITE_LUOGU_COOKIE) {
            return import.meta.env.VITE_LUOGU_COOKIE as string;
        }
        const envUid = import.meta.env?.VITE_LUOGU_UID as string | undefined;
        const envClientId = import.meta.env?.VITE_LUOGU_CLIENT_ID as string | undefined;
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
