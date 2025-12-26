/**
 * Problem service for business logic related to problems
 * Extracted from components to improve testability and reusability
 */

// Import utility functions from specialized services
import {
  normalizeTags,
  parseTagString,
  tagsToString,
  isValidTag,
} from './tag-service';
import {
  timestampToInputDate,
  inputDateToTimestamp,
  formatTimestamp,
  getCurrentTimestamp,
  isValidDate,
} from './date-service';

export class ProblemService {
  // Re-export tag utility methods as static methods for convenience
  static normalizeTagsArray = normalizeTags;
  static parseTagString = parseTagString;
  static tagsToString = tagsToString;
  static isValidTag = isValidTag;

  // Re-export date utility methods as static methods for convenience
  static timestampToInputDate = timestampToInputDate;
  static inputDateToTimestamp = inputDateToTimestamp;
  static formatTimestamp = formatTimestamp;
  static getCurrentTimestamp = getCurrentTimestamp;
  static isValidDate = isValidDate;

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

// Also export utility functions for direct import
export {
  normalizeTags,
  parseTagString,
  tagsToString,
  isValidTag,
} from './tag-service';
export {
  timestampToInputDate,
  inputDateToTimestamp,
  formatTimestamp,
  getCurrentTimestamp,
  isValidDate,
} from './date-service';
