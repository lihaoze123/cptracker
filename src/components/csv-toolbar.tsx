import { useRef, useState } from "react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Download01Icon,
  Upload01Icon,
  MoreVerticalIcon,
  FileDownloadIcon,
  Delete02Icon,
  RefreshIcon,
} from "@hugeicons/core-free-icons";
import { exportToCSV, parseCSV, generateCSVTemplate, type CSVImportResult } from "@/lib/csv";
import type { SolvedProblem } from "@/data/mock";

interface CSVToolbarProps {
  problems: SolvedProblem[];
  onImport: (problems: Omit<SolvedProblem, "id">[], clearExisting: boolean) => Promise<boolean>;
  onClearAll: () => Promise<boolean>;
  onReset: () => Promise<boolean>;
}

export function CSVToolbar({ problems, onImport, onClearAll, onReset }: CSVToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importResult, setImportResult] = useState<CSVImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [clearOnImport, setClearOnImport] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  const handleExport = () => {
    exportToCSV({ problems });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const result = await parseCSV(file);
      setImportResult(result);
      setImportDialogOpen(true);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleConfirmImport = async () => {
    if (!importResult) return;

    const success = await onImport(importResult.success, clearOnImport);
    if (success) {
      setImportDialogOpen(false);
      setImportResult(null);
      setClearOnImport(false);
    }
  };

  const handleClearAll = async () => {
    await onClearAll();
    setConfirmClearOpen(false);
  };

  const handleReset = async () => {
    await onReset();
    setConfirmResetOpen(false);
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="hidden sm:flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleExport} disabled={problems.length === 0}>
          <HugeiconsIcon icon={Download01Icon} data-icon="inline-start" />
          导出 CSV
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
        >
          <HugeiconsIcon icon={Upload01Icon} data-icon="inline-start" />
          {isImporting ? "解析中..." : "导入 CSV"}
        </Button>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon-sm">
            <HugeiconsIcon icon={MoreVerticalIcon} />
            <span className="sr-only">Menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem className="sm:hidden" onClick={handleExport} disabled={problems.length === 0}>
            <HugeiconsIcon icon={Download01Icon} />
            导出 CSV
          </DropdownMenuItem>
          <DropdownMenuItem
            className="sm:hidden"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
          >
            <HugeiconsIcon icon={Upload01Icon} />
            {isImporting ? "解析中..." : "导入 CSV"}
          </DropdownMenuItem>
          <DropdownMenuSeparator className="sm:hidden" />
          <DropdownMenuItem onClick={() => generateCSVTemplate()}>
            <HugeiconsIcon icon={FileDownloadIcon} />
            下载 CSV 模板
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setConfirmResetOpen(true)}>
            <HugeiconsIcon icon={RefreshIcon} />
            重置为示例数据
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setConfirmClearOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <HugeiconsIcon icon={Delete02Icon} />
            清空所有数据
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Import Preview Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>导入预览</DialogTitle>
            <DialogDescription>
              确认导入以下数据到数据库
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>成功解析:</span>
              <span className="font-medium text-green-600">
                {importResult?.success.length ?? 0} 条记录
              </span>
            </div>

            {importResult?.errors && importResult.errors.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>解析失败:</span>
                  <span className="font-medium text-destructive">
                    {importResult.errors.length} 条记录
                  </span>
                </div>
                <div className="max-h-32 overflow-y-auto rounded border p-2 text-xs">
                  {importResult.errors.map((err, i) => (
                    <div key={i} className="text-destructive">
                      第 {err.row} 行: {err.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

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

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">取消</Button>
            </DialogClose>
            <Button
              onClick={handleConfirmImport}
              disabled={!importResult?.success.length}
            >
              确认导入
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Clear Dialog */}
      <Dialog open={confirmClearOpen} onOpenChange={setConfirmClearOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认清空</DialogTitle>
            <DialogDescription>
              此操作将删除所有数据，且无法恢复。确定要继续吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">取消</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleClearAll}>
              确认清空
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Reset Dialog */}
      <Dialog open={confirmResetOpen} onOpenChange={setConfirmResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认重置</DialogTitle>
            <DialogDescription>
              此操作将用示例数据替换所有现有数据。确定要继续吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">取消</Button>
            </DialogClose>
            <Button onClick={handleReset}>
              确认重置
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
