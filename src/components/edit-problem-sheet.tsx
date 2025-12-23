/**
 * Edit Problem Sheet Component
 * Form for editing existing problems
 */
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TagsInput } from "@/components/tags-input";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { SolvedProblem } from "@/data/mock";
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
  const form = useProblemForm({
    mode: "edit",
    initialProblem: problem,
    onSubmit: async (changes) => {
      if (!problem) return false;
      const success = await onEdit(problem.id, changes);
      if (success) {
        onOpenChange(false);
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Edit Problem</SheetTitle>
          <SheetDescription>
            Modify the problem information.
          </SheetDescription>
        </SheetHeader>

        <div className="grid flex-1 auto-rows-min gap-4 px-4 py-4 overflow-y-auto max-h-[calc(100vh-12rem)]">
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
              value={ProblemService.formatDateForInput(form.formData.日期)}
              onChange={(e) =>
                form.handleChange("日期", ProblemService.formatInputToDate(e.target.value))
              }
            />
          </div>
        </div>

        <SheetFooter>
          <Button onClick={() => form.handleSubmit()} disabled={form.isSubmitting}>
            {form.isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
          <SheetClose asChild>
            <Button variant="outline">Cancel</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
