import type { ActionHandler } from "./index.js";

export const layout_info: ActionHandler = async (payload, id, sendResponse, tabId) => {
  let targetTabId = tabId;
  if (!targetTabId) targetTabId = (await chrome.tabs.query({ active: true, currentWindow: true }))[0]?.id;
  if (targetTabId) {
    chrome.debugger.attach({ tabId: targetTabId }, "1.3", () => {
      if (chrome.runtime.lastError) {
        sendResponse({ id, error: chrome.runtime.lastError.message });
        return;
      }
      chrome.debugger.sendCommand({ tabId: targetTabId }, "Page.getLayoutMetrics", {}, (metrics: any) => {
        chrome.debugger.detach({ tabId: targetTabId });
        if (chrome.runtime.lastError) {
          sendResponse({ id, error: chrome.runtime.lastError.message });
        } else {
          sendResponse({ id, result: metrics });
        }
      });
    });
  }
};
