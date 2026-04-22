import { useState, useCallback, useEffect } from "react";
import type { ProblemInput, SolvedProblem } from "@/types/domain.types";
import { ProblemService } from "@/services/problem-service";
import { normalizeTagsString } from "@/services/tag-service";
import { useProblems } from "@/hooks/use-problems-queries";

export interface ProblemFormData {
  题目: string;
  题目名称: string;
  难度: string;
  题解: string;
  关键词: string;
  日期: number;
}

export interface FormErrors {
  题目?: string;
  难度?: string;
}

export type ProblemFormInitialValues = Partial<
  Pick<ProblemInput, "题目" | "题目名称" | "难度" | "题解" | "关键词" | "日期">
>;

type FormMode = "add" | "edit";

interface UseProblemFormOptionsBase {
  initialProblem?: SolvedProblem | null;
  initialValues?: ProblemFormInitialValues;
  onSheetOpen?: boolean;
}

interface UseProblemFormAddOptions extends UseProblemFormOptionsBase {
  mode?: "add";
  onSubmit: (data: Omit<SolvedProblem, "id">) => Promise<boolean>;
}

interface UseProblemFormEditOptions extends UseProblemFormOptionsBase {
  mode: "edit";
  onSubmit: (changes: Partial<SolvedProblem>) => Promise<boolean>;
}

type UseProblemFormOptions = UseProblemFormAddOptions | UseProblemFormEditOptions;

export interface UseProblemFormReturn {
  mode: FormMode;
  formData: ProblemFormData;
  errors: FormErrors;
  isSubmitting: boolean;
  allTags: string[];
  handleChange: (field: keyof ProblemFormData, value: string | number) => void;
  handleSubmit: () => Promise<boolean>;
  hydrate: (values: ProblemFormInitialValues) => void;
  reset?: (values?: ProblemFormInitialValues) => void;
}

function createProblemFormData(values?: ProblemFormInitialValues): ProblemFormData {
  return {
    题目: values?.题目 ?? "",
    题目名称: values?.题目名称 ?? "",
    难度: values?.难度 ?? "",
    题解: values?.题解 ?? "",
    关键词: values?.关键词 ?? "",
    日期: values?.日期 ?? ProblemService.getCurrentTimestamp(),
  };
}

function createProblemFormDataFromProblem(problem: SolvedProblem): ProblemFormData {
  return {
    题目: problem.题目,
    题目名称: problem.题目名称 ?? "",
    难度: problem.难度 ?? "",
    题解: problem.题解,
    关键词: problem.关键词,
    日期: problem.日期,
  };
}

export function useProblemForm(options: UseProblemFormOptions): UseProblemFormReturn {
  const { initialProblem, initialValues, onSheetOpen, onSubmit } = options;
  const isEditMode = "mode" in options && options.mode === "edit";
  const mode: FormMode = isEditMode ? "edit" : "add";

  const [formData, setFormData] = useState<ProblemFormData>(() => {
    if (initialProblem) {
      return createProblemFormDataFromProblem(initialProblem);
    }

    return createProblemFormData(initialValues);
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { allTags } = useProblems();

  useEffect(() => {
    if (!initialProblem) {
      return;
    }

    setFormData(createProblemFormDataFromProblem(initialProblem));
    setErrors({});
  }, [initialProblem]);

  useEffect(() => {
    if (mode !== "add" || initialProblem || !initialValues) {
      return;
    }

    setFormData(createProblemFormData(initialValues));
    setErrors({});
  }, [initialProblem, initialValues, mode]);

  useEffect(() => {
    if (mode !== "add" || initialProblem || !onSheetOpen) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      日期: initialValues?.日期 ?? ProblemService.getCurrentTimestamp(),
    }));
  }, [initialProblem, initialValues?.日期, mode, onSheetOpen]);

  const handleChange = useCallback(
    (field: keyof ProblemFormData, value: string | number) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field as keyof FormErrors]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [errors]
  );

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    const urlValidation = ProblemService.validateProblemUrl(formData.题目);
    if (!urlValidation.valid) {
      newErrors.题目 = urlValidation.error;
    }

    const diffValidation = ProblemService.validateDifficulty(formData.难度);
    if (!diffValidation.valid) {
      newErrors.难度 = diffValidation.error;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return false;

    setIsSubmitting(true);
    try {
      const submitData = {
        题目: formData.题目.trim(),
        题目名称: formData.题目名称.trim() || undefined,
        难度: formData.难度.trim() || undefined,
        题解: formData.题解.trim(),
        关键词: normalizeTagsString(formData.关键词),
        日期: formData.日期,
      };

      const success = await onSubmit(submitData);
      return success;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, onSubmit, validate]);

  const hydrate = useCallback((values: ProblemFormInitialValues) => {
    setFormData(createProblemFormData(values));
    setErrors({});
  }, []);

  const reset = useCallback(
    (values?: ProblemFormInitialValues) => {
      setFormData(createProblemFormData(values ?? initialValues));
      setErrors({});
    },
    [initialValues]
  );

  return {
    mode,
    formData,
    errors,
    isSubmitting,
    allTags,
    handleChange,
    handleSubmit,
    hydrate,
    reset: mode === "add" ? reset : undefined,
  };
}
