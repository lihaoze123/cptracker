# CPTracker 浏览器扩展导入功能实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现浏览器扩展一键从 Codeforces/AtCoder 题目页面导入题目到 CPTracker

**Architecture:** 扩展提取页面信息 → 存储到 localStorage → 用户确认编辑 → chrome.tabs.create 跳转 CPTracker → CPTracker 自动添加 → 显示成功反馈

**Tech Stack:** WXT + React + TypeScript + Tailwind (扩展), React + TanStack Router (CPTracker 后端)

---

## 实现范围

本计划包含两部分：
1. **CPTracker 后端**: 新增 `/import` 路由（自动导入）
2. **浏览器扩展**: 开发完整的 WXT 扩展

---

## Part 1: CPTracker 后端改动

### Task 1: 创建 /import 路由

**Files:**
- Create: `src/routes/import.tsx`

**Step 1: 创建路由文件**

```tsx
import { useSearchParams, useNavigate } from "react-router";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, X } from "lucide-react";
import { ProblemService } from "@/services/problem-service";
import type { SolvedProblem } from "@/data/mock";

export default function ImportPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [problemName, setProblemName] = useState('');
  const [countdown, setCountdown] = useState(3);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const source = searchParams.get('source');
    if (source !== 'extension') {
      setStatus('error');
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'CPTRACKER_IMPORT_DATA') {
        const data = event.data.payload;

        const problem: Omit<SolvedProblem, 'id'> = {
          题目: data.url,
          题目名称: data.name,
          难度: data.rating || undefined,
          关键词: data.tags,
          题解: data.code ? `\`\`\`\n${data.code}\n\`\`\`` : '',
          日期: data.solvedTime || Date.now(),
        };

        ProblemService.addProblem(problem).then(() => {
          setProblemName(data.name);
          setStatus('success');
        }).catch(() => {
          setStatus('error');
        });
      }
    };

    window.addEventListener('message', handleMessage);
    window.postMessage({ type: 'REQUEST_IMPORT_DATA' }, '*');

    return () => window.removeEventListener('message', handleMessage);
  }, [searchParams]);

  // 成功后的倒计时逻辑（可取消）
  useEffect(() => {
    if (status === 'success') {
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            window.close();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [status]);

  // 鼠标悬停时暂停倒计时
  const handleMouseEnter = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  };

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
          <Button onClick={() => navigate('/')}>返回首页</Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen gap-4 bg-background"
      onMouseEnter={handleMouseEnter}
    >
      <CheckCircle2 className="w-16 h-16 text-green-500" />
      <h1 className="text-2xl font-bold">题目已添加!</h1>
      <p className="text-muted-foreground">{problemName}</p>

      <div className="flex gap-4 mt-4">
        <Button variant="outline" onClick={() => window.close()}>
          <X className="w-4 h-4 mr-2" />
          关闭页面
        </Button>
        <Button onClick={() => navigate('/')}>查看题目</Button>
      </div>

      <p className="text-xs text-muted-foreground mt-4">
        {countdown > 0 ? `${countdown} 秒后自动关闭（鼠标悬停暂停）` : '正在关闭...'}
      </p>
    </div>
  );
}
```

---

## Part 2: 浏览器扩展开发

### Task 2: 配置 WXT Manifest 和权限

**Files:**
- Modify: `extension/wxt.config.ts`

**Step 1: 更新 wxt.config.ts**

```ts
import { defineConfig } from 'wxt';
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: 'CPTracker Import',
    description: '一键从 Codeforces/AtCoder 导入题目到 CPTracker',
    version: '1.0.0',
    permissions: [
      'storage',
      'activeTab',
      'scripting',
      'tabs'
    ],
    host_permissions: [
      '*://*.codeforces.com/*',
      '*://*.atcoder.jp/*',
      '*://clist.by/*',
      '*://competitive-programming-tracker.netlify.app/*'
    ],
    action: {
      default_popup: 'entrypoints/popup/index.html',
    },
    content_scripts: [
      {
        matches: [
          '*://*.codeforces.com/contest/*/problem/*',
          '*://*.codeforces.com/contest/*/submission/*',
          '*://*.atcoder.jp/contests/*/tasks/*',
          '*://*.atcoder.jp/contests/*/submissions/*',
          '*://competitive-programming-tracker.netlify.app/import*'
        ],
        js: ['entrypoints/content.ts'],
        run_at: 'document_idle'
      }
    ]
  }
});
```

---

### Task 3: 创建类型定义

**Files:**
- Create: `extension/utils/types.ts`

**Step 1: 创建 types.ts**

```ts
export interface ProblemInfo {
  url: string;
  name: string;
  rating?: string;
  tags: string[];
  solvedTime?: number;
  code?: string;
}

export interface ExtensionSettings {
  clistApiKey: string;
  cptrackerUrl: string;
}

export type OJPlatform = 'codeforces' | 'atcoder' | 'unknown';

export interface ImportPayload {
  url: string;
  name: string;
  rating: string;
  tags: string;
  solvedTime?: number;
  code?: string;
}
```

---

### Task 4: 实现 Codeforces 页面解析

**Files:**
- Create: `extension/utils/codeforces.ts`

**Step 1: 创建 codeforces.ts**

```ts
import type { ProblemInfo } from './types';

export function detectCodeforces(url: string): boolean {
  return url.includes('codeforces.com');
}

export function extractCodeforcesInfo(): ProblemInfo | null {
  const url = window.location.href;

  if (url.includes('/problem/')) {
    return extractFromProblemPage();
  }

  if (url.includes('/submission/')) {
    return extractFromSubmissionPage();
  }

  return null;
}

function extractFromProblemPage(): ProblemInfo {
  const nameEl = document.querySelector('#pageContent > div.problemindexholder > div.ttypography > div > div.header > div.title');
  const name = nameEl?.textContent?.trim() || '';

  const tagsEl = document.querySelector('#sidebar > div:nth-child(11) > div:nth-child(2) > div.roundbox.borderTopRound.borderBottomRound > span');
  const tags = tagsEl
    ? Array.from(tagsEl.querySelectorAll('a')).map(el => el.textContent?.trim()).filter(Boolean)
    : [];

  return {
    url: window.location.href,
    name,
    tags,
  };
}

function extractFromSubmissionPage(): ProblemInfo {
  const problemLinkEl = document.querySelector('#pageContent > div.datatable > div:nth-child(6) > table > tbody > tr.highlighted-row > td:nth-child(3) > a');
  const url = problemLinkEl?.getAttribute('href') || window.location.href;

  const codeEl = document.querySelector('#program-source-text');
  const code = codeEl?.textContent || '';

  const timeEl = document.querySelector('#pageContent > div.datatable > div:nth-child(6) > table > tbody > tr.highlighted-row > td:nth-child(8)');
  const timeStr = timeEl?.textContent || '';
  const solvedTime = parseCFTime(timeStr);

  return {
    url: url.startsWith('http') ? url : `https://codeforces.com${url}`,
    name: '',
    code,
    solvedTime,
    tags: [],
  };
}

function parseCFTime(timeStr: string): number | undefined {
  const match = timeStr.match(/(\w+)\/(\d+)\/(\d+)\s+(\d+):(\d+):(\d+)/);
  if (!match) return undefined;

  const months: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
  };

  const [, month, day, year, hour, min, sec] = match;
  return new Date(parseInt(year), months[month], parseInt(day), parseInt(hour), parseInt(min), parseInt(sec)).getTime();
}
```

---

### Task 5: 实现 AtCoder 页面解析

**Files:**
- Create: `extension/utils/atcoder.ts`

**Step 1: 创建 atcoder.ts**

```ts
import type { ProblemInfo } from './types';

export function detectAtCoder(url: string): boolean {
  return url.includes('atcoder.jp');
}

export function extractAtCoderInfo(): ProblemInfo | null {
  const url = window.location.href;

  if (url.includes('/tasks/')) {
    return extractFromTaskPage();
  }

  if (url.includes('/submissions/')) {
    return extractFromSubmissionPage();
  }

  return null;
}

function extractFromTaskPage(): ProblemInfo {
  const nameEl = document.querySelector('#main-container > div.row > div:nth-child(2) > span.h2');
  const name = nameEl?.textContent?.trim() || '';

  return {
    url: window.location.href,
    name,
    tags: [],
  };
}

async function extractFromSubmissionPage(): Promise<ProblemInfo> {
  const expandBtn = document.querySelector('#main-container > div.row > div:nth-child(2) > p:nth-child(3) > a') as HTMLAnchorElement;
  if (expandBtn) {
    expandBtn.click();
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  const codeEl = document.querySelector('#submission-code > div.ace_scroller > div > div.ace_layer.ace_text-layer');
  const code = codeEl?.textContent || '';

  const problemLinkEl = document.querySelector('#main-container > div.row > div:nth-child(2) > div:nth-child(8) > table > tbody > tr:nth-child(2) > td > a');
  const problemUrl = problemLinkEl?.getAttribute('href') || '';

  const timeEl = document.querySelector('#main-container > div.row > div:nth-child(2) > div:nth-child(8) > table > tbody > tr:nth-child(1) > td > time');
  const timeStr = timeEl?.getAttribute('datetime') || '';
  const solvedTime = timeStr ? new Date(timeStr).getTime() : undefined;

  return {
    url: problemUrl.startsWith('http') ? problemUrl : `https://atcoder.jp${problemUrl}`,
    name: '',
    code,
    solvedTime,
    tags: [],
  };
}
```

---

### Task 6: 实现 clist.by API 调用

**Files:**
- Create: `extension/utils/clist.ts`

**Step 1: 创建 clist.ts**

```ts
import type { OJPlatform } from './types';

const CLOST_API_BASE = 'https://clist.by:443/api/v4';

interface ClistProblem {
  rating?: number;
  url?: string;
  name?: string;
}

interface ClistResponse {
  objects: ClistProblem[];
}

export async function fetchRating(problemName: string, platform: OJPlatform): Promise<string | undefined> {
  const apiKey = await getApiKey();
  if (!apiKey) return undefined;

  const resourceRegex = platform === 'codeforces' ? 'codeforces' : 'atcoder.jp';

  try {
    const url = `${CLOST_API_BASE}/problem/?name=${encodeURIComponent(problemName)}&resource__regex=${resourceRegex}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': apiKey,
      },
    });

    if (!response.ok) {
      console.error('clist API error:', response.status);
      return undefined;
    }

    const data: ClistResponse = await response.json();

    if (data.objects && data.objects.length > 0) {
      return data.objects[0].rating?.toString();
    }

    return undefined;
  } catch (error) {
    console.error('Failed to fetch rating:', error);
    return undefined;
  }
}

async function getApiKey(): Promise<string | undefined> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['clistApiKey'], (result) => {
      resolve(result.clistApiKey);
    });
  });
}
```

---

### Task 7: Content Script 主逻辑

**Files:**
- Modify: `extension/entrypoints/content.ts`

**Step 1: 更新 content.ts**

```ts
import { detectCodeforces, extractCodeforcesInfo } from '../utils/codeforces';
import { detectAtCoder, extractAtCoderInfo } from '../utils/atcoder';
import { fetchRating } from '../utils/clist';
import type { ProblemInfo, OJPlatform, ImportPayload } from '../utils/types';

let extractedInfo: ProblemInfo | null = null;

function detectPlatform(url: string): OJPlatform {
  if (detectCodeforces(url)) return 'codeforces';
  if (detectAtCoder(url)) return 'atcoder';
  return 'unknown';
}

async function extractAndStore() {
  const url = window.location.href;
  const platform = detectPlatform(url);

  if (platform === 'unknown') return;

  if (platform === 'codeforces') {
    extractedInfo = extractCodeforcesInfo();
  } else if (platform === 'atcoder') {
    extractedInfo = await extractAtCoderInfo();
  }

  if (extractedInfo && extractedInfo.name) {
    const rating = await fetchRating(extractedInfo.name, platform);
    if (rating) {
      extractedInfo.rating = rating;
    }
  }

  if (extractedInfo) {
    chrome.storage.local.set({ extractedProblem: extractedInfo });
  }
}

// 处理来自 popup 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_PROBLEM_INFO') {
    if (!extractedInfo) {
      extractAndStore().then(() => {
        sendResponse({ success: true, data: extractedInfo });
      });
      return true;
    }
    sendResponse({ success: true, data: extractedInfo });
  }
  return true;
});

// 处理来自 CPTracker 页面的消息 (从 storage 读取数据)
window.addEventListener('message', (event) => {
  if (event.data?.type === 'REQUEST_IMPORT_DATA') {
    chrome.storage.local.get('pendingImportData', (result) => {
      if (result.pendingImportData) {
        window.postMessage({
          type: 'CPTRACKER_IMPORT_DATA',
          payload: result.pendingImportData
        }, '*');
        // 可选：读取后删除，避免重复导入
        // chrome.storage.local.remove('pendingImportData');
      }
    });
  }
});

if (document.readyState === 'complete') {
  extractAndStore();
} else {
  window.addEventListener('load', extractAndStore);
}
```

---

### Task 8: Background Script

**Files:**
- Modify: `extension/entrypoints/background.ts`

```ts
// 目前不需要特殊处理
```

---

### Task 9: Popup UI 主组件

**Files:**
- Modify: `extension/entrypoints/popup/App.tsx`

**Step 1: 添加 lucide-react 依赖**
```bash
cd extension && npm install lucide-react
```

**Step 2: 创建完整的 App.tsx（UI 优化版）**

```tsx
import { useState, useEffect } from 'react';
import { Settings, ArrowLeft, Key, Loader2, AlertCircle } from 'lucide-react';
import type { ProblemInfo, ExtensionSettings, ImportPayload } from '../../utils/types';

export default function App() {
  const [problem, setProblem] = useState<ProblemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<ExtensionSettings>({
    clistApiKey: '',
    cptrackerUrl: 'https://competitive-programming-tracker.netlify.app',
  });

  const [formData, setFormData] = useState({
    name: '',
    rating: '',
    tags: '',
    includeCode: false,
  });

  const [apiKeyMissing, setApiKeyMissing] = useState(false);

  useEffect(() => {
    chrome.storage.local.get(['clistApiKey', 'cptrackerUrl'], (result) => {
      setSettings({
        clistApiKey: result.clistApiKey || '',
        cptrackerUrl: result.cptrackerUrl || 'https://competitive-programming-tracker.netlify.app',
      });
      setApiKeyMissing(!result.clistApiKey);
    });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_PROBLEM_INFO' }, (response) => {
          setLoading(false);
          if (response?.success && response.data) {
            setProblem(response.data);
            setFormData({
              name: response.data.name || '',
              rating: response.data.rating || '',
              tags: response.data.tags?.join(', ') || '',
              includeCode: false,
            });
            if (!response.data.rating) {
              setApiKeyMissing(true);
            }
          }
        });
      }
    });
  }, []);

  const handleSave = () => {
    if (!problem || !formData.name.trim()) return;

    const payload: ImportPayload = {
      url: problem.url,
      name: formData.name.trim(),
      rating: formData.rating,
      tags: formData.tags,
      solvedTime: problem.solvedTime,
      code: formData.includeCode && problem.code ? problem.code : '',
    };

    chrome.storage.local.set({ pendingImportData: payload }, () => {
      chrome.tabs.create({ url: `${settings.cptrackerUrl}/import?source=extension` }, () => {
        window.close();
      });
    });
  };

  if (settingsOpen) {
    return (
      <SettingsView
        settings={settings}
        onSave={(newSettings) => {
          chrome.storage.local.set(newSettings);
          setSettings({ ...settings, ...newSettings });
          setSettingsOpen(false);
          setApiKeyMissing(!newSettings.clistApiKey);
        }}
        onClose={() => setSettingsOpen(false)}
      />
    );
  }

  if (loading) {
    return (
      <div className="w-80 p-4 bg-white dark:bg-slate-900">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
          <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded"></div>
          <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded"></div>
          <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 p-4 space-y-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-bold">CPTracker Import</h1>
        <button
          onClick={() => setSettingsOpen(true)}
          className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Settings className="w-5 h-5 text-slate-500 dark:text-slate-400" />
        </button>
      </div>

      {problem ? (
        <>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium block mb-1 text-slate-700 dark:text-slate-300">
                Problem Name *
              </label>
              <input
                type="text"
                className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="text-sm font-medium block mb-1 text-slate-700 dark:text-slate-300">
                  Difficulty
                </label>
                <input
                  type="text"
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                  placeholder="e.g. 1500"
                />
              </div>
              {apiKeyMissing && (
                <button
                  onClick={() => setSettingsOpen(true)}
                  className="mt-6 p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="配置 API Key 自动获取难度"
                >
                  <Key className="w-5 h-5 text-yellow-500" />
                </button>
              )}
            </div>

            <div>
              <label className="text-sm font-medium block mb-1 text-slate-700 dark:text-slate-300">
                Tags
              </label>
              <input
                type="text"
                className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="dp, greedy, math"
              />
            </div>

            {problem.code && (
              <label className="flex items-center gap-2.5 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.includeCode}
                  onChange={(e) => setFormData({ ...formData, includeCode: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-slate-700 dark:text-slate-300">Include Code</span>
              </label>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={!formData.name.trim()}
            className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed"
          >
            Save to CPTracker
          </button>
        </>
      ) : (
        <div className="text-center py-8">
          <AlertCircle className="w-10 h-10 mx-auto text-slate-400 mb-3" />
          <p className="text-slate-600 dark:text-slate-400">No problem detected</p>
          <p className="text-xs mt-2 text-slate-500 dark:text-slate-500">
            请在 Codeforces 或 AtCoder 题目页面使用
          </p>
        </div>
      )}
    </div>
  );
}

function SettingsView({
  settings,
  onSave,
  onClose,
}: {
  settings: ExtensionSettings;
  onSave: (s: ExtensionSettings) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState(settings);

  return (
    <div className="w-80 p-4 space-y-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-bold">Settings</h1>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-500 dark:text-slate-400" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium block mb-1.5 text-slate-700 dark:text-slate-300">
            clist.by API Key
          </label>
          <input
            type="password"
            className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            value={formData.clistApiKey}
            onChange={(e) => setFormData({ ...formData, clistApiKey: e.target.value })}
            placeholder="从 clist.by 获取 API Key"
          />
          <p className="text-xs text-slate-500 mt-1.5">
            用于自动获取题目难度 Rating
          </p>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1.5 text-slate-700 dark:text-slate-300">
            CPTracker URL
          </label>
          <input
            type="text"
            className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            value={formData.cptrackerUrl}
            onChange={(e) => setFormData({ ...formData, cptrackerUrl: e.target.value })}
          />
        </div>
      </div>

      <button
        onClick={() => onSave(formData)}
        className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-medium rounded-lg transition-colors"
      >
        Save Settings
      </button>
    </div>
  );
}
```

---

## 执行方式

**Plan complete and saved to `docs/plans/2026-02-24-browser-extension-import-plan.md`.**

Two execution options:

1. **Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

2. **Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?
