import { useState, useEffect } from 'react';
import { storage } from 'wxt/utils/storage';
import { Settings, ArrowLeft, Key, AlertCircle } from 'lucide-react';
import type { ProblemInfo, ExtensionSettings, ImportPayload } from '../../utils/types';
import { resolveSubmissionUrl as resolveSubmissionUrlByPlatform } from '../../utils/platforms';

export default function App() {
  const INTER_PAGE_DELAY_MS = 1500;

  const [problem, setProblem] = useState<ProblemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<ExtensionSettings>({
    clistApiKey: '',
    clistUsername: '',
    cptrackerUrl: 'https://competitive-programming-tracker.netlify.app',
  });

  const [formData, setFormData] = useState({
    name: '',
    rating: '',
    tags: '',
    includeCode: false,
    solvedTime: '',
    code: '',
    language: 'cpp',
  });

  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'extracting'>('idle');

  // 当状态为 extracting 时，轮询检查是否提取完成
  useEffect(() => {
    if (status !== 'extracting') return;

    const checkExtraction = async () => {
      const savedInfo = await storage.getItem<ProblemInfo>('local:extractedProblem');
      if (savedInfo && savedInfo.code) {
        // 提取完成，更新表单数据
        setProblem(savedInfo);
        setFormData({
          name: savedInfo.name || '',
          rating: savedInfo.rating || '',
          tags: savedInfo.tags?.join(', ') || '',
          includeCode: false,
          solvedTime: formatSolvedTime(savedInfo.solvedTime),
          code: savedInfo.code || '',
          language: savedInfo.language || 'cpp',
        });
        setStatus('idle');
      }
    };

    const interval = setInterval(checkExtraction, 1000);
    return () => clearInterval(interval);
  }, [status]);

  // 格式化时间戳为 datetime-local 输入格式（使用本地时区显示）
  const formatSolvedTime = (timestamp?: number): string => {
    if (!timestamp) return '';
    // 时间戳是 UTC 时间，创建 Date 时会自动转换为本地时区
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  useEffect(() => {
    Promise.all([
      storage.getItem<string>('local:clistApiKey'),
      storage.getItem<string>('local:clistUsername'),
      storage.getItem<string>('local:cptrackerUrl'),
    ]).then(([apiKey, username, cptrackerUrl]) => {
      setSettings({
        clistApiKey: apiKey || '',
        clistUsername: username || '',
        cptrackerUrl: cptrackerUrl || 'https://competitive-programming-tracker.netlify.app',
      });
      setApiKeyMissing(!apiKey || !username);
    });

    // 添加重试机制
    const fetchWithRetry = async (tabId: number, retries = 3): Promise<any> => {
      for (let i = 0; i < retries; i++) {
        try {
          const response = await browser.tabs.sendMessage(tabId, { type: 'GET_PROBLEM_INFO' });
          return response;
        } catch (err) {
          console.log(`[Popup] Retry ${i + 1}/${retries}:`, err);
          if (i < retries - 1) {
            await new Promise(r => setTimeout(r, 500));
          }
        }
      }
      return null;
    };

    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      console.log('[Popup] Query tabs:', tabs[0]?.url);
      if (tabs[0]?.id) {
        fetchWithRetry(tabs[0].id).then(async (response) => {
          console.log('[Popup] Received response:', response);
          setLoading(false);

          // 调试：打印 response 结构
          if (!response?.success) {
            console.log('[Popup] Response not successful:', response);
            setProblem(null);
            return;
          }

          if (!response?.data) {
            console.log('[Popup] No data in response:', response);
            setProblem(null);
            return;
          }

          setProblem(response.data);
          setFormData({
            name: response.data.name || '',
            rating: response.data.rating || '',
            tags: response.data.tags?.join(', ') || '',
            includeCode: false,
            solvedTime: formatSolvedTime(response.data.solvedTime),
            code: response.data.code || '',
            language: response.data.language || 'cpp',
          });
          if (!response.data.rating) {
            setApiKeyMissing(true);
          }

          // 如果没有代码，自动跳转到提交页面
          if (!response.data.code) {
            const url = resolveSubmissionUrl(response.data);
            if (url) {
              const partialPayload: ImportPayload = {
                url: response.data.url,
                name: response.data.name || '',
                rating: response.data.rating || '',
                tags: response.data.tags?.join(', ') || '',
                solvedTime: response.data.solvedTime,
                code: '',
              };
              await storage.setItem('local:pendingProblemData', partialPayload);
              setStatus('extracting');
              // 延迟一下让用户看到状态
              setTimeout(() => {
                browser.tabs.update({ url });
              }, INTER_PAGE_DELAY_MS);
              return;
            }
          }
        }).catch((err) => {
          console.error('[Popup] Error getting problem info:', err);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });
  }, []);

  const resolveSubmissionUrl = (info: ProblemInfo): string => {
    return resolveSubmissionUrlByPlatform(info, window.location.href);
  };

  const openSubmissionForCode = async () => {
    if (!problem || !formData.name.trim()) return;

    const submissionUrl = resolveSubmissionUrl(problem);
    if (!submissionUrl) {
      console.warn('[Popup] No submission URL resolved');
      return;
    }

    const partialPayload: ImportPayload = {
      url: problem.url,
      name: formData.name.trim(),
      rating: formData.rating,
      tags: formData.tags,
      solvedTime: problem.solvedTime,
      code: '',
    };
    await storage.setItem('local:pendingProblemData', partialPayload);
    setStatus('extracting');
    // 延迟一下让用户看到状态
    setTimeout(() => {
      browser.tabs.update({ url: submissionUrl });
    }, INTER_PAGE_DELAY_MS);
  };

  const handleSave = async () => {
    if (!problem || !formData.name.trim()) return;

    // 将 datetime-local 转换为时间戳
    const solvedTimeTimestamp = formData.solvedTime
      ? new Date(formData.solvedTime).getTime()
      : problem.solvedTime;

    // 使用用户编辑后的代码（如果有的话）
    const codeToSave = formData.includeCode
      ? (formData.code || problem.code || '')
      : '';

    const payload: ImportPayload = {
      url: problem.url,
      name: formData.name.trim(),
      rating: formData.rating,
      tags: formData.tags,
      solvedTime: solvedTimeTimestamp,
      code: codeToSave,
      language: formData.includeCode ? formData.language : undefined,
    };

    // 将数据编码到 URL 中
    const encodedData = btoa(encodeURIComponent(JSON.stringify(payload)));
    const importUrl = `${settings.cptrackerUrl}/import?source=extension&data=${encodedData}`;

    await storage.setItem('local:pendingImportData', payload);
    browser.tabs.create({ url: importUrl });
    window.close();
  };

  if (settingsOpen) {
    return (
      <SettingsView
        settings={settings}
        onSave={async (newSettings) => {
          await storage.setItem('local:clistApiKey', newSettings.clistApiKey);
          await storage.setItem('local:clistUsername', newSettings.clistUsername);
          await storage.setItem('local:cptrackerUrl', newSettings.cptrackerUrl);
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

  if (status === 'extracting') {
    return (
      <div className="w-80 p-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg font-medium">正在提取代码...</p>
          <p className="text-sm text-slate-500 mt-2">请稍候，将自动跳转回题目页面</p>
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

            <div>
              <label className="text-sm font-medium block mb-1 text-slate-700 dark:text-slate-300">
                AC Time
              </label>
              <input
                type="datetime-local"
                className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={formData.solvedTime}
                onChange={(e) => setFormData({ ...formData, solvedTime: e.target.value })}
              />
            </div>

            {problem.code ? (
              <div className="space-y-2">
                <label className="flex items-center gap-2.5 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.includeCode}
                    onChange={(e) => setFormData({ ...formData, includeCode: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300">Include Code</span>
                </label>
                {formData.includeCode && (
                  <>
                    <select
                      className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.language}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    >
                      <option value="cpp">C++</option>
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="javascript">JavaScript</option>
                      <option value="rust">Rust</option>
                      <option value="go">Go</option>
                      <option value="other">Other</option>
                    </select>
                    <textarea
                      className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      rows={8}
                      placeholder="Paste your code here..."
                    />
                  </>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={openSubmissionForCode}
                className="w-full py-2 text-sm text-blue-500 hover:text-blue-600 transition-colors"
              >
                去提交页面获取代码 →
              </button>
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
            请在支持的 OJ 题目页面使用
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
            clist.by Username
          </label>
          <input
            type="text"
            className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            value={formData.clistUsername}
            onChange={(e) => setFormData({ ...formData, clistUsername: e.target.value })}
            placeholder="你的 clist.by 用户名"
          />
        </div>

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
