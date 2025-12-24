/**
 * Problem Form Hook
 * Centralized form logic for adding/editing problems
 */
import { useState, useCallback, useEffect } from "react";
import type { SolvedProblem } from "@/data/mock";
import { ProblemService } from "@/services/problem-service";
import { useProblems } from "@/hooks/use-problems-queries";

interface ProblemFormData {
  题目: string;
  题目名称: string;
  难度: string;
  题解: string;
  关键词: string;
  日期: number; // Unix timestamp in milliseconds
}

interface FormErrors {
  题目?: string;
  难度?: string;
}

type FormMode = "add" | "edit";

interface UseProblemFormOptionsBase {
  initialProblem?: SolvedProblem | null;
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

interface UseProblemFormReturn {
  mode: FormMode;
  formData: ProblemFormData;
  errors: FormErrors;
  isSubmitting: boolean;
  allTags: string[];
  handleChange: (field: keyof ProblemFormData, value: string | number) => void;
  handleSubmit: () => Promise<boolean>;
  reset?: () => void;
}

export function useProblemForm(options: UseProblemFormOptions): UseProblemFormReturn {
  const { initialProblem, onSheetOpen, onSubmit } = options;
  const isEditMode = "mode" in options && options.mode === "edit";
  const mode: FormMode = isEditMode ? "edit" : "add";

  const [formData, setFormData] = useState<ProblemFormData>({
    题目: "",
    题目名称: "",
    难度: "",
    题解: "",
    关键词: "",
    日期: ProblemService.getCurrentTimestamp(),
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { allTags } = useProblems();

  // Update form when editing or when sheet opens (add mode)
  useEffect(() => {
    if (initialProblem) {
      setFormData({
        题目: initialProblem.题目,
        题目名称: initialProblem.题目名称 || "",
        难度: initialProblem.难度 || "",
        题解: initialProblem.题解,
        关键词: initialProblem.关键词,
        日期: initialProblem.日期,
      });
      setErrors({});
    } else if (onSheetOpen && mode === "add") {
      // Update timestamp when opening add sheet
      setFormData((prev) => ({ ...prev, 日期: ProblemService.getCurrentTimestamp() }));
    }
  }, [initialProblem, onSheetOpen, mode]);

  const handleChange = useCallback((field: keyof ProblemFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

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
        关键词: ProblemService.normalizeTags(formData.关键词),
        日期: formData.日期,
      };

      if (mode === "edit") {
        // For edit mode, submit partial changes
        const success = await onSubmit(submitData);
        return success;
      } else {
        // For add mode, submit complete data (without id)
        const success = await onSubmit(submitData);
        return success;
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, onSubmit, validate, mode]);

  const reset = useCallback(() => {
    setFormData({
      题目: "",
      题目名称: "",
      难度: "",
      题解: "",
      关键词: "",
      日期: ProblemService.getCurrentTimestamp(),
    });
    setErrors({});
  }, []);

  return {
    mode,
    formData,
    errors,
    isSubmitting,
    allTags,
    handleChange,
    handleSubmit,
    reset: mode === "add" ? reset : undefined,
  };
}
