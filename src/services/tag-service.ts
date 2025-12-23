/**
 * 标签处理服务
 * 提供标签的规范化、解析和格式化功能
 */

/**
 * 规范化标签数组
 * 支持中文逗号、顿号等分隔符
 */
export function normalizeTags(tags: string[]): string[] {
  if (!tags?.length) return [];
  return tags
    .flatMap((tag) => tag.split(/[,，、]/)) // 支持英文逗号、中文逗号、顿号
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

/**
 * 规范化标签字符串（向后兼容）
 * 接收逗号分隔的标签字符串，返回格式化后的逗号分隔字符串
 */
export function normalizeTagsString(tagString: string): string {
  if (!tagString) return '';
  const tags = normalizeTags([tagString]);
  return tagsToString(tags);
}

/**
 * 解析逗号分隔的标签字符串为数组
 */
export function parseTagString(tagString: string): string[] {
  if (!tagString) return [];
  return normalizeTags(tagString.split(','));
}

/**
 * 将标签数组转换为逗号分隔的字符串
 */
export function tagsToString(tags: string[]): string {
  return tags.join(', ');
}

/**
 * 验证单个标签格式
 */
export function isValidTag(tag: string): boolean {
  return tag.trim().length > 0 && tag.length <= 50;
}
