"use client";

import { useMemo, useState, lazy, Suspense } from "react";
import { Link, useNavigate, useRouter, useRouterState } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { FullScreenIcon, Menu01Icon } from "@hugeicons/core-free-icons";
import { FileText } from "lucide-react";

const MarkdownRenderer = lazy(() => import("./markdown-renderer"));

interface RouterStateWithSolution {
  solution?: string;
}

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

function MarkdownSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 w-2/5 rounded bg-muted" />
      <div className="h-4 w-full rounded bg-muted" />
      <div className="h-4 w-11/12 rounded bg-muted" />
      <div className="h-4 w-4/5 rounded bg-muted" />
      <div className="h-40 w-full rounded border bg-muted/60" />
      <div className="h-4 w-5/6 rounded bg-muted" />
      <div className="h-4 w-3/4 rounded bg-muted" />
    </div>
  );
}

export const solutionContentClassName = [
  "max-w-none text-sm leading-7 text-foreground sm:text-[15px]",
  "[&_h1]:mt-8 [&_h1:first-child]:mt-0 [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:tracking-tight",
  "[&_h2]:mt-8 [&_h2]:border-b [&_h2]:pb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight",
  "[&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold",
  "[&_h4]:mt-5 [&_h4]:text-base [&_h4]:font-semibold",
  "[&_p]:my-4 [&_p]:text-foreground/90",
  "[&_strong]:font-semibold [&_strong]:text-foreground",
  "[&_ul]:my-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6",
  "[&_ol]:my-4 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6",
  "[&_li]:text-foreground/90",
  "[&_li>p]:my-1",
  "[&_blockquote]:my-6 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:bg-muted/40 [&_blockquote]:px-4 [&_blockquote]:py-3 [&_blockquote]:text-foreground/80",
  "[&_hr]:my-8 [&_hr]:border-border",
  "[&_table]:my-6 [&_table]:w-full [&_table]:border-collapse [&_table]:text-left",
  "[&_thead]:border-b [&_tbody_tr]:border-b [&_th]:bg-muted/30 [&_th]:px-3 [&_th]:py-2 [&_th]:font-medium [&_td]:px-3 [&_td]:py-2",
  "[&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary/80",
  "[&_.katex-display]:my-6 [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden [&_.katex-display]:py-2",
].join(" ");

export function SolutionContent({ solution }: { solution: string }) {
  return (
    <Suspense fallback={<MarkdownSkeleton />}>
      <MarkdownRenderer content={solution} />
    </Suspense>
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
  const [isFullscreen, setIsFullscreen] = useState(false);
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
    if (!nextOpen) {
      setIsFullscreen(false);
    }

    if (solutionId) {
      navigate({
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
        <Button
          type="button"
          variant="outline"
          size="xs"
          className="h-6 border-border/70 px-2.5 text-muted-foreground hover:text-foreground"
        >
          <FileText className="size-3.5" />
          Read
        </Button>
      </DialogTrigger>
      <DialogContent
        className={cn(
          "grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden p-0",
          isFullscreen
            ? "top-0 left-0 h-dvh max-h-dvh w-dvw max-w-dvw translate-x-0 translate-y-0 rounded-none sm:max-w-dvw"
            : "max-h-[85vh] sm:max-w-5xl"
        )}
      >
        <DialogHeader className="border-b px-6 py-5 pr-24">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <DialogTitle className="text-base sm:text-lg">{problemName}</DialogTitle>
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

        <div
          className={cn(
            "min-h-0 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6",
            isFullscreen ? "max-h-[calc(100dvh-5.75rem)]" : "max-h-[calc(85vh-5.75rem)]"
          )}
        >
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
            {publicLink && (
              <div className="flex flex-col gap-3 border-b pb-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="min-w-0 space-y-1">
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Public Link
                  </p>
                  <Link
                    to="/$username/solutions/$solutionId"
                    params={{
                      username: ownerUsername as string,
                      solutionId: solutionId as string,
                    }}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block truncate text-foreground underline underline-offset-4"
                    title="Open public solution link"
                  >
                    {publicLink}
                  </Link>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  className="self-start sm:self-center"
                  onClick={handleCopyPublicLink}
                >
                  {copied ? "Copied" : "Copy Link"}
                </Button>
              </div>
            )}

            <div className={solutionContentClassName}>
              <SolutionContent solution={solution} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
