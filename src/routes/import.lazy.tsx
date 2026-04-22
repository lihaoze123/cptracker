import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, LoaderCircle } from "lucide-react";
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
import { useAuthStore } from "@/stores/auth-store";
import {
  createImportHandoffReadyMessage,
  createImportHandoffResultMessage,
  createImportHandoffSubmitMessage,
  IMPORT_DATA_MESSAGE,
  isImportHandoffReadyMessage,
  isImportHandoffResultMessage,
  isImportHandoffSubmitMessage,
  parseImportMessagePayload,
  parseImportRouteState,
  REQUEST_IMPORT_DATA_MESSAGE,
} from "@/lib/import-source";
import type {
  ProblemFormInitialValues,
  UseProblemFormReturn,
} from "@/components/features/forms/hooks/use-problem-form";
import type { ProblemInput } from "@/types/domain.types";
import { cn } from "@/lib/utils";

const HANDOFF_READY_TIMEOUT_MS = 5000;

type SubmissionState = "editing" | "opening" | "success";
type HandoffStatus = "idle" | "waiting" | "failed";
type ReceiverStatus = "ready" | "importing" | "success" | "failed";

function ImportPage() {
  const routeState = useMemo(
    () => parseImportRouteState(new URLSearchParams(window.location.search)),
    []
  );
  const appOrigin = window.location.origin;
  const { _hasHydrated, isInitialized, isLoading } = useAuthStore();
  const { addProblems } = useProblems();
  const [submissionState, setSubmissionState] = useState<SubmissionState>("editing");
  const [importedProblemName, setImportedProblemName] = useState("");
  const [messageInitialValues, setMessageInitialValues] = useState<ProblemFormInitialValues | null>(null);
  const [handoffStatus, setHandoffStatus] = useState<HandoffStatus>("idle");
  const [handoffError, setHandoffError] = useState("");
  const [receiverStatus, setReceiverStatus] = useState<ReceiverStatus>("ready");
  const [receiverError, setReceiverError] = useState("");
  const [receiverImportedProblemName, setReceiverImportedProblemName] = useState("");

  const handoffWindowRef = useRef<Window | null>(null);
  const handoffReadyTimerRef = useRef<number | null>(null);
  const handoffPayloadRef = useRef<ReturnType<typeof createImportHandoffSubmitMessage> | null>(null);
  const handoffCompletedRef = useRef(false);
  const handoffSubmittedRef = useRef(false);
  const handoffInFlightRef = useRef(false);
  const receiverHandledSubmitRef = useRef(false);

  const initialValues = useMemo(
    () => ({
      ...routeState.initialValues,
      ...messageInitialValues,
      题目: messageInitialValues?.题目 || routeState.initialValues.题目 || "",
    }),
    [messageInitialValues, routeState.initialValues]
  );

  const isEmbeddedUserscript = routeState.source === "userscript" && routeState.embedded;
  const isHandoffReceiver = routeState.source === "userscript" && routeState.handoff && !routeState.embedded;
  const isReceiverReadyForImport = _hasHydrated && !isLoading && isInitialized;

  const clearHandoffReadyTimer = useCallback(() => {
    if (handoffReadyTimerRef.current !== null) {
      window.clearTimeout(handoffReadyTimerRef.current);
      handoffReadyTimerRef.current = null;
    }
  }, []);

  const beginEmbeddedHandoff = useCallback(async (data: ProblemInput) => {
    if (handoffInFlightRef.current) {
      return false;
    }

    const requestId = crypto.randomUUID();
    const handoffUrl = new URL("/import", `${appOrigin}/`);
    handoffUrl.searchParams.set("source", "userscript");
    handoffUrl.searchParams.set("handoff", "1");
    handoffUrl.searchParams.set("requestId", requestId);

    const openedWindow = window.open(handoffUrl.toString(), "_blank", "noopener=false,noreferrer=false");
    if (!openedWindow) {
      setHandoffStatus("failed");
      setHandoffError("浏览器拦截了 CP Tracker 导入窗口，请允许弹窗或使用 Open in tab。");
      return false;
    }

    handoffCompletedRef.current = false;
    handoffSubmittedRef.current = false;
    handoffInFlightRef.current = true;
    handoffWindowRef.current = openedWindow;
    handoffPayloadRef.current = createImportHandoffSubmitMessage(requestId, data);
    setHandoffError("");
    setHandoffStatus("waiting");
    setSubmissionState("opening");

    clearHandoffReadyTimer();
    handoffReadyTimerRef.current = window.setTimeout(() => {
      if (handoffCompletedRef.current) {
        return;
      }

      handoffInFlightRef.current = false;
      setHandoffStatus("failed");
      setSubmissionState("editing");
      setHandoffError("没有等到 CP Tracker 导入窗口响应，请重试或使用 Open in tab。");
    }, HANDOFF_READY_TIMEOUT_MS);

    return true;
  }, [appOrigin, clearHandoffReadyTimer]);

  const form = useProblemForm({
    mode: "add",
    initialValues,
    onSubmit: async (data) => {
      if (isEmbeddedUserscript) {
        return beginEmbeddedHandoff(data);
      }

      const success = await addProblems([data]);
      if (success) {
        setImportedProblemName(data.题目名称 || data.题目);
        setSubmissionState("success");
      }
      return success;
    },
  });

  useEffect(() => {
    return () => {
      clearHandoffReadyTimer();
    };
  }, [clearHandoffReadyTimer]);

  useEffect(() => {
    if (routeState.source !== "extension") {
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type !== IMPORT_DATA_MESSAGE) {
        return;
      }

      setMessageInitialValues(parseImportMessagePayload(event.data.payload));
    };

    window.addEventListener("message", handleMessage);
    window.postMessage({ type: REQUEST_IMPORT_DATA_MESSAGE }, "*");

    return () => window.removeEventListener("message", handleMessage);
  }, [routeState.source]);

  useEffect(() => {
    if (!isEmbeddedUserscript) {
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== appOrigin) {
        return;
      }

      if (event.source !== handoffWindowRef.current) {
        return;
      }

      if (isImportHandoffReadyMessage(event.data)) {
        const pendingMessage = handoffPayloadRef.current;
        if (
          !pendingMessage ||
          pendingMessage.requestId !== event.data.requestId ||
          handoffSubmittedRef.current ||
          handoffCompletedRef.current
        ) {
          return;
        }

        handoffSubmittedRef.current = true;
        handoffWindowRef.current?.postMessage(pendingMessage, appOrigin);
        return;
      }

      if (!isImportHandoffResultMessage(event.data)) {
        return;
      }

      const pendingMessage = handoffPayloadRef.current;
      if (!pendingMessage || pendingMessage.requestId !== event.data.requestId) {
        return;
      }

      handoffCompletedRef.current = true;
      handoffInFlightRef.current = false;
      clearHandoffReadyTimer();
      handoffPayloadRef.current = null;

      if (event.data.success) {
        setImportedProblemName(event.data.importedProblemName || pendingMessage.payload.题目名称 || pendingMessage.payload.题目);
        setHandoffStatus("idle");
        setHandoffError("");
        setSubmissionState("success");
        return;
      }

      setHandoffStatus("failed");
      setSubmissionState("editing");
      setHandoffError(event.data.error || "CP Tracker 导入失败，请重试或使用 Open in tab。");
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [appOrigin, clearHandoffReadyTimer, isEmbeddedUserscript]);

  useEffect(() => {
    if (!isHandoffReceiver || !routeState.requestId || window.opener === null || !isReceiverReadyForImport) {
      return;
    }

    receiverHandledSubmitRef.current = false;
    const opener = window.opener;
    opener.postMessage(createImportHandoffReadyMessage(routeState.requestId), appOrigin);

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== appOrigin) {
        return;
      }

      if (event.source !== opener) {
        return;
      }

      if (!isImportHandoffSubmitMessage(event.data)) {
        return;
      }

      if (
        event.data.requestId !== routeState.requestId ||
        receiverHandledSubmitRef.current
      ) {
        return;
      }

      receiverHandledSubmitRef.current = true;
      setReceiverStatus("importing");
      setReceiverError("");

      void (async () => {
        const success = await addProblems([event.data.payload]);
        if (success) {
          const importedName = event.data.payload.题目名称 || event.data.payload.题目;
          setReceiverImportedProblemName(importedName);
          setReceiverStatus("success");
          opener.postMessage(
            createImportHandoffResultMessage(routeState.requestId!, true, {
              importedProblemName: importedName,
            }),
            appOrigin
          );
          return;
        }

        const errorMessage = "CP Tracker 顶层页面写入失败，请检查当前模式和登录状态后重试。";
        setReceiverStatus("failed");
        setReceiverError(errorMessage);
        opener.postMessage(
          createImportHandoffResultMessage(routeState.requestId!, false, {
            error: errorMessage,
          }),
          appOrigin
        );
      })();
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [addProblems, appOrigin, isHandoffReceiver, isReceiverReadyForImport, routeState.requestId]);

  if (isHandoffReceiver) {
    return <ImportHandoffReceiver status={receiverStatus} importedProblemName={receiverImportedProblemName} error={receiverError} />;
  }

  if (submissionState === "success") {
    return routeState.embedded ? (
      <ImportEmbeddedSuccess importedProblemName={importedProblemName} />
    ) : (
      <ImportStandaloneSuccess importedProblemName={importedProblemName} />
    );
  }

  if (routeState.embedded) {
    return (
      <ImportEmbeddedPage
        form={form}
        isOpening={submissionState === "opening"}
        handoffError={handoffStatus === "failed" ? handoffError : ""}
      />
    );
  }

  return (
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

function ImportStandaloneSuccess({
  importedProblemName,
}: {
  importedProblemName: string;
}) {
  return (
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

function ImportEmbeddedPage({
  form,
  isOpening,
  handoffError,
}: {
  form: UseProblemFormReturn;
  isOpening: boolean;
  handoffError: string;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-background text-foreground">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <ProblemFormFields form={form} idPrefix="import-problem" embedded />
      </div>
      <div className="border-t px-6 py-4">
        <div className="flex flex-wrap items-center justify-end gap-2">
          {isOpening ? (
            <div className="mr-auto flex items-center gap-2 text-xs text-foreground">
              <LoaderCircle className="size-4 animate-spin" />
              <span>正在打开 CP Tracker 顶层导入窗口…</span>
            </div>
          ) : null}
          {handoffError ? (
            <p className="mr-auto text-xs text-destructive">{handoffError}</p>
          ) : null}
          <Button onClick={() => form.handleSubmit()} disabled={form.isSubmitting || isOpening}>
            {isOpening ? "Opening..." : form.isSubmitting ? "Importing..." : "Import Problem"}
          </Button>
        </div>
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

function ImportHandoffReceiver({
  status,
  importedProblemName,
  error,
}: {
  status: ReceiverStatus;
  importedProblemName: string;
  error: string;
}) {
  return (
    <ImportPageLayout embedded={false}>
      <Card className="w-full max-w-xl py-0">
        <CardContent className="flex flex-col items-center gap-4 px-6 py-10 text-center">
          {status === "success" ? (
            <CheckCircle2 className="size-12 text-green-500" />
          ) : (
            <LoaderCircle className={cn("size-12 text-muted-foreground", status === "importing" ? "animate-spin" : "")} />
          )}
          <div className="space-y-1">
            <h1 className="text-lg font-medium">
              {status === "ready"
                ? "等待 CP Tracker 完成初始化并接收导入数据"
                : status === "importing"
                  ? "正在导入题目"
                  : status === "success"
                    ? "题目已添加"
                    : "导入失败"}
            </h1>
            <p className="text-xs text-muted-foreground break-all">
              {status === "success"
                ? importedProblemName
                : status === "failed"
                  ? error
                  : "请保持这个窗口打开，直到嵌入页提示成功。"}
            </p>
          </div>
        </CardContent>
        <CardFooter className="justify-center gap-2 border-t px-6 py-4">
          <Button variant="outline" onClick={() => window.location.reload()}>
            重新打开
          </Button>
          <Button asChild>
            <Link to="/">返回首页</Link>
          </Button>
        </CardFooter>
      </Card>
    </ImportPageLayout>
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
