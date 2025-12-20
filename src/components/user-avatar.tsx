import { cn } from "@/lib/utils";
import { getGravatarUrl, getEmailHash } from "@/lib/gravatar";
import { User } from "lucide-react";

interface UserAvatarProps {
  /** 邮箱地址 - 用于生成头像 URL */
  email?: string | null;
  /** 预计算的邮箱哈希值 - 用于公开资料（不暴露邮箱） */
  hash?: string | null;
  /** 图片尺寸（像素） */
  size?: number;
  /** 额外的 CSS 类名 */
  className?: string;
}

/**
 * 用户头像组件
 * 支持两种模式：
 * 1. 传入 email - 自动计算哈希并生成 Gravatar URL
 * 2. 传入 hash - 直接使用哈希生成 URL（用于公开资料）
 */
export function UserAvatar({
  email,
  hash,
  size = 40,
  className,
}: UserAvatarProps) {
  const avatarHash = hash || (email ? getEmailHash(email) : null);

  if (!avatarHash) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-muted",
          className
        )}
        style={{ width: size, height: size }}
      >
        <User className="h-1/2 w-1/2 text-muted-foreground" />
      </div>
    );
  }

  const avatarUrl = getGravatarUrl(avatarHash, size * 2); // 2x for retina

  return (
    <img
      src={avatarUrl}
      alt="User avatar"
      className={cn("rounded-full bg-muted", className)}
      style={{ width: size, height: size }}
      loading="lazy"
    />
  );
}
