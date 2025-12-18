"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import "katex/dist/katex.min.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface SolutionDialogProps {
  solution: string;
  problemName: string;
}

export function SolutionDialog({ solution, problemName }: SolutionDialogProps) {
  const [open, setOpen] = useState(false);

  if (!solution || solution.length === 0) {
    return <span className="text-muted-foreground">-</span>;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="cursor-pointer">
          <Badge variant="secondary" className="hover:bg-secondary/80">
            Solution
          </Badge>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{problemName} - Solution</DialogTitle>
        </DialogHeader>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
              code: ({ className, children, ...props }) => {
                const match = /language-(\w+)/.exec(className || "");
                const codeString = String(children).replace(/\n$/, "");

                if (match) {
                  return (
                    <SyntaxHighlighter
                      language={match[1]}
                      PreTag="div"
                      customStyle={{
                        margin: 0,
                        fontSize: "0.75rem",
                      }}
                    >
                      {codeString}
                    </SyntaxHighlighter>
                  );
                }

                return (
                  <code
                    className="bg-muted px-1 py-0.5 text-xs"
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
            }}
          >
            {solution}
          </ReactMarkdown>
        </div>
      </DialogContent>
    </Dialog>
  );
}
