import { useEffect, useMemo, useState } from "react";
import { GM_getValue, GM_openInTab, GM_registerMenuCommand, GM_setValue } from "$";

const STORAGE_KEY = "cptracker-app-base-url";
const DEFAULT_MATCHED_APP_URL = "";

function normalizeBaseUrl(value: string) {
  return value.trim().replace(/\/+$/, "");
}

function createImportUrl(baseUrl: string, problemUrl: string) {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  if (!normalizedBaseUrl) {
    return "";
  }

  try {
    const url = new URL("/import", `${normalizedBaseUrl}/`);
    url.searchParams.set("source", "userscript");
    url.searchParams.set("embedded", "1");
    url.searchParams.set("url", problemUrl);
    return url.toString();
  } catch {
    return "";
  }
}

export default function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [isFrameLoaded, setIsFrameLoaded] = useState(false);
  const [baseUrl, setBaseUrl] = useState(DEFAULT_MATCHED_APP_URL);
  const [draftBaseUrl, setDraftBaseUrl] = useState(DEFAULT_MATCHED_APP_URL);
  const [isSaving, setIsSaving] = useState(false);

  const importUrl = useMemo(() => createImportUrl(baseUrl, window.location.href), [baseUrl]);
  const standaloneImportUrl = useMemo(() => {
    if (!importUrl) {
      return "";
    }

    const url = new URL(importUrl);
    url.searchParams.delete("embedded");
    return url.toString();
  }, [importUrl]);

  useEffect(() => {
    let disposed = false;

    async function loadBaseUrl() {
      const storedBaseUrl = await GM_getValue(STORAGE_KEY, DEFAULT_MATCHED_APP_URL);
      if (disposed) {
        return;
      }

      const normalized = normalizeBaseUrl(storedBaseUrl);
      setBaseUrl(normalized);
      setDraftBaseUrl(normalized);
    }

    void loadBaseUrl();

    return () => {
      disposed = true;
    };
  }, []);

  useEffect(() => {
    const unregister = GM_registerMenuCommand("Set CP Tracker URL", () => {
      setIsOpen(true);
    });

    return () => {
      if (typeof unregister === "function") {
        unregister();
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setIsFrameLoaded(false);
    }
  }, [isOpen, importUrl]);

  const saveBaseUrl = async () => {
    setIsSaving(true);
    try {
      const normalized = normalizeBaseUrl(draftBaseUrl);
      await GM_setValue(STORAGE_KEY, normalized);
      setBaseUrl(normalized);
    } finally {
      setIsSaving(false);
    }
  };

  const openStandaloneImportPage = () => {
    if (!standaloneImportUrl) {
      return;
    }

    GM_openInTab(standaloneImportUrl, { active: true, insert: true, setParent: true });
  };

  return (
    <>
      <button className="cp-import-trigger" type="button" onClick={() => setIsOpen(true)}>
        Import Problem
      </button>

      {isOpen && (
        <div className="cp-import-overlay" role="dialog" aria-modal="true" aria-label="Import problem to CP Tracker">
          <div className="cp-import-backdrop" onClick={() => setIsOpen(false)} />
          <div className="cp-import-panel">
            <div className="cp-import-panel-header">
              <div>
                <p className="cp-import-eyebrow">CP Tracker</p>
                <h1 className="cp-import-title">Import Problem</h1>
                <p className="cp-import-description">
                  当前页面链接会自动带入，其他信息请在导入表单中手动填写。
                </p>
              </div>
              <div className="cp-import-header-actions">
                {baseUrl && (
                  <button
                    className="cp-import-secondary"
                    type="button"
                    onClick={() => {
                      setDraftBaseUrl("");
                      setBaseUrl("");
                    }}
                  >
                    Change URL
                  </button>
                )}
                {standaloneImportUrl && (
                  <button className="cp-import-secondary" type="button" onClick={openStandaloneImportPage}>
                    Open in tab
                  </button>
                )}
                <button className="cp-import-close" type="button" onClick={() => setIsOpen(false)} aria-label="Close import panel">
                  ×
                </button>
              </div>
            </div>

            {!baseUrl ? (
              <div className="cp-import-settings">
                <div className="cp-import-field">
                  <label className="cp-import-label" htmlFor="cp-import-base-url">
                    CP Tracker URL
                  </label>
                  <input
                    id="cp-import-base-url"
                    className="cp-import-input"
                    type="url"
                    placeholder="https://your-cptracker.example.com"
                    value={draftBaseUrl}
                    onChange={(event) => setDraftBaseUrl(event.target.value)}
                  />
                  <p className="cp-import-help">
                    先配置你的 cptracker 地址。保存后会在当前 OJ 页面内嵌打开对应的 /import 页面。
                  </p>
                </div>
                <div className="cp-import-settings-actions">
                  <button className="cp-import-secondary" type="button" onClick={() => setIsOpen(false)}>
                    Cancel
                  </button>
                  <button className="cp-import-primary" type="button" onClick={() => void saveBaseUrl()} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save URL"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="cp-import-frame-shell">
                {!isFrameLoaded && (
                  <div className="cp-import-frame-loading">
                    <div className="cp-import-spinner" />
                    <p>Loading import form...</p>
                    <p className="cp-import-help">
                      如果长时间空白，请尝试用右上角的 Open in tab 打开。
                    </p>
                  </div>
                )}
                <iframe
                  key={importUrl}
                  className="cp-import-frame"
                  src={importUrl}
                  title="CP Tracker Import"
                  onLoad={() => setIsFrameLoaded(true)}
                />
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}
