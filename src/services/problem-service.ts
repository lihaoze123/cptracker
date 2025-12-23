/**
 * Problem service for business logic related to problems
 * Extracted from components to improve testability and reusability
 */

export class ProblemService {
  /**
   * Normalize tags by replacing Chinese separators and trimming whitespace
   */
  static normalizeTags(tags: string): string {
    return tags
      .replace(/[，、]/g, ',')
      .split(/[,\s]+/)
      .map((t) => t.trim())
      .filter(Boolean)
      .join(', ');
  }

  /**
   * Validate problem URL
   */
  static validateProblemUrl(url: string): { valid: boolean; error?: string } {
    if (!url.trim()) {
      return { valid: false, error: '题目链接不能为空' };
    }
    try {
      new URL(url);
      return { valid: true };
    } catch {
      return { valid: false, error: '请输入有效的 URL' };
    }
  }

  /**
   * Validate difficulty field (must be empty or numeric)
   */
  static validateDifficulty(difficulty: string): { valid: boolean; error?: string } {
    if (!difficulty.trim()) return { valid: true };
    if (!/^\d+$/.test(difficulty)) {
      return { valid: false, error: '难度必须是数字' };
    }
    return { valid: true };
  }

  /**
   * Get current UTC+8 datetime as a formatted string
   */
  static getUTC8DateTime(): string {
    const now = new Date();
    const utc8 = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    const iso = utc8.toISOString();
    const year = iso.slice(0, 4);
    const month = iso.slice(5, 7);
    const day = iso.slice(8, 10);
    const time = iso.slice(11, 19);
    return `${year}/${month}/${day} ${time}`;
  }

  /**
   * Format date for datetime-local input (HTML5 format)
   */
  static formatDateForInput(dateStr: string): string {
    return dateStr.slice(0, 16).replace(/\//g, '-').replace(' ', 'T');
  }

  /**
   * Format input datetime back to our storage format
   */
  static formatInputToDate(input: string): string {
    return input.replace(/-/g, '/').replace('T', ' ') + ':00';
  }

  /**
   * Parse problem URL to extract OJ and problem ID
   */
  static parseProblemUrl(url: string): { oj: string; problemId: string } | null {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;

      // Codeforces: codeforces.com/problemset/problem/{contestId}/{index}
      if (hostname.includes('codeforces.com')) {
        const match = urlObj.pathname.match(/\/problemset\/problem\/(\d+)\/(\w+)/);
        if (match) {
          return { oj: 'Codeforces', problemId: `${match[1]}${match[2]}` };
        }
      }

      // AtCoder: atcoder.jp/contests/{contestId}/tasks/{taskId}
      if (hostname.includes('atcoder.jp')) {
        const match = urlObj.pathname.match(/\/contests\/\w+\/tasks\/(\w+)/);
        if (match) {
          return { oj: 'AtCoder', problemId: match[1] };
        }
      }

      // Add more OJ patterns as needed

      return null;
    } catch {
      return null;
    }
  }
}
