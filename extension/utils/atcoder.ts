import type { OJAdapter, ProblemInfo } from './types';

const ATCODER_ORIGIN = 'https://atcoder.jp';
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

export function detectAtCoder(url: string): boolean {
  return url.includes('atcoder.jp');
}

export async function extractAtCoderInfo(): Promise<ProblemInfo | null> {
  const parsedUrl = new URL(window.location.href);
  const pathname = parsedUrl.pathname;

  if (pathname.includes('/tasks/')) {
    return extractFromTaskPage(parsedUrl);
  }

  if (/\/submissions\/\d+\/?$/.test(pathname)) {
    return await extractFromSubmissionDetailPage();
  }

  if (pathname.includes('/submissions')) {
    return extractFromSubmissionListPage(parsedUrl);
  }

  return null;
}

export function resolveAtCoderSubmissionUrl(info: ProblemInfo): string {
  const currentUrl = info.url || window.location.href;
  try {
    const parsedUrl = new URL(currentUrl, ATCODER_ORIGIN);
    return buildFilteredAcSubmissionUrl(parsedUrl) || '';
  } catch {
    return '';
  }
}

export const atcoderAdapter: OJAdapter = {
  id: 'atcoder',
  detect: detectAtCoder,
  extractInfo: extractAtCoderInfo,
  resolveSubmissionUrl: resolveAtCoderSubmissionUrl,
  ratingResourceRegex: 'atcoder.jp',
};

function extractFromTaskPage(parsedUrl: URL): ProblemInfo {
  const titleContainer = document.querySelector<HTMLElement>('#main-container > div.row > div:nth-child(2) > span.h2');
  const titleClone = titleContainer?.cloneNode(true) as HTMLElement | undefined;
  titleClone?.querySelectorAll('a').forEach((el) => el.remove());
  const name = normalizeAtCoderProblemName(titleClone?.textContent || '');
  const submissionUrl = buildFilteredAcSubmissionUrl(parsedUrl);
  const canonicalTaskUrl = buildTaskUrlFromPath(parsedUrl) || window.location.href;

  return {
    url: canonicalTaskUrl,
    name,
    code: '',
    submissionUrl,
    tags: [],
  };
}

function extractFromSubmissionListPage(parsedUrl: URL): ProblemInfo {
  const rows = document.querySelectorAll<HTMLTableRowElement>(
    '#main-container > div.row > div:nth-child(3) table > tbody > tr, #main-container .table-responsive table > tbody > tr'
  );
  const fallbackTaskUrl = buildTaskUrlFromSubmissionListUrl(parsedUrl);

  for (const row of Array.from(rows)) {
    const detailLink = row.querySelector<HTMLAnchorElement>('td:nth-child(10) > a, a.submission-details-link');
    if (!detailLink) continue;

    const taskLink = row.querySelector<HTMLAnchorElement>('td:nth-child(2) > a[href*="/tasks/"]');
    const submissionTimeEl = row.querySelector<HTMLTimeElement>('td:nth-child(1) > time');

    return {
      url: toAbsoluteUrl(taskLink?.getAttribute('href')) || fallbackTaskUrl || window.location.href,
      name: normalizeAtCoderProblemName(taskLink?.textContent || ''),
      code: '',
      solvedTime: parseAtCoderTime(submissionTimeEl),
      submissionUrl: toAbsoluteUrl(detailLink.getAttribute('href')),
      tags: [],
    };
  }

  return {
    url: fallbackTaskUrl || window.location.href,
    name: '',
    code: '',
    tags: [],
  };
}

async function extractFromSubmissionDetailPage(): Promise<ProblemInfo> {
  const expandBtn = document.querySelector('#main-container > div.row > div:nth-child(2) > p:nth-child(3) > a') as HTMLAnchorElement | null;
  if (expandBtn) {
    expandBtn.click();
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  const codeEl = document.querySelector<HTMLElement>(
    '#submission-code > div.ace_scroller > div > div.ace_layer.ace_text-layer, #submission-code .ace_text-layer'
  );
  const code = codeEl?.innerText || '';

  const problemLinkEl = document.querySelector<HTMLAnchorElement>(
    '#main-container > div.row > div:nth-child(2) > div:nth-child(8) > table > tbody > tr:nth-child(2) > td > a, ' +
    '#main-container table a[href*="/tasks/"]'
  );
  const problemUrl = toAbsoluteUrl(problemLinkEl?.getAttribute('href')) || window.location.href;
  const name = normalizeAtCoderProblemName(problemLinkEl?.textContent || '');

  const timeEl = document.querySelector<HTMLTimeElement>(
    '#main-container > div.row > div:nth-child(2) > div:nth-child(8) > table > tbody > tr:nth-child(1) > td > time'
  );
  const solvedTime = parseAtCoderTime(timeEl);

  const languageEl = document.querySelector<HTMLElement>(
    '#main-container > div.row > div:nth-child(2) > div:nth-child(8) > table > tbody > tr:nth-child(4) > td'
  );
  const language = parseLanguage(languageEl?.textContent || '');

  return {
    url: problemUrl,
    name,
    code,
    solvedTime,
    tags: [],
    language,
  };
}

function buildFilteredAcSubmissionUrl(parsedUrl: URL): string | undefined {
  const match = parsedUrl.pathname.match(/^\/contests\/([^/]+)\/tasks\/([^/]+)/);
  if (!match) return undefined;

  const [, contestId, taskId] = match;
  return `${ATCODER_ORIGIN}/contests/${contestId}/submissions/me?f.Task=${encodeURIComponent(taskId)}&f.LanguageName=&f.Status=AC&f.User=`;
}

function buildTaskUrlFromPath(parsedUrl: URL): string | undefined {
  const match = parsedUrl.pathname.match(/^\/contests\/([^/]+)\/tasks\/([^/]+)/);
  if (!match) return undefined;
  const [, contestId, taskId] = match;
  return `${ATCODER_ORIGIN}/contests/${contestId}/tasks/${taskId}`;
}

function buildTaskUrlFromSubmissionListUrl(parsedUrl: URL): string | undefined {
  const contestMatch = parsedUrl.pathname.match(/^\/contests\/([^/]+)\/submissions/);
  const taskId = parsedUrl.searchParams.get('f.Task');
  if (!contestMatch || !taskId) return undefined;
  return `${ATCODER_ORIGIN}/contests/${contestMatch[1]}/tasks/${taskId}`;
}

function toAbsoluteUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url, ATCODER_ORIGIN).toString();
  } catch {
    return undefined;
  }
}

function normalizeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function normalizeAtCoderProblemName(raw: string): string {
  const normalized = normalizeText(raw);
  // Remove common AtCoder task index prefixes like "A -", "B -", "Ex -".
  return normalized.replace(/^(?:[A-Za-z]{1,2}|Ex)\s*[-–—]\s*/i, '').trim();
}

function parseAtCoderTime(timeEl: HTMLTimeElement | null): number | undefined {
  if (!timeEl) return undefined;

  const datetime = timeEl.getAttribute('datetime');
  if (datetime) {
    const parsed = Date.parse(datetime);
    if (!Number.isNaN(parsed)) return parsed;
  }

  const text = normalizeText(timeEl.textContent || '');
  const m = text.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return undefined;

  const [, year, month, day, hour, min, sec] = m;
  const utc = Date.UTC(+year, +month - 1, +day, +hour, +min, sec ? +sec : 0);
  return utc - JST_OFFSET_MS;
}

function parseLanguage(langText: string): string {
  const lang = langText.toLowerCase();
  if (!lang) return 'other';
  if (lang.includes('c++')) return 'cpp';
  if (lang.includes('python') || lang.includes('pypy')) return 'python';
  if (lang.includes('java')) return 'java';
  if (lang.includes('javascript') || lang.includes('node')) return 'javascript';
  if (lang.includes('rust')) return 'rust';
  if (lang.includes('go') || lang.includes('golang')) return 'go';
  return 'other';
}
