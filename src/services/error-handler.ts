/**
 * 错误处理服务
 * 统一处理应用中的各种错误，提供用户友好的错误消息
 */

import {
  DatabaseError,
  ValidationError,
  NetworkError,
} from "@/types/error.types";
import { toast } from "@/hooks/use-toast";

export class ErrorHandler {
  /**
   * 处理错误并显示用户友好的消息
   */
  static handle(error: unknown, context?: string): void {
    // 开发环境记录错误到控制台
    if (import.meta.env.DEV) {
      console.error(`Error${context ? ` in ${context}` : ""}:`, error);
    }

    if (error instanceof ValidationError) {
      toast({
        title: "验证错误",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    if (error instanceof DatabaseError) {
      toast({
        title: "数据库错误",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    if (error instanceof NetworkError) {
      toast({
        title: "网络错误",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // 未知错误
    toast({
      title: "操作失败",
      description: error instanceof Error ? error.message : "发生未知错误，请稍后重试",
      variant: "destructive",
    });
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
