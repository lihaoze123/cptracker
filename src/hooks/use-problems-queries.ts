import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import {
  getAllProblems,
  addProblems as dbAddProblems,
  updateProblem as dbUpdateProblem,
  deleteProblem as dbDeleteProblem,
  deleteAllProblems,
  importProblems as dbImportProblems,
} from "@/lib/db";
import {
  fetchAllProblems,
  insertProblems,
  updateProblemById,
  deleteProblemById,
  deleteAllUserProblems,
  toLocalProblem,
} from "@/lib/supabase/database";
import { mockProblems, type SolvedProblem } from "@/data/mock";
import { useAuth } from "@/contexts/auth-context";

const PROBLEMS_QUERY_KEY = ["problems"] as const;

// Main hook that provides all problems data and mutations
export function useProblems() {
  const { storageMode, user } = useAuth();
  const queryClient = useQueryClient();
  const isCloudMode = storageMode === "cloud" && user !== null;

  // Query for fetching problems
  const {
    data: problems = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [...PROBLEMS_QUERY_KEY, isCloudMode ? "cloud" : "local"],
    queryFn: async () => {
      if (isCloudMode) {
        // Cloud mode: fetch from Supabase
        const cloudProblems = await fetchAllProblems();
        return cloudProblems.map((p, idx) => toLocalProblem(p, idx + 1));
      } else {
        // Local mode: fetch from IndexedDB
        return await getAllProblems();
      }
    },
  });

  // Add problems mutation
  const addProblemsMutation = useMutation({
    mutationFn: async (newProblems: Omit<SolvedProblem, "id">[]) => {
      if (isCloudMode) {
        await insertProblems(newProblems);
      } else {
        await dbAddProblems(newProblems);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROBLEMS_QUERY_KEY });
    },
  });

  // Update problem mutation
  const updateProblemMutation = useMutation({
    mutationFn: async ({
      id,
      changes,
    }: {
      id: number;
      changes: Partial<SolvedProblem>;
    }) => {
      if (isCloudMode) {
        const problem = problems.find((p) => p.id === id) as SolvedProblem & {
          supabase_id?: string;
        };
        if (problem?.supabase_id) {
          await updateProblemById(problem.supabase_id, changes);
        }
      } else {
        await dbUpdateProblem(id, changes);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROBLEMS_QUERY_KEY });
    },
  });

  // Delete problem mutation
  const deleteProblemMutation = useMutation({
    mutationFn: async (id: number) => {
      if (isCloudMode) {
        const problem = problems.find((p) => p.id === id) as SolvedProblem & {
          supabase_id?: string;
        };
        if (problem?.supabase_id) {
          await deleteProblemById(problem.supabase_id);
        }
      } else {
        await dbDeleteProblem(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROBLEMS_QUERY_KEY });
    },
  });

  // Delete multiple problems mutation
  const deleteProblemsMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      if (isCloudMode) {
        const supabaseIds = ids
          .map((id) => {
            const problem = problems.find((p) => p.id === id) as SolvedProblem & {
              supabase_id?: string;
            };
            return problem?.supabase_id;
          })
          .filter(Boolean) as string[];
        await Promise.all(supabaseIds.map((id) => deleteProblemById(id)));
      } else {
        await Promise.all(ids.map((id) => dbDeleteProblem(id)));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROBLEMS_QUERY_KEY });
    },
  });

  // Clear all problems mutation
  const clearAllProblemsMutation = useMutation({
    mutationFn: async () => {
      if (isCloudMode) {
        await deleteAllUserProblems();
      } else {
        await deleteAllProblems();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROBLEMS_QUERY_KEY });
    },
  });

  // Import problems mutation
  const importProblemsMutation = useMutation({
    mutationFn: async ({
      newProblems,
      clearExisting = false,
    }: {
      newProblems: Omit<SolvedProblem, "id">[];
      clearExisting?: boolean;
    }) => {
      if (isCloudMode) {
        if (clearExisting) {
          await deleteAllUserProblems();
        }
        await insertProblems(newProblems);
      } else {
        await dbImportProblems(newProblems, clearExisting);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROBLEMS_QUERY_KEY });
    },
  });

  // Reset to mock data mutation
  const resetToMockDataMutation = useMutation({
    mutationFn: async () => {
      if (isCloudMode) {
        await deleteAllUserProblems();
        await insertProblems(mockProblems);
      } else {
        await dbImportProblems(mockProblems, true);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROBLEMS_QUERY_KEY });
    },
  });

  // Upload local to cloud mutation
  const uploadToCloudMutation = useMutation({
    mutationFn: async () => {
      const localProblems = await getAllProblems();
      await deleteAllUserProblems();
      if (localProblems.length > 0) {
        await insertProblems(
          localProblems.map((p) => ({
            题目: p.题目,
            难度: p.难度,
            题解: p.题解,
            关键词: p.关键词,
            日期: p.日期,
          }))
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROBLEMS_QUERY_KEY });
    },
  });

  // Download from cloud to local mutation
  const downloadFromCloudMutation = useMutation({
    mutationFn: async () => {
      const cloudProblems = await fetchAllProblems();
      await deleteAllProblems();
      if (cloudProblems.length > 0) {
        await dbImportProblems(
          cloudProblems.map((p) => ({
            题目: p.题目,
            难度: p.难度,
            题解: p.题解,
            关键词: p.关键词,
            日期: p.日期,
          })),
          false
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROBLEMS_QUERY_KEY });
    },
  });

  // Wrapper functions with consistent return type
  const addProblems = useCallback(
    async (newProblems: Omit<SolvedProblem, "id">[]) => {
      try {
        await addProblemsMutation.mutateAsync(newProblems);
        return true;
      } catch (err) {
        console.error("Add problems failed:", err);
        return false;
      }
    },
    [addProblemsMutation]
  );

  const updateProblem = useCallback(
    async (id: number, changes: Partial<SolvedProblem>) => {
      try {
        await updateProblemMutation.mutateAsync({ id, changes });
        return true;
      } catch (err) {
        console.error("Update problem failed:", err);
        return false;
      }
    },
    [updateProblemMutation]
  );

  const deleteProblem = useCallback(
    async (id: number) => {
      try {
        await deleteProblemMutation.mutateAsync(id);
        return true;
      } catch (err) {
        console.error("Delete problem failed:", err);
        return false;
      }
    },
    [deleteProblemMutation]
  );

  const deleteProblems = useCallback(
    async (ids: number[]) => {
      try {
        await deleteProblemsMutation.mutateAsync(ids);
        return true;
      } catch (err) {
        console.error("Delete problems failed:", err);
        return false;
      }
    },
    [deleteProblemsMutation]
  );

  const clearAllProblems = useCallback(async () => {
    try {
      await clearAllProblemsMutation.mutateAsync();
      return true;
    } catch (err) {
      console.error("Clear all problems failed:", err);
      return false;
    }
  }, [clearAllProblemsMutation]);

  const importProblems = useCallback(
    async (newProblems: Omit<SolvedProblem, "id">[], clearExisting = false) => {
      try {
        await importProblemsMutation.mutateAsync({ newProblems, clearExisting });
        return true;
      } catch (err) {
        console.error("Import problems failed:", err);
        return false;
      }
    },
    [importProblemsMutation]
  );

  const resetToMockData = useCallback(async () => {
    try {
      await resetToMockDataMutation.mutateAsync();
      return true;
    } catch (err) {
      console.error("Reset to mock data failed:", err);
      return false;
    }
  }, [resetToMockDataMutation]);

  const uploadLocalToCloud = useCallback(async () => {
    try {
      await uploadToCloudMutation.mutateAsync();
      return true;
    } catch (err) {
      console.error("Upload to cloud failed:", err);
      return false;
    }
  }, [uploadToCloudMutation]);

  const downloadCloudToLocal = useCallback(async () => {
    try {
      await downloadFromCloudMutation.mutateAsync();
      return true;
    } catch (err) {
      console.error("Download from cloud failed:", err);
      return false;
    }
  }, [downloadFromCloudMutation]);

  const isSyncing =
    uploadToCloudMutation.isPending || downloadFromCloudMutation.isPending;

  // Extract all unique tags from problems for autocomplete
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    problems.forEach((p) => {
      p.关键词.split(",").forEach((t) => {
        const trimmed = t.trim();
        if (trimmed) tagSet.add(trimmed);
      });
    });
    return Array.from(tagSet).sort((a, b) =>
      a.toLowerCase().localeCompare(b.toLowerCase())
    );
  }, [problems]);

  return {
    problems,
    allTags,
    isLoading,
    isSyncing,
    error: error ? (error as Error).message : null,
    isCloudMode,
    addProblems,
    updateProblem,
    deleteProblem,
    deleteProblems,
    clearAllProblems,
    importProblems,
    resetToMockData,
    refresh: refetch,
    uploadLocalToCloud,
    downloadCloudToLocal,
  };
}
