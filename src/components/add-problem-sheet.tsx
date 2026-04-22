import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { ProblemFormFields } from "@/components/features/forms/problem-form-fields";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, FullScreenIcon, Menu01Icon } from "@hugeicons/core-free-icons";
import type { SolvedProblem } from "@/types/domain.types";
import { cn } from "@/lib/utils";
import { useProblemForm } from "@/components/features/forms/hooks/use-problem-form";

interface AddProblemSheetProps {
  onAdd: (problem: Omit<SolvedProblem, "id">) => Promise<boolean>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddProblemSheet({ onAdd, open: controlledOpen, onOpenChange }: AddProblemSheetProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = (nextOpen: boolean) => {
    if (!nextOpen) {
      setIsFullscreen(false);
    }

    if (isControlled) {
      onOpenChange?.(nextOpen);
      return;
    }

    setInternalOpen(nextOpen);
  };

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <HugeiconsIcon icon={Add01Icon} data-icon="inline-start" />
          Add Problem
        </Button>
      </DialogTrigger>
      <DialogContent
        className={cn(
          "flex flex-col gap-0 overflow-hidden p-0",
          isFullscreen
            ? "top-0 left-0 h-dvh max-h-dvh w-dvw max-w-dvw translate-x-0 translate-y-0 rounded-none sm:max-w-dvw"
            : "max-h-[85vh] sm:max-w-xl"
        )}
      >
        <DialogHeader className={cn("border-b px-6 pr-24", isFullscreen ? "py-2.5" : "py-5")}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <DialogTitle>Add New Problem</DialogTitle>
              <DialogDescription>Add a new solved problem to your collection.</DialogDescription>
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

        <ProblemFormFields form={form} idPrefix="add-problem" isFullscreen={isFullscreen} />

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
