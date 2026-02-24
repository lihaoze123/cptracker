import { defineBackground } from 'wxt/utils/define-background';

export default defineBackground(() => {
  // 处理来自 content script 的消息
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'OPEN_TAB') {
      browser.tabs.create({ url: message.url });
    }
    if (message.type === 'CLOSE_CURRENT_TAB') {
      const senderTabId = sender.tab?.id;
      if (senderTabId) {
        browser.tabs.remove(senderTabId);
      } else {
        browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
          if (tabs[0]?.id) {
            browser.tabs.remove(tabs[0].id);
          }
        });
      }
    }
    return true;
  });
});
