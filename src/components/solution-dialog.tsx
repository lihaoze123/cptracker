"use client";

import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import "katex/dist/katex.min.css";
import { Link, useNavigate, useRouter, useRouterState } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

/**
 * Type for router state with optional solution param
 * Used for type-safe access to solution search param
 */
interface RouterStateWithSolution {
  solution?: string;
}

/**
 * Type-safe function to update search params with solution.
 * Note: TanStack Router's search param types are route-specific.
 * This component is used across multiple routes, and TypeScript
 * cannot express cross-route navigation. The runtime behavior is correct.
 */
function updateSolutionParam(
  prev: Record<string, unknown>,
  solutionId: string,
  add: boolean
): Record<string, unknown> {
  const search = prev as RouterStateWithSolution;
  const next = { ...prev };
  if (add) {
    next.solution = solutionId;
  } else if (search.solution === solutionId) {
    delete next.solution;
  }
  return next;
}

export function SolutionContent({ solution }: { solution: string }) {
  return (
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
                showLineNumbers={true}
                language={match[1]}
                PreTag="div"
                style={oneLight}
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
  );
}

interface SolutionDialogProps {
  solution: string;
  problemName: string;
  solutionId?: string;
  ownerUsername?: string;
}

export function SolutionDialog({
  solution,
  problemName,
  solutionId,
  ownerUsername,
}: SolutionDialogProps) {
  const navigate = useNavigate();
  const router = useRouter();
  const activeSolutionId = useRouterState({
    select: (state) => {
      const search = state.location.search as RouterStateWithSolution;
      return typeof search.solution === "string" ? search.solution : undefined;
    },
  });
  const [localOpen, setLocalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const open = solutionId ? activeSolutionId === solutionId : localOpen;

  const publicLink = useMemo(() => {
    if (!ownerUsername || !solutionId) return null;
    const location = router.buildLocation({
      to: "/$username/solutions/$solutionId",
      params: { username: ownerUsername, solutionId },
    });
    const base = typeof window !== "undefined" ? window.location.origin : "";
    return base ? `${base}${location.href}` : location.href;
  }, [ownerUsername, solutionId, router]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (solutionId) {
      navigate({
        // TanStack Router's search types are route-specific, but this component
        // is used across multiple routes. The runtime behavior is correct.
        // @ts-expect-error - Cross-route search param navigation
        search: (prev: Record<string, unknown>) => updateSolutionParam(prev, solutionId, nextOpen),
        replace: true,
      });
    }
    if (!solutionId) {
      setLocalOpen(nextOpen);
    }
  };

  const handleCopyPublicLink = async () => {
    if (!publicLink) return;
    try {
      await navigator.clipboard.writeText(publicLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy public solution link:", err);
    }
  };

  if (!solution || solution.length === 0) {
    return <span className="text-muted-foreground">-</span>;
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
        {publicLink && (
          <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            <Link
              to="/$username/solutions/$solutionId"
              params={{
                username: ownerUsername as string,
                solutionId: solutionId as string,
              }}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate hover:text-foreground"
              title="Open public solution link"
            >
              {publicLink}
            </Link>
            <button
              type="button"
              onClick={handleCopyPublicLink}
              className="flex-shrink-0 rounded border px-2 py-1 text-xs hover:bg-accent"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        )}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <SolutionContent solution={solution} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
