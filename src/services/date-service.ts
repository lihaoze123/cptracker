/**
 * 日期处理服务
 * 提供日期格式化和解析功能
 */

/**
 * 将日期字符串格式化为 datetime-local 输入所需格式 (YYYY-MM-DDTHH:mm)
 */
export function formatDateForInput(dateStr: string): string {
  return dateStr.slice(0, 16).replace(/\//g, '-').replace(' ', 'T');
}

/**
 * 将 datetime-local 输入格式转换回存储格式 (YYYY/MM/DD HH:mm:ss)
 */
export function formatInputToDate(input: string): string {
  return input.replace(/-/g, '/').replace('T', ' ') + ':00';
}

/**
 * 格式化日期用于显示（本地化）
 */
export function formatDateDisplay(date: Date, locale = 'zh-CN'): string {
  return date.toLocaleDateString(locale);
}

/**
 * 验证日期是否有效
 */
export function isValidDate(date: Date): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}
