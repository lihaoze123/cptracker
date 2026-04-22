import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProblemFormFields } from "@/components/features/forms/problem-form-fields";
import { useProblemForm } from "@/components/features/forms/hooks/use-problem-form";
import { useProblems } from "@/hooks/use-problems-queries";
import { parseImportMessagePayload, parseImportRouteState } from "@/lib/import-source";
import type { ProblemFormInitialValues } from "@/components/features/forms/hooks/use-problem-form";
import { cn } from "@/lib/utils";

function ImportPage() {
  const routeState = useMemo(
    () => parseImportRouteState(new URLSearchParams(window.location.search)),
    []
  );
  const { addProblems } = useProblems();
  const [submissionState, setSubmissionState] = useState<"editing" | "success">("editing");
  const [importedProblemName, setImportedProblemName] = useState("");
  const [messageInitialValues, setMessageInitialValues] = useState<ProblemFormInitialValues | null>(null);

  const initialValues = useMemo(
    () => ({
      ...routeState.initialValues,
      ...messageInitialValues,
      题目: messageInitialValues?.题目 || routeState.initialValues.题目 || "",
    }),
    [messageInitialValues, routeState.initialValues]
  );

  const form = useProblemForm({
    mode: "add",
    initialValues,
    onSubmit: async (data) => {
      const success = await addProblems([data]);
      if (success) {
        setImportedProblemName(data.题目名称 || data.题目);
        setSubmissionState("success");
      }
      return success;
    },
  });

  useEffect(() => {
    if (routeState.source !== "extension") {
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type !== "CPTRACKER_IMPORT_DATA") {
        return;
      }

      setMessageInitialValues(parseImportMessagePayload(event.data.payload));
    };

    window.addEventListener("message", handleMessage);
    window.postMessage({ type: "REQUEST_IMPORT_DATA" }, "*");

    return () => window.removeEventListener("message", handleMessage);
  }, [routeState.source]);

  if (submissionState === "success") {
    return routeState.embedded ? (
      <ImportEmbeddedSuccess importedProblemName={importedProblemName} />
    ) : (
      <ImportPageLayout embedded={false}>
        <Card className="w-full max-w-xl py-0">
          <CardContent className="flex flex-col items-center gap-4 px-6 py-10 text-center">
            <CheckCircle2 className="size-12 text-green-500" />
            <div className="space-y-1">
              <h1 className="text-lg font-medium">题目已添加</h1>
              <p className="text-xs text-muted-foreground break-all">{importedProblemName}</p>
            </div>
          </CardContent>
          <CardFooter className="justify-center gap-2 border-t px-6 py-4">
            <Button variant="outline" onClick={() => window.location.reload()}>
              再导入一题
            </Button>
            <Button asChild>
              <Link to="/">返回首页</Link>
            </Button>
          </CardFooter>
        </Card>
      </ImportPageLayout>
    );
  }

  return routeState.embedded ? (
    <ImportEmbeddedPage form={form} />
  ) : (
    <ImportPageLayout embedded={false}>
      <Card className="w-full max-w-3xl py-0">
        <CardHeader className="border-b px-6 py-5">
          <CardTitle>Import Problem</CardTitle>
          <CardDescription>
            当前题目链接来自 OJ 页面，其余信息全部以你在此表单中的输入为准。
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 py-0">
          <ProblemFormFields form={form} idPrefix="import-problem" />
        </CardContent>
        <CardFooter className="justify-end gap-2 border-t px-6 py-4">
          <Button asChild variant="outline">
            <Link to="/">取消</Link>
          </Button>
          <Button onClick={() => form.handleSubmit()} disabled={form.isSubmitting}>
            {form.isSubmitting ? "Importing..." : "Import Problem"}
          </Button>
        </CardFooter>
      </Card>
    </ImportPageLayout>
  );
}

function ImportEmbeddedPage({
  form,
}: {
  form: ReturnType<typeof useProblemForm>;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-background text-foreground">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <ProblemFormFields form={form} idPrefix="import-problem" embedded />
      </div>
      <div className="flex justify-end border-t px-6 py-4">
        <Button onClick={() => form.handleSubmit()} disabled={form.isSubmitting}>
          {form.isSubmitting ? "Importing..." : "Import Problem"}
        </Button>
      </div>
    </div>
  );
}

function ImportEmbeddedSuccess({
  importedProblemName,
}: {
  importedProblemName: string;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground">
      <CheckCircle2 className="size-12 text-green-500" />
      <div className="space-y-1">
        <h1 className="text-lg font-medium">题目已添加</h1>
        <p className="break-all text-xs text-muted-foreground">{importedProblemName}</p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button variant="outline" onClick={() => window.location.reload()}>
          再导入一题
        </Button>
        <Button asChild>
          <a href="/" target="_blank" rel="noreferrer">
            打开 CP Tracker
          </a>
        </Button>
      </div>
    </div>
  );
}

function ImportPageLayout({
  embedded,
  children,
}: {
  embedded: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "min-h-screen bg-background text-foreground",
        embedded ? "h-screen overflow-hidden" : "container mx-auto flex min-h-screen items-center justify-center px-4 py-8"
      )}
    >
      {children}
    </div>
  );
}

export const Route = createLazyFileRoute("/import")({
  component: ImportPage,
});
