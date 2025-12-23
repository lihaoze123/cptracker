/**
 * 错误处理服务
 * 统一处理应用中的各种错误，提供用户友好的错误消息
 */

import {
  DatabaseError,
  ValidationError,
  NetworkError,
} from "@/types/error.types";

export class ErrorHandler {
  /**
   * 处理错误并显示用户友好的消息
   */
  static handle(error: unknown, context?: string): void {
    // 记录错误到控制台
    console.error(`Error${context ? ` in ${context}` : ""}:`, error);

    if (error instanceof ValidationError) {
      console.error(`验证错误: ${error.message}`);
      return;
    }

    if (error instanceof DatabaseError) {
      console.error(`数据库错误: ${error.message}`);
      return;
    }

    if (error instanceof NetworkError) {
      console.error(`网络错误: ${error.message}`);
      return;
    }

    // 未知错误
    console.error("发生未知错误，请稍后重试");
  }

  /**
   * 包装异步函数，自动处理错误
   */
  static async wrap<T>(
    fn: () => Promise<T>,
    context?: string
  ): Promise<T | null> {
    try {
      return await fn();
    } catch (error) {
      this.handle(error, context);
      return null;
    }
  }

  /**
   * 检查错误是否可重试
   */
  static isRetryable(error: unknown): boolean {
    if (error instanceof NetworkError) {
      return error.statusCode ? error.statusCode >= 500 : true;
    }
    return false;
  }

  /**
   * 创建验证错误
   */
  static validationError(message: string, field?: string): ValidationError {
    return new ValidationError(message, field || "");
  }

  /**
   * 创建数据库错误
   */
  static databaseError(message: string): DatabaseError {
    return new DatabaseError(message);
  }

  /**
   * 创建网络错误
   */
  static networkError(message: string, statusCode?: number): NetworkError {
    return new NetworkError(message, statusCode);
  }
}
