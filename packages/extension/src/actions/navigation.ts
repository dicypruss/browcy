import type { ActionHandler } from "./index.js";

export const navigate: ActionHandler = async (payload, id, sendResponse, tabId) => {
  let targetTabId = tabId;
  if (!targetTabId) {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    targetTabId = tabs[0]?.id;
  }
  if (targetTabId) {
    await chrome.tabs.update(targetTabId, { url: payload.url });
    setTimeout(() => { sendResponse({ id, result: "success" }); }, 2000);
  } else {
    sendResponse({ id, error: "No active tab" });
  }
};

export const go_back: ActionHandler = async (payload, id, sendResponse, tabId) => {
  let targetTabId = tabId;
  if (!targetTabId) targetTabId = (await chrome.tabs.query({ active: true, currentWindow: true }))[0]?.id;
  if (targetTabId) {
    await chrome.tabs.goBack(targetTabId);
    setTimeout(() => { sendResponse({ id, result: "success" }); }, 1000);
  } else {
    sendResponse({ id, error: "No active tab" });
  }
};

export const go_forward: ActionHandler = async (payload, id, sendResponse, tabId) => {
  let targetTabId = tabId;
  if (!targetTabId) targetTabId = (await chrome.tabs.query({ active: true, currentWindow: true }))[0]?.id;
  if (targetTabId) {
    await chrome.tabs.goForward(targetTabId);
    setTimeout(() => { sendResponse({ id, result: "success" }); }, 1000);
  } else {
    sendResponse({ id, error: "No active tab" });
  }
};
