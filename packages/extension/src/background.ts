import type { WSMessageRequest, WSMessageResponse } from "@browcy/shared";
let ws: WebSocket | null = null;
const WS_URL = "ws://localhost:8765";
let pingInterval: any = null;

function updateStatus(status: 'connected' | 'disconnected' | 'connecting') {
  chrome.storage.local.set({ connectionStatus: status });
}

type ActionHandler = (payload: any, id: number, tabId?: number) => Promise<void>;

const actionHandlers: Record<string, ActionHandler> = {
  // 1. Tab Management Actions
  list_tabs: async (payload, id) => {
    const tabs = await chrome.tabs.query({});
    const result = tabs.map(t => ({ id: t.id, windowId: t.windowId, active: t.active, title: t.title, url: t.url }));
    ws?.send(JSON.stringify({ id, result }));
  },
  create_tab: async (payload, id) => {
    const tab = await chrome.tabs.create({ url: payload.url, active: payload.active ?? true });
    ws?.send(JSON.stringify({ id, result: { id: tab.id, url: tab.url, title: tab.title } }));
  },
  switch_tab: async (payload, id, tabId) => {
    if (!tabId) {
      ws?.send(JSON.stringify({ id, error: "tabId is required for switch_tab" }));
      return;
    }
    await chrome.tabs.update(tabId, { active: true });
    const tab = await chrome.tabs.get(tabId);
    if (tab.windowId) await chrome.windows.update(tab.windowId, { focused: true });
    ws?.send(JSON.stringify({ id, result: "success" }));
  },
  close_tab: async (payload, id, tabId) => {
    if (!tabId) {
      ws?.send(JSON.stringify({ id, error: "tabId is required for close_tab" }));
      return;
    }
    await chrome.tabs.remove(tabId);
    ws?.send(JSON.stringify({ id, result: "success" }));
  },
  // 2. Navigation and Browser Actions
  navigate: async (payload, id, tabId) => {
    let targetTabId = tabId;
    if (!targetTabId) {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      targetTabId = tabs[0]?.id;
    }
    if (targetTabId) {
      await chrome.tabs.update(targetTabId, { url: payload.url });
      setTimeout(() => { ws?.send(JSON.stringify({ id, result: "success" })); }, 2000);
    } else {
      ws?.send(JSON.stringify({ id, error: "No active tab" }));
    }
  },
  go_back: async (payload, id, tabId) => {
    let targetTabId = tabId;
    if (!targetTabId) targetTabId = (await chrome.tabs.query({ active: true, currentWindow: true }))[0]?.id;
    if (targetTabId) {
      await chrome.tabs.goBack(targetTabId);
      setTimeout(() => { ws?.send(JSON.stringify({ id, result: "success" })); }, 1000);
    } else {
      ws?.send(JSON.stringify({ id, error: "No active tab" }));
    }
  },
  go_forward: async (payload, id, tabId) => {
    let targetTabId = tabId;
    if (!targetTabId) targetTabId = (await chrome.tabs.query({ active: true, currentWindow: true }))[0]?.id;
    if (targetTabId) {
      await chrome.tabs.goForward(targetTabId);
      setTimeout(() => { ws?.send(JSON.stringify({ id, result: "success" })); }, 1000);
    } else {
      ws?.send(JSON.stringify({ id, error: "No active tab" }));
    }
  },
  layout_info: async (payload, id, tabId) => {
    let targetTabId = tabId;
    if (!targetTabId) targetTabId = (await chrome.tabs.query({ active: true, currentWindow: true }))[0]?.id;
    if (targetTabId) {
      chrome.debugger.attach({ tabId: targetTabId }, "1.3", () => {
        if (chrome.runtime.lastError) {
          ws?.send(JSON.stringify({ id, error: chrome.runtime.lastError.message }));
          return;
        }
        chrome.debugger.sendCommand({ tabId: targetTabId }, "Page.getLayoutMetrics", {}, (metrics: any) => {
          chrome.debugger.detach({ tabId: targetTabId });
          if (chrome.runtime.lastError) {
            ws?.send(JSON.stringify({ id, error: chrome.runtime.lastError.message }));
          } else {
            ws?.send(JSON.stringify({ id, result: metrics }));
          }
        });
      });
    }
  },
  screenshot: async (payload, id, tabId) => {
    let targetTabId = tabId;
    if (!targetTabId) targetTabId = (await chrome.tabs.query({ active: true, currentWindow: true }))[0]?.id;
    
    if (!targetTabId) {
      ws?.send(JSON.stringify({ id, error: "No active tab found" }));
      return;
    }

    if (payload.fullPage || payload.clip) {
      const debuggee = { tabId: targetTabId };
      chrome.debugger.attach(debuggee, "1.3", () => {
        if (chrome.runtime.lastError) {
          ws?.send(JSON.stringify({ id, error: chrome.runtime.lastError.message }));
          return;
        }

        chrome.debugger.sendCommand(debuggee, "Page.getLayoutMetrics", {}, (metrics: any) => {
          if (chrome.runtime.lastError) {
            chrome.debugger.detach(debuggee);
            ws?.send(JSON.stringify({ id, error: chrome.runtime.lastError.message }));
            return;
          }

          const contentSize = metrics.cssContentSize || metrics.contentSize;
          if (!contentSize) {
            chrome.debugger.detach(debuggee);
            ws?.send(JSON.stringify({ id, error: "Failed to get layout metrics" }));
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
            // If clip is provided, use exact clip region. 
            // We still override virtualHeight to contentSize.height to prevent sticky headers from showing in the middle of the clip.
            captureClip = { ...payload.clip, scale: payload.clip.scale || 1 };
          } else {
            // If just fullPage, we cap the virtual height to 16384 to match the clip height
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
                    ws?.send(JSON.stringify({ id, error: captureError }));
                  } else if (chrome.runtime.lastError) {
                    ws?.send(JSON.stringify({ id, error: chrome.runtime.lastError.message }));
                  } else if (!result || !result.data) {
                    ws?.send(JSON.stringify({ id, error: "Screenshot failed: no data returned" }));
                  } else {
                    const dataUrl = `data:image/jpeg;base64,${result.data}`;
                    ws?.send(JSON.stringify({ id, result: dataUrl }));
                  }
                });
              });
            }, 300); // Wait for relayout
          });
        });
      });
    } else {
      const windowId = (await chrome.tabs.get(targetTabId)).windowId;
      chrome.tabs.captureVisibleTab(windowId, { format: "jpeg", quality: 80 }, (dataUrl) => {
        if (chrome.runtime.lastError) {
          ws?.send(JSON.stringify({ id, error: chrome.runtime.lastError.message }));
        } else {
          ws?.send(JSON.stringify({ id, result: dataUrl }));
        }
      });
    }
  },
  evaluate_js: async (payload, id, tabId) => {
    let targetTabId = tabId;
    if (!targetTabId) targetTabId = (await chrome.tabs.query({ active: true, currentWindow: true }))[0]?.id;
    if (targetTabId) {
      chrome.scripting.executeScript({
        target: { tabId: targetTabId },
        func: (expr) => {
          try {
            return eval(expr);
          } catch (e: any) {
            return "Error: " + e.toString();
          }
        },
        args: [payload.expression],
        world: "MAIN"
      }, (results) => {
        if (chrome.runtime.lastError) {
          ws?.send(JSON.stringify({ id, error: chrome.runtime.lastError.message }));
        } else {
          ws?.send(JSON.stringify({ id, result: results?.[0]?.result }));
        }
      });
    } else {
      ws?.send(JSON.stringify({ id, error: "No active tab" }));
    }
  }
};

async function forwardToContentScript(action: string, payload: any, id: number, tabId?: number) {
  let targetTabId = tabId;
  if (!targetTabId) {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    targetTabId = tabs[0]?.id;
  }
  
  if (targetTabId) {
    chrome.tabs.sendMessage(targetTabId, { action, payload }, (response) => {
      if (chrome.runtime.lastError) {
         ws?.send(JSON.stringify({ id, error: chrome.runtime.lastError.message }));
         return;
      }
      if (!response?.success) {
         ws?.send(JSON.stringify({ id, error: response?.error || "Unknown error from content script" }));
      } else {
         ws?.send(JSON.stringify({ id, result: response.result }));
      }
    });
  } else {
    ws?.send(JSON.stringify({ id, error: "No active tab found" }));
  }
}

function connect() {
  if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) {
    return;
  }
  
  updateStatus('connecting');
  console.log("Connecting to Browcy MCP Server...");
  ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    console.log("Connected to Browcy MCP Server");
    updateStatus('connected');
    
    if (pingInterval) clearInterval(pingInterval);
    pingInterval = setInterval(() => {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ action: "ping" }));
      }
    }, 20000);
  };

  ws.onmessage = async (event) => {
    try {
      const request = JSON.parse(event.data) as WSMessageRequest;
      const { id, action, payload } = request;
      if (!id) return; // ignore simple acks
      console.log(`Received command from server: ${action}`, payload);
      
      const tabId = payload?.tabId;

      const handler = actionHandlers[action];
      if (handler) {
        await handler(payload, id, tabId);
      } else {
        await forwardToContentScript(action, payload, id, tabId);
      }
    } catch (e: any) {
      console.error("Error processing message", e);
    }
  };

  ws.onclose = () => {
    console.log("Disconnected. Reconnecting in 3s...");
    updateStatus('disconnected');
    if (pingInterval) clearInterval(pingInterval);
    setTimeout(connect, 3000);
  };
  
  ws.onerror = (e) => {
    console.error("WebSocket error:", e);
    ws?.close();
  };
}

// Listen for manual reconnect requests from Popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "reconnect") {
    if (ws) {
      ws.close(); // will trigger reconnect logic automatically
    } else {
      connect();
    }
    sendResponse({ result: "reconnecting" });
  }
});

// Start connection loop
connect();
