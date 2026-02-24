import { createLazyFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, X } from "lucide-react";
import { addProblem } from "@/lib/db";
import type { ProblemInput } from "@/types/domain.types";

interface ImportData {
  url: string;
  name: string;
  rating?: number;
  tags?: string[];
  code?: string;
  language?: string;
  solvedTime?: number;
}

function createProblemInput(data: ImportData): ProblemInput {
  // Handle both string and array types for tags
  const tagsString = Array.isArray(data.tags)
    ? data.tags.join(',')
    : data.tags || '';

  return {
    题目: data.url,
    题目名称: data.name,
    难度: data.rating ? String(data.rating) : undefined,
    关键词: tagsString,
    题解: data.code ? `\`\`\`${data.language || 'cpp'}\n${data.code}\n\`\`\`` : '',
    日期: data.solvedTime || Date.now(),
  };
}

export default function ImportPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [problemName, setProblemName] = useState('');
  const processedRef = useRef(false);

  const addProblemFromData = useCallback((data: ImportData) => {
    const problem = createProblemInput(data);
    addProblem(problem)
      .then(() => {
        setProblemName(data.name);
        setStatus('success');
      })
      .catch(() => {
        setStatus('error');
      });
  }, []);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const source = searchParams.get('source');
    if (source !== 'extension') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus('error');
      return;
    }

    if (processedRef.current) return;
    processedRef.current = true;

    // 优先从 URL 参数读取数据
    const dataParam = searchParams.get('data');
    if (dataParam) {
      try {
        const data = JSON.parse(decodeURIComponent(atob(dataParam))) as ImportData;
        addProblemFromData(data);
        return;
      } catch (e) {
        console.error('Failed to parse URL data:', e);
      }
    }

    // 后备：从 content script 获取数据
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'CPTRACKER_IMPORT_DATA') {
        const data = event.data.payload as ImportData;
        addProblemFromData(data);
      }
    };

    window.addEventListener('message', handleMessage);
    window.postMessage({ type: 'REQUEST_IMPORT_DATA' }, '*');

    return () => window.removeEventListener('message', handleMessage);
  }, [addProblemFromData]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">正在导入题目...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <p className="text-destructive">导入失败，请重试</p>
          <Button onClick={() => window.location.href = '/'}>返回首页</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-background">
      <CheckCircle2 className="w-16 h-16 text-green-500" />
      <h1 className="text-2xl font-bold">题目已添加!</h1>
      <p className="text-muted-foreground">{problemName}</p>

      <div className="flex gap-4 mt-4">
        <Button variant="outline" onClick={() => window.close()}>
          <X className="w-4 h-4 mr-2" />
          关闭页面
        </Button>
        <Button onClick={() => window.location.href = '/'}>查看题目</Button>
      </div>
    </div>
  );
}

export const Route = createLazyFileRoute('/import')({
  component: ImportPage,
});
