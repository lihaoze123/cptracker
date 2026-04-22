/**
 * Add Problem Sheet Component
 * Form for adding new solved problems
 */
import { useState } from "react";
import { useMemo } from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import type { SolvedProblem } from "@/data/mock";
import { extractProblemInfo } from "@/lib/problem-utils";
import { useProblemForm } from "@/components/features/forms/hooks/use-problem-form";
import { ProblemService } from "@/services/problem-service";

interface AddProblemSheetProps {
  onAdd: (problem: Omit<SolvedProblem, "id">) => Promise<boolean>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddProblemSheet({ onAdd, open: controlledOpen, onOpenChange }: AddProblemSheetProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (onOpenChange ?? (() => {})) : setInternalOpen;

  const form = useProblemForm({
    mode: "add",
    onSheetOpen: open,
    onSubmit: async (data) => {
      const success = await onAdd(data);
      if (success) {
        form.reset?.();
        setOpen(false);
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <HugeiconsIcon icon={Add01Icon} data-icon="inline-start" />
          Add Problem
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="border-b px-6 py-5 pr-14">
          <DialogTitle>Add New Problem</DialogTitle>
          <DialogDescription>
            Add a new solved problem to your collection.
          </DialogDescription>
        </DialogHeader>

        <div className="grid max-h-[calc(85vh-9.5rem)] auto-rows-min gap-5 overflow-y-auto px-6 py-5">
          <div className="grid gap-2">
            <Label htmlFor="problem-url">
              Problem <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="problem-url"
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
              <Label htmlFor="problem-name">Problem Name</Label>
              <Input
                id="problem-name"
                placeholder="Problem title (optional)"
                value={form.formData.题目名称}
                onChange={(e) => form.handleChange("题目名称", e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="difficulty">
                Difficulty
              </Label>
              <Input
                id="difficulty"
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
            <Label htmlFor="solution">Solution</Label>
            <Textarea
              id="solution"
              placeholder="https://github.com/user/solutions/..."
              value={form.formData.题解}
              onChange={(e) => form.handleChange("题解", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="tags">Tags</Label>
            <TagsInput
              value={form.formData.关键词}
              onChange={(value) => form.handleChange("关键词", value)}
              suggestions={form.allTags}
              placeholder="Add tags..."
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="date">AC Time</Label>
            <Input
              id="date"
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
            {form.isSubmitting ? "Adding..." : "Add Problem"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
