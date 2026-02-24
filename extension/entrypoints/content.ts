import { defineContentScript } from 'wxt/utils/define-content-script';
import { storage } from 'wxt/utils/storage';
import { fetchRating } from '../utils/clist';
import { OJ_PAGE_MATCHES } from '../utils/platform-manifest';
import { detectPlatform, extractProblemInfo } from '../utils/platforms';
import type { ProblemInfo, ImportPayload } from '../utils/types';

export default defineContentScript({
  matches: [
    ...OJ_PAGE_MATCHES,
    '*://competitive-programming-tracker.netlify.app/import*'
  ],
  runAt: 'document_idle',
  main() {
    const INTER_PAGE_DELAY_MS = 1500;
    const RETURN_TO_PROBLEM_DELAY_MS = 3000;
    const READY_CHECK_INTERVAL_MS = 800;

    let extractedInfo: ProblemInfo | null = null;

    function isSubmissionPage(url: string): boolean {
      return url.includes('/submission/') || url.includes('/submissions/');
    }

    function normalizeUrl(url: string): string {
      try {
        const parsed = new URL(url, window.location.origin);
        parsed.search = '';
        parsed.hash = '';
        return parsed.toString().replace(/\/$/, '');
      } catch {
        return url.split(/[?#]/)[0].replace(/\/$/, '');
      }
    }

    function isSameProblemPage(currentUrl: string, problemUrl: string): boolean {
      return normalizeUrl(currentUrl) === normalizeUrl(problemUrl);
    }

    // 页面加载时，仅在有 pendingData 时才在提交页自动提取并跳转
    if (isSubmissionPage(window.location.href)) {
      storage.getItem<ImportPayload>('local:pendingProblemData').then((pendingData) => {
        if (pendingData) extractAndStore();
      });
    }

    async function extractAndStore() {
      const url = window.location.href;
      const platform = detectPlatform(url);
      console.log('[CPTracker] extractAndStore:', { url, platform });

      if (platform === 'unknown') {
        console.log('[CPTracker] Unknown platform');
        return;
      }

      // 检查是否是从题目页面跳转过来的提交页面
      const pendingData = await storage.getItem<ImportPayload>('local:pendingProblemData');
      const currentInfo: ProblemInfo | null = await extractProblemInfo(url);

      console.log('[CPTracker] Extracted info:', JSON.stringify(currentInfo, null, 2));

      if (!currentInfo) return;

      // 如果是从题目页面跳转过来的（有 pendingData），合并数据
      if (pendingData) {
        extractedInfo = {
          ...currentInfo,
          url: pendingData.url,
          // 始终使用题目页面的 name，因为提交页面的 name 是空的
          name: pendingData.name || currentInfo.name || '',
          rating: pendingData.rating || currentInfo.rating || '',
          // 始终使用题目页面的 tags，因为提交页面的 tags 是空的
          tags: pendingData.tags ? pendingData.tags.split(',').filter(Boolean) : (currentInfo.tags || []),
          solvedTime: currentInfo.solvedTime || pendingData.solvedTime,
        };
      } else {
        // 直接使用当前页面的数据
        extractedInfo = { ...currentInfo };
      }

      console.log('[CPTracker] Merged info:', extractedInfo);

      const onSubmissionPage = isSubmissionPage(window.location.href);
      let nextSubmissionUrl = '';
      if (extractedInfo.submissionUrl) {
        try {
          nextSubmissionUrl = new URL(extractedInfo.submissionUrl, window.location.origin).toString();
        } catch {
          nextSubmissionUrl = '';
        }
      }

      // 如果当前页只能拿到详情链接，先进入具体 submission 页面继续提取代码
      if (
        onSubmissionPage &&
        pendingData &&
        extractedInfo &&
        !extractedInfo.code &&
        nextSubmissionUrl &&
        !isSameProblemPage(window.location.href, nextSubmissionUrl)
      ) {
        await storage.setItem('local:extractedProblem', extractedInfo);
        console.log('[CPTracker] Following submission detail page after delay:', nextSubmissionUrl);
        setTimeout(() => {
          window.location.replace(nextSubmissionUrl);
        }, INTER_PAGE_DELAY_MS);
        return;
      }

      // 如果是提交页面且成功提取到了代码，跳转回题目页面
      if (onSubmissionPage && extractedInfo && extractedInfo.code) {
        // 从 URL 中提取题目页面 URL
        const urlMatch = extractedInfo.url;
        if (urlMatch) {
          await storage.setItem('local:extractedProblem', extractedInfo);
          if (pendingData) {
            await storage.removeItem('local:pendingProblemData');
          }
          console.log('[CPTracker] Saved to storage, waiting for page to load...');

          // 等待页面加载完成后再延迟跳转
          const waitAndJump = () => {
            if (document.readyState === 'complete') {
              console.log('[CPTracker] Page loaded, jumping back to problem page');
              setTimeout(() => {
                window.location.replace(urlMatch);
              }, RETURN_TO_PROBLEM_DELAY_MS);
            } else {
              setTimeout(waitAndJump, READY_CHECK_INTERVAL_MS);
            }
          };
          waitAndJump();
          return;
        }
      }

      // 如果有 pendingData 但没有 code（第一次提取），也保存到 storage
      if (pendingData && extractedInfo) {
        await storage.setItem('local:extractedProblem', extractedInfo);
        console.log('[CPTracker] Saved to storage (first extraction)');
      }

      if (extractedInfo && extractedInfo.name && !pendingData) {
        // 只有非跳转情况才获取 rating
        const rating = await fetchRating(extractedInfo.name, platform, extractedInfo.url);
        console.log('[CPTracker] Rating fetched:', rating);
        if (rating) {
          extractedInfo.rating = rating;
        }
      }

      if (extractedInfo) {
        await storage.setItem('local:extractedProblem', extractedInfo);
        console.log('[CPTracker] Saved to storage');

        // 如果是从题目页面跳转过来的，保存后跳转回去
        if (pendingData) {
          const hasNextSubmissionStep = Boolean(
            onSubmissionPage &&
            !extractedInfo.code &&
            nextSubmissionUrl &&
            !isSameProblemPage(window.location.href, nextSubmissionUrl)
          );
          if (hasNextSubmissionStep) return;

          await storage.removeItem('local:pendingProblemData');
          // 使用延迟跳转，避免页面快速切换导致状态丢失
          setTimeout(() => {
            window.location.replace(pendingData.url);
          }, INTER_PAGE_DELAY_MS);
          return;
        }
      }
    }

    // 注意：这里不做自动导入，必须由用户在 popup 内点击 Save 进行确认

    // 处理来自 popup 的消息 - 只有点击图标时才会触发
    browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.type !== 'GET_PROBLEM_INFO') return true;

      console.log('[CPTracker] Received GET_PROBLEM_INFO message');

      storage.getItem<ProblemInfo>('local:extractedProblem').then(async (savedInfo) => {
        console.log('[CPTracker] Checked storage, savedInfo:', savedInfo ? 'found' : 'not found');

        // 检查保存的数据是否有 code（完整数据）
        const hasCode = savedInfo?.code;
        const isSamePage = savedInfo && isSameProblemPage(window.location.href, savedInfo.url);

        if (hasCode && isSamePage) {
          console.log('[CPTracker] Using saved problem info:', savedInfo);
          await storage.removeItem('local:extractedProblem');
          sendResponse({ success: true, data: savedInfo });
          return;
        }

        if (hasCode) {
          console.log('[CPTracker] Saved code belongs to another page, clearing stale data');
          await storage.removeItem('local:extractedProblem');
        }

        // 没有完整数据，重新提取
        console.log('[CPTracker] No saved data with code, extracting from current page');
        await extractAndStore();

        const extracted = await storage.getItem<ProblemInfo>('local:extractedProblem');
        console.log('[CPTracker] Extracted data:', extracted);
        sendResponse({ success: true, data: extracted });
      }).catch((err: unknown) => {
        console.error('[CPTracker] GET_PROBLEM_INFO failed:', err);
        sendResponse({
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      });

      return true;
    });

    // 处理来自 CPTracker 页面的消息 (从 storage 读取数据)
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'REQUEST_IMPORT_DATA') {
        storage.getItem<ImportPayload>('local:pendingImportData').then((data) => {
          if (data) {
            window.postMessage({
              type: 'CPTRACKER_IMPORT_DATA',
              payload: data
            }, '*');
          }
        });
      }
    });
  }
});
