export function extractURLFromText(text: string): string | null {
  const urlRegex = /(https?:\/\/[^\s]+)/i;
  const match = text.match(urlRegex);
  return match ? match[1] : null;
}

export interface ProblemInfo {
  source: string;
  name: string;
  isURL: boolean;
}

export function extractProblemInfo(text: string): ProblemInfo {
  const url = extractURLFromText(text);

  if (!url) {
    return { source: "Text", name: text, isURL: false };
  }

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    if (hostname.includes("codeforces.com")) {
      // Gym format: /gym/106177/problem/A
      const gymMatch = url.match(/gym\/(\d+)\/problem\/([A-Z]\d?)/);
      if (gymMatch) {
        return {
          source: "Codeforces",
          name: `Gym${gymMatch[1]}${gymMatch[2]}`,
          isURL: true,
        };
      }

      // Contest format: /contest/145/problem/C
      const contestMatch = url.match(/contest\/(\d+)\/problem\/([A-Z]\d?)/);
      if (contestMatch) {
        return {
          source: "Codeforces",
          name: `CF${contestMatch[1]}${contestMatch[2]}`,
          isURL: true,
        };
      }

      // Problemset format: /problemset/problem/145/C
      const problemsetMatch = url.match(/problemset\/problem\/(\d+)\/([A-Z]\d?)/);
      if (problemsetMatch) {
        return {
          source: "Codeforces",
          name: `CF${problemsetMatch[1]}${problemsetMatch[2]}`,
          isURL: true,
        };
      }
    }

    if (hostname.includes("nowcoder.com")) {
      const match = url.match(/contest\/(\d+)\/([A-Z])/);
      if (match) {
        return {
          source: "Nowcoder",
          name: `牛客${match[1]}${match[2]}`,
          isURL: true,
        };
      }
    }

    if (hostname.includes("luogu.com.cn")) {
      const match = url.match(/\/([A-Z])(\d+)/);
      if (match) {
        return {
          source: "Luogu",
          name: `${match[1]}${match[2]}`,
          isURL: true,
        };
      }
    }

    if (hostname.includes("vjudge.net")) {
      const match = url.match(/\/problem\/(.*)/);
      if (match) {
        return {
          source: "Vjudge",
          name: `${match[1]}`,
          isURL: true,
        };
      }
    }

    if (hostname.includes("atcoder.jp")) {
      const match = url.match(/contests\/([^/]+)\/tasks\/([^/]+)/);
      if (match) {
        return {
          source: "AtCoder",
          name: match[2].toUpperCase(),
          isURL: true,
        };
      }
    }

    if (hostname.includes("leetcode")) {
      const match = url.match(/problems\/([^/]+)/);
      if (match) {
        return {
          source: "LeetCode",
          name: match[1],
          isURL: true,
        };
      }
    }

    if (hostname.includes("qoj.ac")) {
      const match = url.match(/problem\/(\d+)/);
      if (match) {
        return {
          source: "QOJ",
          name: `QOJ${match[1]}`,
          isURL: true,
        };
      }
    }

    return { source: hostname, name: url, isURL: true };
  } catch {
    return { source: "Unknown", name: url, isURL: true };
  }
}

export function getProblemDisplayName(text: string): string {
  const info = extractProblemInfo(text);
  if (info.isURL) {
    return info.name;
  }
  // For plain text, truncate if too long
  if (text.length > 20) {
    return text.slice(0, 20) + "...";
  }
  return text;
}
