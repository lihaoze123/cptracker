/**
 * Edit Problem Sheet Component
 * Form for editing existing problems
 */
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TagsInput } from "@/components/tags-input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HugeiconsIcon } from "@hugeicons/react";
import { FullScreenIcon, Menu01Icon } from "@hugeicons/core-free-icons";
import type { SolvedProblem } from "@/data/mock";
import { cn } from "@/lib/utils";
import { extractProblemInfo } from "@/lib/problem-utils";
import { useProblemForm } from "@/components/features/forms/hooks/use-problem-form";
import { ProblemService } from "@/services/problem-service";

interface EditProblemSheetProps {
  problem: SolvedProblem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (id: number, changes: Partial<SolvedProblem>) => Promise<boolean>;
}

export function EditProblemSheet({
  problem,
  open,
  onOpenChange,
  onEdit,
}: EditProblemSheetProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setIsFullscreen(false);
    }

    onOpenChange(nextOpen);
  };

  const form = useProblemForm({
    mode: "edit",
    initialProblem: problem,
    onSubmit: async (changes) => {
      if (!problem) return false;
      const success = await onEdit(problem.id, changes);
      if (success) {
        handleOpenChange(false);
      }
      return success;
    },
  });

  // 自动解析链接，显示预览
  const parsedProblem = useMemo(() => {
    const text = form.formData.题目.trim();
    if (!text) return null;
    const info = extractProblemInfo(text);
    return info.isURL ? info : null;
  }, [form.formData.题目]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "gap-0 overflow-hidden p-0",
          isFullscreen
            ? "h-dvh max-h-dvh w-dvw max-w-dvw translate-x-0 translate-y-0 rounded-none sm:max-w-dvw top-0 left-0"
            : "max-h-[85vh] sm:max-w-xl"
        )}
      >
        <DialogHeader className="border-b px-6 py-5 pr-24">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <DialogTitle>Edit Problem</DialogTitle>
              <DialogDescription>
                Modify the problem information.
              </DialogDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => setIsFullscreen((value) => !value)}
            >
              <HugeiconsIcon icon={isFullscreen ? Menu01Icon : FullScreenIcon} data-icon="inline-start" />
              {isFullscreen ? "Card Mode" : "Fullscreen"}
            </Button>
          </div>
        </DialogHeader>

        <div
          className={cn(
            "grid auto-rows-min gap-5 overflow-y-auto px-6 py-5",
            isFullscreen ? "max-h-[calc(100dvh-9.5rem)]" : "max-h-[calc(85vh-9.5rem)]"
          )}
        >
          <div className="grid gap-2">
            <Label htmlFor="edit-problem-url">
              Problem<span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="edit-problem-url"
              placeholder="https://codeforces.com/contest/1234/problem/A"
              value={form.formData.题目}
              onChange={(e) => form.handleChange("题目", e.target.value)}
            />
            {parsedProblem && (
              <p className="text-xs text-muted-foreground">
                {parsedProblem.source}: <span className="font-medium text-foreground">{parsedProblem.name}</span>
              </p>
            )}
            {form.errors.题目 && (
              <p className="text-xs text-destructive">{form.errors.题目}</p>
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,180px)] sm:items-start sm:gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-problem-name">Problem Name</Label>
              <Input
                id="edit-problem-name"
                placeholder="Problem title (optional)"
                value={form.formData.题目名称}
                onChange={(e) => form.handleChange("题目名称", e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-difficulty">
                Difficulty
              </Label>
              <Input
                id="edit-difficulty"
                type="number"
                placeholder="1600"
                value={form.formData.难度}
                onChange={(e) => form.handleChange("难度", e.target.value)}
              />
              {form.errors.难度 && (
                <p className="text-xs text-destructive">{form.errors.难度}</p>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-solution">Solution</Label>
            <Textarea
              id="edit-solution"
              placeholder="支持 Markdown 语法和数学公式"
              value={form.formData.题解}
              onChange={(e) => form.handleChange("题解", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-tags">Tags</Label>
            <TagsInput
              value={form.formData.关键词}
              onChange={(value) => form.handleChange("关键词", value)}
              suggestions={form.allTags}
              placeholder="Add tags..."
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-date">AC Time</Label>
            <Input
              id="edit-date"
              type="datetime-local"
              value={ProblemService.timestampToInputDate(form.formData.日期)}
              onChange={(e) =>
                form.handleChange("日期", ProblemService.inputDateToTimestamp(e.target.value))
              }
            />
          </div>
        </div>

        <DialogFooter className="border-t px-6 py-4 sm:justify-end">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={() => form.handleSubmit()} disabled={form.isSubmitting}>
            {form.isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
