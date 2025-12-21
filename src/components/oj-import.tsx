import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { HugeiconsIcon } from "@hugeicons/react";
import { CloudDownloadIcon } from "@hugeicons/core-free-icons";
import { fetchCodeforces, fetchAtCoder, fetchLuogu } from "@/lib/fetchOJs";
import type { SolvedProblem } from "@/data/mock";

type OJType = "codeforces" | "atcoder" | "luogu";

interface OJImportProps {
  onImport: (problems: Omit<SolvedProblem, "id">[], clearExisting: boolean) => Promise<boolean>;
}

export function OJImport({ onImport }: OJImportProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedOJ, setSelectedOJ] = useState<OJType>("codeforces");
  const [handle, setHandle] = useState("");
  const [luoguUid, setLuoguUid] = useState(
    typeof window !== "undefined" ? window.localStorage.getItem("luogu_uid") ?? "" : ""
  );
  const [luoguClientId, setLuoguClientId] = useState(
    typeof window !== "undefined" ? window.localStorage.getItem("luogu_client_id") ?? "" : ""
  );
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fetchedProblems, setFetchedProblems] = useState<SolvedProblem[] | null>(null);
  const [clearOnImport, setClearOnImport] = useState(false);

  const handleFetch = async () => {
    if (!handle.trim()) {
      setFetchError("请输入用户名");
      return;
    }

    if (selectedOJ === "luogu") {
      if (!luoguUid.trim() || !luoguClientId.trim()) {
        setFetchError("请先填写 _uid 和 __client_id");
        return;
      }
      window.localStorage.setItem("luogu_uid", luoguUid.trim());
      window.localStorage.setItem("luogu_client_id", luoguClientId.trim());
    }

    setIsFetching(true);
    setFetchError(null);
    setFetchedProblems(null);

    try {
      const problems = selectedOJ === "codeforces"
        ? await fetchCodeforces(handle.trim())
        : selectedOJ === "atcoder"
          ? await fetchAtCoder(handle.trim())
          : await fetchLuogu(handle.trim());

      setFetchedProblems(problems);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "获取数据失败");
    } finally {
      setIsFetching(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!fetchedProblems) return;

    const problemsWithoutId = fetchedProblems.map(({ id: _, ...rest }) => rest);
    const success = await onImport(problemsWithoutId, clearOnImport);
    if (success) {
      handleClose();
    }
  };

  const handleClose = () => {
    setDialogOpen(false);
    setHandle("");
    setFetchError(null);
    setFetchedProblems(null);
    setClearOnImport(false);
  };

  const ojNames: Record<OJType, string> = {
    codeforces: "Codeforces",
    atcoder: "AtCoder",
    luogu: "洛谷",
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
        <HugeiconsIcon icon={CloudDownloadIcon} data-icon="inline-start" />
        从 OJ 导入
      </Button>

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>从 OJ 导入</DialogTitle>
            <DialogDescription>
              从在线评测平台导入已通过的题目记录
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">选择平台</label>
              <Select
                value={selectedOJ}
                onValueChange={(v) => {
                  setSelectedOJ(v as OJType);
                  setFetchedProblems(null);
                  setFetchError(null);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="codeforces">Codeforces</SelectItem>
                  <SelectItem value="atcoder">AtCoder</SelectItem>
                  <SelectItem value="luogu">洛谷</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">用户名</label>
              <div className="flex gap-2">
                <Input
                  placeholder={`输入 ${ojNames[selectedOJ]} 用户名`}
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleFetch()}
                />
                <Button
                  onClick={handleFetch}
                  disabled={
                    isFetching ||
                    !handle.trim() ||
                    (selectedOJ === "luogu" && (!luoguUid.trim() || !luoguClientId.trim()))
                  }
                >
                  {isFetching ? "获取中..." : "获取"}
                </Button>
              </div>
            </div>

            {selectedOJ === "luogu" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">洛谷 Cookie（必填）</label>
                <div className="grid gap-2 md:grid-cols-2">
                  <Input
                    placeholder="_uid"
                    value={luoguUid}
                    onChange={(e) => setLuoguUid(e.target.value)}
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v) window.localStorage.setItem("luogu_uid", v);
                      else window.localStorage.removeItem("luogu_uid");
                    }}
                  />
                  <Input
                    placeholder="__client_id"
                    value={luoguClientId}
                    onChange={(e) => setLuoguClientId(e.target.value)}
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v) window.localStorage.setItem("luogu_client_id", v);
                      else window.localStorage.removeItem("luogu_client_id");
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  仅需两个字段：_uid 与 __client_id，会保存在本地 localStorage 并用于请求洛谷。
                </p>
              </div>
            )}

            {fetchError && (
              <div className="text-sm text-destructive">{fetchError}</div>
            )}

            {fetchedProblems && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>获取到:</span>
                  <span className="font-medium text-green-600">
                    {fetchedProblems.length} 道题目
                  </span>
                </div>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={clearOnImport}
                    onChange={(e) => setClearOnImport(e.target.checked)}
                    className="rounded border-input"
                  />
                  导入前清空现有数据
                </label>
              </div>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">取消</Button>
            </DialogClose>
            <Button
              onClick={handleConfirmImport}
              disabled={!fetchedProblems || fetchedProblems.length === 0}
            >
              确认导入
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
