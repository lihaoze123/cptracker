/**
 * Solution Editor Component
 * Shared Write/Preview editor for the solution (题解) field
 * in both add and edit problem dialogs.
 */
import { useState, useRef, lazy, Suspense, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { solutionContentClassName } from "@/components/solution-dialog";

// Lazy load the markdown renderer to avoid bundling heavy dependencies
// until the user actually switches to preview mode
const MarkdownRenderer = lazy(() => import("@/components/markdown-renderer"));

function MarkdownSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-4 bg-muted rounded w-3/4" />
      <div className="h-4 bg-muted rounded w-full" />
      <div className="h-4 bg-muted rounded w-5/6" />
      <div className="h-4 bg-muted rounded w-2/3" />
    </div>
  );
}

type EditorTab = "write" | "preview";

interface SolutionEditorProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
}

export function SolutionEditor({
  value,
  onChange,
  id,
  placeholder = "Write your solution in Markdown. Supports math ($...$), code blocks, and more.",
}: SolutionEditorProps) {
  const [activeTab, setActiveTab] = useState<EditorTab>("write");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertSnippet = useCallback(
    (before: string, after: string, defaultText: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.slice(start, end);
      const replacement = selectedText || defaultText;

      const newValue =
        value.slice(0, start) + before + replacement + after + value.slice(end);

      onChange(newValue);

      // Restore cursor position after React re-renders
      requestAnimationFrame(() => {
        textarea.focus();
        const cursorPos = start + before.length + replacement.length;
        textarea.setSelectionRange(
          selectedText ? cursorPos + after.length : start + before.length,
          selectedText ? cursorPos + after.length : start + before.length + replacement.length,
        );
      });
    },
    [value, onChange],
  );

  const insertCodeBlock = useCallback(() => {
    insertSnippet("\n```\n", "\n```\n", "code");
  }, [insertSnippet]);

  const insertInlineCode = useCallback(() => {
    insertSnippet("`", "`", "code");
  }, [insertSnippet]);

  const insertMath = useCallback(() => {
    insertSnippet("$", "$", "x^2");
  }, [insertSnippet]);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">
          Solution
        </Label>
        <div className="flex items-center gap-0.5 border border-border">
          <button
            type="button"
            onClick={() => setActiveTab("write")}
            className={cn(
              "px-2.5 py-1 text-xs transition-colors",
              activeTab === "write"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Write
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={cn(
              "px-2.5 py-1 text-xs transition-colors",
              activeTab === "preview"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Preview
          </button>
        </div>
      </div>

      {activeTab === "write" && (
        <>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={insertCodeBlock}
              title="Insert code block"
            >
              <span className="font-mono text-xs">{"{ }"}</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={insertInlineCode}
              title="Insert inline code"
            >
              <span className="font-mono text-xs">{"</>"}</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={insertMath}
              title="Insert math"
            >
              <span className="text-xs italic">fx</span>
            </Button>
          </div>
          <Textarea
            ref={textareaRef}
            id={id}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="min-h-[120px] flex-1 resize-none"
          />
        </>
      )}

      {activeTab === "preview" && (
        <div className="min-h-[120px] min-w-0 flex-1 overflow-auto border border-input bg-background px-3 py-2">
          {value.trim() ? (
            <div className={solutionContentClassName}>
              <Suspense fallback={<MarkdownSkeleton />}>
                <MarkdownRenderer content={value} />
              </Suspense>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Nothing to preview.</p>
          )}
        </div>
      )}
    </div>
  );
}
