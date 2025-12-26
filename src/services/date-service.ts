/**
 * 日期处理服务
 * 提供时间戳与日期字符串之间的转换功能
 * 所有时间存储为 Unix 时间戳（毫秒），仅在 UI 层转换为用户本地时区
 */

/**
 * 获取当前时间的 Unix 时间戳（毫秒）
 */
export function getCurrentTimestamp(): number {
  return Date.now();
}

/**
 * 将时间戳转换为 datetime-local 输入所需格式 (YYYY-MM-DDTHH:mm)
 * @param timestamp - Unix 时间戳（毫秒）
 * @returns datetime-local 输入格式字符串
 */
export function timestampToInputDate(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * 将 datetime-local 输入格式转换为时间戳
 * @param input - datetime-local 格式字符串 (YYYY-MM-DDTHH:mm)
 * @returns Unix 时间戳（毫秒）
 */
export function inputDateToTimestamp(input: string): number {
  const date = new Date(input);
  return date.getTime();
}

/**
 * 格式化时间戳用于显示（本地化）
 * @param timestamp - Unix 时间戳（毫秒）
 * @param locale - 地区代码，默认为 'zh-CN'
 * @param includeTime - 是否包含时间部分，默认为 true
 * @returns 格式化的日期字符串
 */
export function formatTimestamp(
  timestamp: number,
  locale = 'zh-CN',
  includeTime = true
): string {
  const date = new Date(timestamp);

  if (includeTime) {
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * 从时间戳提取日期部分（YYYY-MM-DD 格式）
 * @param timestamp - Unix 时间戳（毫秒）
 * @returns 日期字符串 (YYYY-MM-DD)
 */
export function timestampToDateOnly(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * 从时间戳提取时间部分（HH:mm 格式）
 * @param timestamp - Unix 时间戳（毫秒）
 * @returns 时间字符串 (HH:mm)
 */
export function timestampToTimeOnly(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${hours}:${minutes}`;
}

/**
 * 将旧格式的日期字符串转换为时间戳
 * 支持多种格式：YYYY/MM/DD HH:mm:ss, YYYY-MM-DD HH:mm:ss, ISO 8601
 * @param dateStr - 旧格式的日期字符串
 * @returns Unix 时间戳（毫秒）
 */
export function legacyDateStringToTimestamp(dateStr: string): number {
  // Try parsing as-is first
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date.getTime();
  }

  // Try replacing / with -
  const normalized = dateStr.replace(/\//g, '-');
  const normalizedDate = new Date(normalized);
  if (!isNaN(normalizedDate.getTime())) {
    return normalizedDate.getTime();
  }

  // Fallback to current time
  return Date.now();
}

/**
 * 验证时间戳是否有效
 * @param timestamp - Unix 时间戳（毫秒）
 * @returns 是否为有效的时间戳
 */
export function isValidTimestamp(timestamp: number): boolean {
  return (
    typeof timestamp === 'number' &&
    !isNaN(timestamp) &&
    timestamp > 0 &&
    timestamp <= 9999999999999
  );
}

/**
 * 验证日期是否有效
 * @param date - Date 对象
 * @returns 是否为有效的日期
 */
export function isValidDate(date: Date): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * 从时间戳提取年份
 * @param timestamp - Unix 时间戳（毫秒）
 * @returns 年份数字
 */
export function getYearFromTimestamp(timestamp: number): number {
  return new Date(timestamp).getFullYear();
}
