import { useState, useEffect, useCallback } from "react";
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

export function useProblemsDB() {
  const { storageMode, user } = useAuth();
  const [problems, setProblems] = useState<SolvedProblem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCloudMode = storageMode === "cloud" && user !== null;

  // 加载数据
  const refreshProblems = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (isCloudMode) {
        // 云端模式：从云端加载
        const cloudProblems = await fetchAllProblems();
        const localProblems = cloudProblems.map((p, idx) =>
          toLocalProblem(p, idx + 1)
        );
        setProblems(localProblems);
      } else {
        // 本地模式：从 IndexedDB 加载
        const data = await getAllProblems();
        setProblems(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载数据失败");
      setProblems([]);
    } finally {
      setIsLoading(false);
    }
  }, [isCloudMode]);

  // 首次加载时，如果数据库为空则初始化 mock 数据
  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getAllProblems();

        if (data.length === 0) {
          await dbImportProblems(mockProblems, true);
        }

        await refreshProblems();
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载数据失败");
        setProblems([]);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, [refreshProblems]);

  const addProblems = useCallback(
    async (newProblems: Omit<SolvedProblem, "id">[]) => {
      try {
        setError(null);
        if (isCloudMode) {
          // 云端模式：直接写入云端
          await insertProblems(newProblems);
        } else {
          // 本地模式：写入 IndexedDB
          await dbAddProblems(newProblems);
        }
        await refreshProblems();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "添加数据失败");
        return false;
      }
    },
    [isCloudMode, refreshProblems]
  );

  const updateProblem = useCallback(
    async (id: number, changes: Partial<SolvedProblem>) => {
      try {
        setError(null);
        if (isCloudMode) {
          // 云端模式：需要找到对应的 supabase_id
          const problem = problems.find((p) => p.id === id) as SolvedProblem & { supabase_id?: string };
          if (problem?.supabase_id) {
            await updateProblemById(problem.supabase_id, changes);
          }
        } else {
          // 本地模式：直接更新 IndexedDB
          await dbUpdateProblem(id, changes);
        }
        await refreshProblems();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "更新数据失败");
        return false;
      }
    },
    [isCloudMode, problems, refreshProblems]
  );

  const deleteProblem = useCallback(
    async (id: number) => {
      try {
        setError(null);
        if (isCloudMode) {
          // 云端模式：需要找到对应的 supabase_id
          const problem = problems.find((p) => p.id === id) as SolvedProblem & { supabase_id?: string };
          if (problem?.supabase_id) {
            await deleteProblemById(problem.supabase_id);
          }
        } else {
          // 本地模式：直接删除 IndexedDB
          await dbDeleteProblem(id);
        }
        await refreshProblems();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "删除数据失败");
        return false;
      }
    },
    [isCloudMode, problems, refreshProblems]
  );

  const clearAllProblems = useCallback(async () => {
    try {
      setError(null);
      if (isCloudMode) {
        // 清空云端数据
        await deleteAllUserProblems();
      } else {
        // 清空本地数据
        await deleteAllProblems();
      }
      setProblems([]);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "清空数据失败");
      return false;
    }
  }, [isCloudMode]);

  const importProblems = useCallback(
    async (newProblems: Omit<SolvedProblem, "id">[], clearExisting = false) => {
      try {
        setError(null);
        if (isCloudMode) {
          // 云端模式：清空云端后导入
          if (clearExisting) {
            await deleteAllUserProblems();
          }
          await insertProblems(newProblems);
        } else {
          // 本地模式：导入 IndexedDB
          await dbImportProblems(newProblems, clearExisting);
        }
        await refreshProblems();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "导入数据失败");
        return false;
      }
    },
    [isCloudMode, refreshProblems]
  );

  const resetToMockData = useCallback(async () => {
    try {
      setError(null);
      if (isCloudMode) {
        await deleteAllUserProblems();
        await insertProblems(mockProblems);
      } else {
        await dbImportProblems(mockProblems, true);
      }
      await refreshProblems();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "重置数据失败");
      return false;
    }
  }, [isCloudMode, refreshProblems]);

  // 上传本地数据到云端（覆盖云端）
  const uploadLocalToCloud = useCallback(async () => {
    try {
      setIsSyncing(true);
      setError(null);

      // 获取本地所有数据
      const localProblems = await getAllProblems();

      // 清空云端
      await deleteAllUserProblems();

      // 上传到云端
      if (localProblems.length > 0) {
        await insertProblems(localProblems.map(p => ({
          题目: p.题目,
          难度: p.难度,
          题解: p.题解,
          关键词: p.关键词,
          日期: p.日期,
        })));
      }

      // 上传成功后刷新
      await refreshProblems();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传数据失败");
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [refreshProblems]);

  // 从云端下载数据到本地（覆盖本地）
  const downloadCloudToLocal = useCallback(async () => {
    try {
      setIsSyncing(true);
      setError(null);

      // 获取云端所有数据
      const cloudProblems = await fetchAllProblems();

      // 清空本地
      await deleteAllProblems();

      // 下载到本地
      if (cloudProblems.length > 0) {
        await dbImportProblems(cloudProblems.map(p => ({
          题目: p.题目,
          难度: p.难度,
          题解: p.题解,
          关键词: p.关键词,
          日期: p.日期,
        })), false);
      }

      // 下载成功后，强制从本地加载数据显示
      const data = await getAllProblems();
      setProblems(data);

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "下载数据失败");
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  return {
    problems,
    isLoading,
    isSyncing,
    error,
    isCloudMode,
    addProblems,
    updateProblem,
    deleteProblem,
    clearAllProblems,
    importProblems,
    resetToMockData,
    refresh: refreshProblems,
    uploadLocalToCloud,
    downloadCloudToLocal,
  };
}
