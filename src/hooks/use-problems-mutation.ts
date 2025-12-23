/**
 * 通用 problem mutation 钩子
 * 减少重复的样板代码
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";

const PROBLEMS_QUERY_KEY = ["problems"] as const;

interface MutationOptions<T> {
  mutationFn: (data: T) => Promise<void>;
  onSuccessMessage?: string;
}

/**
 * 通用的 problem mutation hook
 * 自动处理查询失效
 */
export function useProblemMutation<T = unknown>({
  mutationFn,
}: MutationOptions<T>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROBLEMS_QUERY_KEY });
    },
  });
}
