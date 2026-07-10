import type { ActionHandler } from "./index.js";

export const screenshot: ActionHandler = async (payload, id, sendResponse, tabId) => {
  let targetTabId = tabId;
  if (!targetTabId) targetTabId = (await chrome.tabs.query({ active: true, currentWindow: true }))[0]?.id;
  
  if (!targetTabId) {
    sendResponse({ id, error: "No active tab found" });
    return;
  }

  if (payload.fullPage || payload.clip) {
    const debuggee = { tabId: targetTabId };
    chrome.debugger.attach(debuggee, "1.3", () => {
      if (chrome.runtime.lastError) {
        sendResponse({ id, error: chrome.runtime.lastError.message });
        return;
      }

      chrome.debugger.sendCommand(debuggee, "Page.getLayoutMetrics", {}, (metrics: any) => {
        if (chrome.runtime.lastError) {
          chrome.debugger.detach(debuggee);
          sendResponse({ id, error: chrome.runtime.lastError.message });
          return;
        }

        const contentSize = metrics.cssContentSize || metrics.contentSize;
        if (!contentSize) {
          chrome.debugger.detach(debuggee);
          sendResponse({ id, error: "Failed to get layout metrics" });
          return;
        }

        let virtualHeight = contentSize.height;
        let captureClip = {
          x: 0,
          y: 0,
          width: contentSize.width,
          height: Math.min(contentSize.height, 16384),
          scale: 1
        };

        if (payload.clip) {
          captureClip = { ...payload.clip, scale: payload.clip.scale || 1 };
        } else {
          virtualHeight = Math.min(contentSize.height, 16384);
        }

        chrome.debugger.sendCommand(debuggee, "Emulation.setDeviceMetricsOverride", {
          mobile: false,
          width: contentSize.width,
          height: virtualHeight,
          deviceScaleFactor: 0
        }, () => {
          setTimeout(() => {
            chrome.debugger.sendCommand(debuggee, "Page.captureScreenshot", {
              format: "jpeg",
              quality: 80,
              captureBeyondViewport: true,
              clip: captureClip
            }, (result: any) => {
              const captureError = chrome.runtime.lastError ? chrome.runtime.lastError.message : null;
              chrome.debugger.sendCommand(debuggee, "Emulation.clearDeviceMetricsOverride", {}, () => {
                chrome.debugger.detach(debuggee);
                if (captureError) {
                  sendResponse({ id, error: captureError });
                } else if (chrome.runtime.lastError) {
                  sendResponse({ id, error: chrome.runtime.lastError.message });
                } else if (!result || !result.data) {
                  sendResponse({ id, error: "Screenshot failed: no data returned" });
                } else {
                  const dataUrl = `data:image/jpeg;base64,${result.data}`;
                  sendResponse({ id, result: dataUrl });
                }
              });
            });
          }, 300);
        });
      });
    });
  } else {
    const windowId = (await chrome.tabs.get(targetTabId)).windowId;
    chrome.tabs.captureVisibleTab(windowId, { format: "jpeg", quality: 80 }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        sendResponse({ id, error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ id, result: dataUrl });
      }
    });
  }
};
