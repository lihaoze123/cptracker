"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ProblemTextDialogProps {
  text: string;
  maxLength?: number;
}

export function ProblemTextDialog({ text, maxLength = 10 }: ProblemTextDialogProps) {
  const [open, setOpen] = useState(false);

  const displayText = text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="hover:underline text-left">
          {displayText}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>题目内容</DialogTitle>
        </DialogHeader>
        <div className="whitespace-pre-wrap break-words">
          {text}
        </div>
      </DialogContent>
    </Dialog>
  );
}
