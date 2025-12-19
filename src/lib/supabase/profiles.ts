/**
 * Supabase Profiles API
 * 用户资料管理
 */

import { createClient } from "./client";

export interface UserProfile {
  id: string;
  username: string;
  display_name: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 获取当前用户的 profile
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * 根据 username 获取 profile
 */
export async function getProfileByUsername(
  username: string
): Promise<UserProfile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // Not found
      return null;
    }
    throw error;
  }
  return data;
}

/**
 * 更新当前用户的 profile
 */
export async function updateProfile(updates: {
  username?: string;
  display_name?: string;
  is_public?: boolean;
}): Promise<UserProfile> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * 检查 username 是否可用
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("username")
    .eq("username", username)
    .maybeSingle();

  if (error) throw error;
  return data === null;
}

/**
 * 根据 username 获取用户的所有题目（公开访问）
 */
export async function getProblemsByUsername(username: string) {
  const supabase = createClient();

  // 首先获取用户 profile
  const profile = await getProfileByUsername(username);
  if (!profile) {
    throw new Error("User not found");
  }

  if (!profile.is_public) {
    throw new Error("User profile is not public");
  }

  // 获取题目列表
  const { data, error } = await supabase
    .from("problems")
    .select("*")
    .eq("user_id", profile.id)
    .order("日期", { ascending: false });

  if (error) throw error;
  return { profile, problems: data ?? [] };
}
