import type { ActionHandler } from "./index.js";

export const list_tabs: ActionHandler = async (payload, id, sendResponse) => {
  const tabs = await chrome.tabs.query({});
  const result = tabs.map(t => ({ id: t.id, windowId: t.windowId, active: t.active, title: t.title, url: t.url }));
  sendResponse({ id, result });
};

export const create_tab: ActionHandler = async (payload, id, sendResponse) => {
  const tab = await chrome.tabs.create({ url: payload.url, active: payload.active ?? true });
  sendResponse({ id, result: { id: tab.id, url: tab.url, title: tab.title } });
};

export const switch_tab: ActionHandler = async (payload, id, sendResponse, tabId) => {
  if (!tabId) {
    sendResponse({ id, error: "tabId is required for switch_tab" });
    return;
  }
  await chrome.tabs.update(tabId, { active: true });
  const tab = await chrome.tabs.get(tabId);
  if (tab.windowId) await chrome.windows.update(tab.windowId, { focused: true });
  sendResponse({ id, result: "success" });
};

export const close_tab: ActionHandler = async (payload, id, sendResponse, tabId) => {
  if (!tabId) {
    sendResponse({ id, error: "tabId is required for close_tab" });
    return;
  }
  await chrome.tabs.remove(tabId);
  sendResponse({ id, result: "success" });
};
