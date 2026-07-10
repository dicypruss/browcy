import type { ActionHandler } from "./index.js";

export const evaluate_js: ActionHandler = async (payload, id, sendResponse, tabId) => {
  let targetTabId = tabId;
  if (!targetTabId) targetTabId = (await chrome.tabs.query({ active: true, currentWindow: true }))[0]?.id;
  if (targetTabId) {
    chrome.debugger.attach({ tabId: targetTabId }, "1.3", () => {
      if (chrome.runtime.lastError) {
        sendResponse({ id, error: chrome.runtime.lastError.message });
        return;
      }
      chrome.debugger.sendCommand({ tabId: targetTabId }, "Runtime.evaluate", {
        expression: payload.expression,
        returnByValue: true,
        awaitPromise: true
      }, (result: any) => {
        chrome.debugger.detach({ tabId: targetTabId });
        if (chrome.runtime.lastError) {
          sendResponse({ id, error: chrome.runtime.lastError.message });
        } else if (result?.exceptionDetails) {
          sendResponse({ id, error: result.exceptionDetails.exception?.description || "JavaScript Error" });
        } else {
          sendResponse({ id, result: result?.result?.value });
        }
      });
    });
  } else {
    sendResponse({ id, error: "No active tab" });
  }
};
