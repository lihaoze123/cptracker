import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    题目: "",
    难度: "",
    题解: "",
    关键词: "",
    日期: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 当 problem 变化或 Sheet 打开时更新表单数据
  useEffect(() => {
    if (problem && open) {
      setFormData({
        题目: problem.题目,
        难度: problem.难度,
        题解: problem.题解,
        关键词: problem.关键词,
        日期: problem.日期,
      });
      setErrors({});
    }
  }, [problem, open]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.题目.trim()) {
      newErrors.题目 = "题目链接不能为空";
    } else {
      try {
        new URL(formData.题目);
      } catch {
        newErrors.题目 = "请输入有效的 URL";
      }
    }

    if (!formData.难度.trim()) {
      newErrors.难度 = "难度不能为空";
    } else if (!/^\d+$/.test(formData.难度)) {
      newErrors.难度 = "难度必须是数字";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !problem) return;

    setIsSubmitting(true);
    try {
      // 统一处理标签分隔符：全角逗号、半角逗号、空格 → 半角逗号
      const normalizedTags = formData.关键词
        .replace(/[，、]/g, ",")
        .split(/[,\s]+/)
        .map((t) => t.trim())
        .filter(Boolean)
        .join(", ");

      const success = await onEdit(problem.id, {
        题目: formData.题目.trim(),
        难度: formData.难度.trim(),
        题解: formData.题解.trim(),
        关键词: normalizedTags,
        日期: formData.日期,
      });

      if (success) {
        setErrors({});
        onOpenChange(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

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
              value={formData.题目}
              onChange={(e) => handleChange("题目", e.target.value)}
            />
            {errors.题目 && (
              <p className="text-xs text-destructive">{errors.题目}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-difficulty">
              Difficulty <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-difficulty"
              type="number"
              placeholder="1600"
              value={formData.难度}
              onChange={(e) => handleChange("难度", e.target.value)}
            />
            {errors.难度 && (
              <p className="text-xs text-destructive">{errors.难度}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-solution">Solution</Label>
            <Textarea
              id="edit-solution"
              placeholder="支持 Markdown 语法和数学公式"
              value={formData.题解}
              onChange={(e) => handleChange("题解", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-tags">Tags</Label>
            <Textarea
              id="edit-tags"
              placeholder="DP, 贪心, 二分 (支持逗号/空格分隔)"
              value={formData.关键词}
              onChange={(e) => handleChange("关键词", e.target.value)}
              className="resize-none"
              rows={2}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-date">AC Time</Label>
            <Input
              id="edit-date"
              type="datetime-local"
              value={formData.日期.slice(0, 16).replace(/\//g, "-").replace(" ", "T")}
              onChange={(e) =>
                handleChange("日期", e.target.value.replace(/-/g, "/").replace("T", " ") + ":00")
              }
            />
          </div>
        </div>

        <SheetFooter>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
          <SheetClose asChild>
            <Button variant="outline">Cancel</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
