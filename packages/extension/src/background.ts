import type { WSMessageRequest, WSMessageResponse } from "@browcy/shared";
let ws: WebSocket | null = null;
const WS_URL = "ws://localhost:8765";
let pingInterval: any = null;

function updateStatus(status: 'connected' | 'disconnected' | 'connecting') {
  chrome.storage.local.set({ connectionStatus: status });
  
  if (status === 'connected') {
    chrome.action.setIcon({
      path: {
        "16": "icons/icon_16_connected.png",
        "48": "icons/icon_48_connected.png",
        "128": "icons/icon_128_connected.png"
      }
    });
  } else {
    chrome.action.setIcon({
      path: {
        "16": "icons/icon_16.png",
        "48": "icons/icon_48.png",
        "128": "icons/icon_128.png"
      }
    });
  }
}

import { actionHandlers } from "./actions/index.js";

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
      
      const tabId = (payload as any)?.tabId;

      const sendResponse = (data: any) => {
        ws?.send(JSON.stringify(data));
      };

      const handler = actionHandlers[action];
      if (handler) {
        await handler(payload, id, sendResponse, tabId);
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

// Global listener for debugger detaching unexpectedly
chrome.debugger.onDetach.addListener((source, reason) => {
  console.warn(`Debugger detached from tab ${source.tabId} because: ${reason}`);
});

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
