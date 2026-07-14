import type { WSMessageRequest, WSMessageResponse } from "@browcy/shared";
import { actionHandlers } from "./actions/index.js";

const WS_PORT_START = 8765;
const WS_PORT_END = 8775;
const activeSockets = new Map<number, WebSocket>();
let pingInterval: any = null;

function updateStatus() {
  const activePorts = Array.from(activeSockets.entries())
    .filter(([_, ws]) => ws.readyState === WebSocket.OPEN)
    .map(([port]) => port);
  chrome.storage.local.set({ activePorts });
  
  if (activePorts.length > 0) {
    chrome.action.setIcon({
      path: {
        "16": "/icons/icon_16_connected.png",
        "48": "/icons/icon_48_connected.png",
        "128": "/icons/icon_128_connected.png"
      }
    });
  } else {
    chrome.action.setIcon({
      path: {
        "16": "/icons/icon_16.png",
        "48": "/icons/icon_48.png",
        "128": "/icons/icon_128.png"
      }
    });
  }
}

async function forwardToContentScript(action: string, payload: any, id: number, sendResponse: (data: any) => void, tabId?: number) {
  let targetTabId = tabId;
  if (!targetTabId) {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    targetTabId = tabs[0]?.id;
  }
  
  if (targetTabId) {
    chrome.tabs.sendMessage(targetTabId, { action, payload }, (response) => {
      if (chrome.runtime.lastError) {
         sendResponse({ id, error: chrome.runtime.lastError.message });
         return;
      }
      if (!response?.success) {
         sendResponse({ id, error: response?.error || "Unknown error from content script" });
      } else {
         sendResponse({ id, result: response.result });
      }
    });
  } else {
    sendResponse({ id, error: "No active tab found" });
  }
}

function connectToPort(port: number) {
  if (activeSockets.has(port)) return;
  
  const ws = new WebSocket(`ws://localhost:${port}`);
  activeSockets.set(port, ws);
  
  ws.onopen = () => {
    console.log(`Connected to Browcy MCP Server on port ${port}`);
    updateStatus();
  };

  ws.onmessage = async (event) => {
    try {
      const request = JSON.parse(event.data) as WSMessageRequest;
      const { action, payload } = request;
      const id = request.id ?? -1;
      if (id === -1 && action !== 'system_connect_port') return; // ignore simple acks
      console.log(`[Port ${port}] Received command: ${action}`, payload);
      
      if ((action as string) === 'system_connect_port') {
        connectToPort((payload as any).port);
        return;
      }

      const tabId = (payload as any)?.tabId;

      const sendResponse = (data: any) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(data));
        }
      };

      const handler = actionHandlers[action];
      if (handler) {
        await handler(payload, id, sendResponse, tabId);
      } else {
        await forwardToContentScript(action, payload, id, sendResponse, tabId);
      }
    } catch (e: any) {
      console.error(`Error processing message on port ${port}`, e);
    }
  };

  ws.onclose = () => {
    if (activeSockets.get(port) === ws) {
      activeSockets.delete(port);
      updateStatus();
    }
  };
  
  ws.onerror = (e) => {
    // onclose will be triggered immediately after
  };
}

function ensurePrimaryConnection() {
  const ws = activeSockets.get(WS_PORT_START);
  if (!ws || (ws.readyState !== WebSocket.CONNECTING && ws.readyState !== WebSocket.OPEN)) {
    if (ws) activeSockets.delete(WS_PORT_START);
    connectToPort(WS_PORT_START);
  }
}

// Global listener for debugger detaching unexpectedly
chrome.debugger.onDetach.addListener((source, reason) => {
  console.warn(`Debugger detached from tab ${source.tabId} because: ${reason}`);
});

// Listen for manual reconnect requests from Popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "reconnect") {
    for (const ws of activeSockets.values()) {
      ws.close();
    }
    activeSockets.clear();
    updateStatus();
    ensurePrimaryConnection();
    sendResponse({ result: "reconnecting" });
  }
});

// Start connection loop (only checking the primary port)
setInterval(ensurePrimaryConnection, 3000);
ensurePrimaryConnection();

// Ping all active connections to keep them alive
if (pingInterval) clearInterval(pingInterval);
pingInterval = setInterval(() => {
  for (const ws of activeSockets.values()) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ action: "ping" }));
    }
  }
}, 20000);
