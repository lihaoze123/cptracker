import type { OJAdapter, ProblemInfo } from './types';

const CODEFORCES_ORIGIN = 'https://codeforces.com';

export function detectCodeforces(url: string): boolean {
  return url.includes('codeforces.com');
}

export function extractCodeforcesInfo(): ProblemInfo | null {
  const url = window.location.href;

  if (url.includes('/problem/')) {
    return extractFromProblemPage();
  }

  if (url.includes('/submission/')) {
    return extractFromSubmissionPage();
  }

  return null;
}

export function resolveCodeforcesSubmissionUrl(info: ProblemInfo): string {
  const currentUrl = info.url || window.location.href;
  const match = currentUrl.match(/codeforces\.com\/contest\/(\d+)/);
  if (!match) return '';
  return `${CODEFORCES_ORIGIN}/contest/${match[1]}/submission`;
}

export const codeforcesAdapter: OJAdapter = {
  id: 'codeforces',
  detect: detectCodeforces,
  extractInfo: extractCodeforcesInfo,
  resolveSubmissionUrl: resolveCodeforcesSubmissionUrl,
  ratingResourceRegex: 'codeforces',
};

function extractFromProblemPage(): ProblemInfo {
  const nameEl = document.querySelector('#pageContent > div.problemindexholder > div.ttypography > div > div.header > div.title');
  const name = normalizeProblemName(nameEl?.textContent?.trim() || '');

  // Tags
  const tags: string[] = [];
  const tagsContainer = document.querySelector('#sidebar > div:nth-child(12) > div:nth-child(2)');
  if (tagsContainer) {
    const tagBoxes = tagsContainer.querySelectorAll('.tag-box');
    tags.push(...Array.from(tagBoxes).map(el => el.textContent?.trim()).filter(Boolean) as string[]);
  }

  // 查找提交链接
  const submissionEl = document.querySelector<HTMLAnchorElement>(
    '#sidebar > div:nth-child(11) > table > tbody > tr:nth-child(2) > td.left.bottom > a, ' +
    '#sidebar .my-submissions a, ' +
    '#sidebar a[href*="/submission/"]'
  );
  const submissionUrl = submissionEl?.getAttribute('href') || '';

  // 查找通过时间
  const solvedTime = findSolvedTime();

  return {
    url: window.location.href,
    name,
    tags,
    code: '',
    solvedTime,
    submissionUrl: submissionUrl || undefined,
  };
}

function findSolvedTime(): number | undefined {
  // 先尝试特定选择器
  const specificSelectors = [
    '#sidebar > div:nth-child(11) > table > tbody > tr:nth-child(2) > td:nth-child(2)',
    '#sidebar > div:nth-child(12) > table > tbody > tr:nth-child(2) > td:nth-child(2)',
  ];

  for (const selector of specificSelectors) {
    const timeEl = document.querySelector(selector);
    const timeStr = timeEl?.textContent?.trim();
    if (timeStr) {
      const time = parseCFTime(timeStr);
      if (time) return time;
    }
  }

  // 从所有表格中查找 Accepted 的行
  const rows = document.querySelectorAll('#sidebar table tr');
  for (const row of Array.from(rows)) {
    const cells = row.querySelectorAll('td');
    const verdictCell = cells[4];
    if (verdictCell?.textContent?.includes('Accepted')) {
      const timeCell = cells[1];
      const timeStr = timeCell?.textContent?.trim();
      if (timeStr) {
        const time = parseCFTime(timeStr);
        if (time) return time;
      }
    }
  }

  return undefined;
}

function extractFromSubmissionPage(): ProblemInfo {
  // 题目链接
  const urlEl = document.querySelector<HTMLAnchorElement>(
    '#pageContent > div.datatable > div:nth-child(6) > table > tbody > tr.highlighted-row > td:nth-child(3) > a, ' +
    '#sidebar > div:nth-child(11) > table > tbody > tr:nth-child(2) > td.left.bottom > a'
  );
  const url = urlEl?.getAttribute('href') || '';
  const name = normalizeProblemName(urlEl?.textContent?.trim() || '');

  // 解题代码
  const codeEl = document.querySelector('#program-source-text') as HTMLElement | null;
  const code = codeEl?.innerText || '';

  // 通过时间和语言
  let solvedTime: number | undefined;
  let language: string | undefined;
  const highlightedRow = document.querySelector('#pageContent > div.datatable tr.highlighted-row');
  if (highlightedRow) {
    const cells = highlightedRow.querySelectorAll('td');
    const sentCell = cells[7];
    if (sentCell?.textContent) {
      solvedTime = parseCFTime(sentCell.textContent.trim());
    }
    const langCell = cells[3];
    if (langCell?.textContent) {
      language = parseLanguage(langCell.textContent.trim());
    }
  }

  return {
    url: url.startsWith('http') ? url : `${CODEFORCES_ORIGIN}${url}`,
    name,
    code,
    solvedTime,
    tags: [],
    language,
  };
}

function normalizeProblemName(raw: string): string {
  return raw.replace(/^[A-Z]\d*\.?\s*[-–]?\s*/, '').trim();
}

// 解析 Codeforces 语言标识
function parseLanguage(langText: string): string {
  const langLower = langText.toLowerCase();
  if (langLower.includes('c++') || langLower.includes('gnu c++')) return 'cpp';
  if (langLower.includes('python') || langLower.includes('pypy')) return 'python';
  if (langLower.includes('java') || langLower.includes('openjdk')) return 'java';
  if (langLower.includes('javascript') || langLower.includes('node')) return 'javascript';
  if (langLower.includes('rust')) return 'rust';
  if (langLower.includes('go') || langLower.includes('golang')) return 'go';
  return 'other';
}

function parseCFTime(timeStr: string): number | undefined {
  if (!timeStr) return undefined;

  // Codeforces 使用莫斯科时区 (UTC+3)
  const MSK_OFFSET = 3 * 60 * 60 * 1000;

  // ISO 格式: 2026-02-23 18:54:06
  const isoMatch = timeStr.match(/^(\d+)-(\d+)-(\d+)\s+(\d+):(\d+):(\d+)$/);
  if (isoMatch) {
    const [, year, month, day, hour, min, sec] = isoMatch;
    const utcTimestamp = Date.UTC(+year, +month - 1, +day, +hour, +min, +sec);
    return utcTimestamp - MSK_OFFSET;
  }

  // 月/日/年格式: Feb/23/2026 18:54:06 或 Feb/23/2026 18:54
  const monthMatch = timeStr.match(/^(\w+)\/(\d+)\/(\d+)\s+(\d+):(\d+)(?::(\d+))?$/);
  if (monthMatch) {
    const months: Record<string, number> = {
      Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
      Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
    };
    const [, monthStr, day, year, hour, min, sec] = monthMatch;
    const utcTimestamp = Date.UTC(+year, months[monthStr], +day, +hour, +min, sec ? +sec : 0);
    return utcTimestamp - MSK_OFFSET;
  }

  return undefined;
}
