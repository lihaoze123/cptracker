import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TagsInput } from "@/components/tags-input";
import { SolutionEditor } from "@/components/features/forms/solution-editor";
import type { UseProblemFormReturn } from "@/components/features/forms/hooks/use-problem-form";
import { extractProblemInfo } from "@/lib/problem-utils";
import { ProblemService } from "@/services/problem-service";

interface ProblemFormFieldsProps {
  form: UseProblemFormReturn;
  idPrefix?: string;
  problemLabel?: string;
  isFullscreen?: boolean;
  embedded?: boolean;
}

export function ProblemFormFields({
  form,
  idPrefix = "problem-form",
  problemLabel = "Problem",
  isFullscreen = false,
  embedded = false,
}: ProblemFormFieldsProps) {
  const parsedProblem = useMemo(() => {
    const text = form.formData.题目.trim();
    if (!text) return null;
    const info = extractProblemInfo(text);
    return info.isURL ? info : null;
  }, [form.formData.题目]);

  const problemUrlId = `${idPrefix}-url`;
  const problemNameId = `${idPrefix}-name`;
  const difficultyId = `${idPrefix}-difficulty`;
  const tagsId = `${idPrefix}-tags`;
  const dateId = `${idPrefix}-date`;
  const solutionId = `${idPrefix}-solution`;

  if (isFullscreen) {
    return (
      <div className="flex min-h-0 min-w-0 flex-1">
        <div className="flex w-72 shrink-0 flex-col gap-3 overflow-y-auto border-r px-5 py-4">
          <ProblemFormMetaFields
            form={form}
            ids={{ problemUrlId, problemNameId, difficultyId, tagsId, dateId }}
            problemLabel={problemLabel}
            parsedProblem={parsedProblem}
          />
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col py-4 pr-6 pl-5">
          <SolutionEditor
            id={solutionId}
            value={form.formData.题解}
            onChange={(value) => form.handleChange("题解", value)}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={embedded ? "flex flex-col gap-3 px-6 py-5" : "flex min-h-0 flex-col gap-3 overflow-y-auto px-6 py-5 max-h-[calc(85vh-9.5rem)]"}
    >
      <ProblemFormMetaFields
        form={form}
        ids={{ problemUrlId, problemNameId, difficultyId, tagsId, dateId }}
        problemLabel={problemLabel}
        parsedProblem={parsedProblem}
      />

      <SolutionEditor
        id={solutionId}
        value={form.formData.题解}
        onChange={(value) => form.handleChange("题解", value)}
      />
    </div>
  );
}

interface ProblemFormMetaFieldsProps {
  form: UseProblemFormReturn;
  ids: {
    problemUrlId: string;
    problemNameId: string;
    difficultyId: string;
    tagsId: string;
    dateId: string;
  };
  problemLabel: string;
  parsedProblem: ReturnType<typeof extractProblemInfo> | null;
}

function ProblemFormMetaFields({
  form,
  ids,
  problemLabel,
  parsedProblem,
}: ProblemFormMetaFieldsProps) {
  return (
    <>
      <div className="grid gap-1.5">
        <Label htmlFor={ids.problemUrlId} className="text-xs">
          {problemLabel} <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id={ids.problemUrlId}
          placeholder="https://codeforces.com/contest/1234/problem/A"
          value={form.formData.题目}
          onChange={(e) => form.handleChange("题目", e.target.value)}
        />
        {parsedProblem && (
          <p className="text-xs text-muted-foreground">
            {parsedProblem.source}: <span className="font-medium text-foreground">{parsedProblem.name}</span>
          </p>
        )}
        {form.errors.题目 && <p className="text-xs text-destructive">{form.errors.题目}</p>}
      </div>

      <div className="grid gap-1.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,140px)] sm:items-start sm:gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor={ids.problemNameId} className="text-xs">
            Problem Name
          </Label>
          <Input
            id={ids.problemNameId}
            placeholder="Problem title (optional)"
            value={form.formData.题目名称}
            onChange={(e) => form.handleChange("题目名称", e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={ids.difficultyId} className="text-xs">
            Difficulty
          </Label>
          <Input
            id={ids.difficultyId}
            type="number"
            placeholder="1600"
            value={form.formData.难度}
            onChange={(e) => form.handleChange("难度", e.target.value)}
          />
          {form.errors.难度 && <p className="text-xs text-destructive">{form.errors.难度}</p>}
        </div>
      </div>

      <div className="grid gap-1.5 sm:grid-cols-2 sm:gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor={ids.tagsId} className="text-xs">
            Tags
          </Label>
          <TagsInput
            value={form.formData.关键词}
            onChange={(value) => form.handleChange("关键词", value)}
            suggestions={form.allTags}
            placeholder="Add tags..."
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={ids.dateId} className="text-xs">
            AC Time
          </Label>
          <Input
            id={ids.dateId}
            type="datetime-local"
            value={ProblemService.timestampToInputDate(form.formData.日期)}
            onChange={(e) => form.handleChange("日期", ProblemService.inputDateToTimestamp(e.target.value))}
          />
        </div>
      </div>
    </>
  );
}
