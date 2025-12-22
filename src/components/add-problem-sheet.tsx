import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TagsInput } from "@/components/tags-input";
import { useProblems } from "@/hooks/use-problems-queries";
import { extractProblemInfo } from "@/lib/problem-utils";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import type { SolvedProblem } from "@/data/mock";

interface AddProblemSheetProps {
  onAdd: (problem: Omit<SolvedProblem, "id">) => Promise<boolean>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function getUTC8DateTime() {
  const now = new Date();
  const utc8 = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const iso = utc8.toISOString();
  const year = iso.slice(0, 4);
  const month = iso.slice(5, 7);
  const day = iso.slice(8, 10);
  const time = iso.slice(11, 19);
  return `${year}/${month}/${day} ${time}`;
}

function getDefaultFormData() {
  return {
    题目: "",
    题目名称: "",
    难度: "",
    题解: "",
    关键词: "",
    日期: getUTC8DateTime(),
  };
}

export function AddProblemSheet({ onAdd, open: controlledOpen, onOpenChange }: AddProblemSheetProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (onOpenChange ?? (() => {})) : setInternalOpen;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(getDefaultFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { allTags } = useProblems();

  // 自动解析链接，显示预览
  const parsedProblem = useMemo(() => {
    const text = formData.题目.trim();
    if (!text) return null;
    const info = extractProblemInfo(text);
    return info.isURL ? info : null;
  }, [formData.题目]);

  // 每次打开时更新时间
  useEffect(() => {
    if (open) {
      setFormData((prev) => ({ ...prev, 日期: getUTC8DateTime() }));
    }
  }, [open]);

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
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      // 统一处理标签分隔符：全角逗号、半角逗号、空格 → 半角逗号
      const normalizedTags = formData.关键词
        .replace(/[，、]/g, ",")
        .split(/[,\s]+/)
        .map((t) => t.trim())
        .filter(Boolean)
        .join(", ");

      const success = await onAdd({
        题目: formData.题目.trim(),
        题目名称: formData.题目名称.trim() || undefined,
        难度: formData.难度.trim(),
        题解: formData.题解.trim(),
        关键词: normalizedTags,
        日期: formData.日期,
      });

      if (success) {
        setFormData(getDefaultFormData());
        setErrors({});
        setOpen(false);
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
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <HugeiconsIcon icon={Add01Icon} data-icon="inline-start" />
          Add Problem
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Add New Problem</SheetTitle>
          <SheetDescription>
            Add a new solved problem to your collection.
          </SheetDescription>
        </SheetHeader>

        <div className="grid flex-1 auto-rows-min gap-4 px-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="problem-url">
              Problem <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="problem-url"
              placeholder="https://codeforces.com/contest/1234/problem/A"
              value={formData.题目}
              onChange={(e) => handleChange("题目", e.target.value)}
            />
            {parsedProblem && (
              <p className="text-xs text-muted-foreground">
                {parsedProblem.source}: <span className="font-medium text-foreground">{parsedProblem.name}</span>
              </p>
            )}
            {errors.题目 && (
              <p className="text-xs text-destructive">{errors.题目}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="problem-name">Problem Name</Label>
            <Input
              id="problem-name"
              placeholder="Problem title (optional)"
              value={formData.题目名称}
              onChange={(e) => handleChange("题目名称", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="difficulty">
              Difficulty <span className="text-destructive">*</span>
            </Label>
            <Input
              id="difficulty"
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
            <Label htmlFor="solution">Solution</Label>
            <Textarea
              id="solution"
              placeholder="https://github.com/user/solutions/..."
              value={formData.题解}
              onChange={(e) => handleChange("题解", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="tags">Tags</Label>
            <TagsInput
              value={formData.关键词}
              onChange={(value) => handleChange("关键词", value)}
              suggestions={allTags}
              placeholder="Add tags..."
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="date">AC Time</Label>
            <Input
              id="date"
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
            {isSubmitting ? "Adding..." : "Add Problem"}
          </Button>
          <SheetClose asChild>
            <Button variant="outline">Cancel</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
