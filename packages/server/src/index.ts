#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { WebSocketServer, WebSocket } from "ws";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { NavigateSchema, ClickSchema, TypeSchema, PressKeySchema, SnapshotSchema, ReadPageSchema, CreateTabSchema, SwitchTabSchema, CloseTabSchema, ScreenshotSchema, GoBackSchema, GoForwardSchema, EvaluateJsSchema, ScrollSchema, WaitForSchema, GetConsoleLogsSchema, GetLayoutInfoSchema } from "./schemas.js";

import http from "http";
import { verifyWebSocketOrigin, verifyIpcHeader } from "./security.js";
import { handleToolCall } from "./handlers.js";
import type { BrowserRequest, WSMessageResponse, WSMessageRequest } from "@browcy/shared";

// --- Primary/Secondary Architecture Setup ---
const WS_PORT = 8765;
let isPrimary = false;

let activeClient: WebSocket | null = null;
let requestCounter = 0;
const pendingRequests = new Map<
  number,
  { resolve: (value: any) => void; reject: (reason?: any) => void }
>();

// HTTP Server acts as both WebSocket server (for extension) 
// and IPC API (for secondary MCP instances)
const httpServer = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/action') {
    if (!verifyIpcHeader(req.headers['x-browcy-ipc'])) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: "Forbidden: Missing X-Browcy-IPC header (CSRF Protection)" }));
      return;
    }
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', async () => {
      try {
        const request = JSON.parse(body) as BrowserRequest;
        const result = await sendToBrowser(request);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, result }));
      } catch (err: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

const wss = new WebSocketServer({ noServer: true });

httpServer.on('upgrade', (request, socket, head) => {
  const origin = request.headers.origin;
  if (!verifyWebSocketOrigin(origin)) {
    console.error(`Blocked WS connection from unauthorized origin: ${origin || 'undefined'}`);
    socket.destroy();
    return;
  }
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

wss.on("connection", (ws) => {
  console.error("Browser extension connected to Primary node!");
  activeClient = ws;

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message.toString());
      if (data.id !== undefined && pendingRequests.has(data.id)) {
        const { resolve, reject } = pendingRequests.get(data.id)!;
        pendingRequests.delete(data.id);
        if (data.error) {
          reject(new Error(data.error));
        } else {
          resolve(data.result);
        }
      }
    } catch (err) {
      console.error("Error parsing WS message:", err);
    }
  });

  ws.on("close", () => {
    console.error("Browser extension disconnected.");
    if (activeClient === ws) {
      activeClient = null;
    }
  });
});

async function sendToBrowser(request: BrowserRequest): Promise<any> {
  if (!isPrimary) {
    // Secondary instance: Forward request to Primary instance
    try {
      const response = await fetch(`http://localhost:${WS_PORT}/action`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Browcy-IPC': 'true'
        },
        body: JSON.stringify(request)
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      return data.result;
    } catch (err: any) {
      throw new Error(`IPC to Primary node failed: ${err.message}`);
    }
  }

  // Primary instance: Send directly to extension
  if (!activeClient || activeClient.readyState !== WebSocket.OPEN) {
    throw new Error("No active browser connection. Please open the Browcy extension.");
  }
  const id = ++requestCounter;
  return new Promise((resolve, reject) => {
    pendingRequests.set(id, { resolve, reject });
    const wsReq: WSMessageRequest = { ...request, id };
    activeClient!.send(JSON.stringify(wsReq));
    
    setTimeout(() => {
      if (pendingRequests.has(id)) {
        pendingRequests.delete(id);
        reject(new Error("Browser request timed out after 30s."));
      }
    }, 30000);
  });
}

// --- MCP Server Setup ---
const server = new Server(
  {
    name: "browcy-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "browser_list_tabs",
        description: "List all open browser tabs (returns their IDs, titles, URLs)",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "browser_create_tab",
        description: "Open a new browser tab",
        inputSchema: zodToJsonSchema(CreateTabSchema),
      },
      {
        name: "browser_switch_tab",
        description: "Switch to a specific tab (make it active)",
        inputSchema: zodToJsonSchema(SwitchTabSchema),
      },
      {
        name: "browser_close_tab",
        description: "Close a specific tab",
        inputSchema: zodToJsonSchema(CloseTabSchema),
      },
      {
        name: "browser_navigate",
        description: "Navigate a tab to a specific URL",
        inputSchema: zodToJsonSchema(NavigateSchema),
      },
      {
        name: "browser_snapshot",
        description: "Capture the Accessibility Tree (ARIA Snapshot) of a tab",
        inputSchema: zodToJsonSchema(SnapshotSchema),
      },
      {
        name: "browser_read_page",
        description: "Extract all visible text content from the page",
        inputSchema: zodToJsonSchema(ReadPageSchema),
      },
      {
        name: "browser_click",
        description: "Click an element on the page",
        inputSchema: zodToJsonSchema(ClickSchema),
      },
      {
        name: "browser_type",
        description: "Type text into an element on the page",
        inputSchema: zodToJsonSchema(TypeSchema),
      },
      {
        name: "browser_press_key",
        description: "Simulate a physical key press in the browser",
        inputSchema: zodToJsonSchema(PressKeySchema),
      },
      {
        name: "browser_screenshot",
        description: "Capture a visual screenshot of the active tab (returns base64 encoded image)",
        inputSchema: zodToJsonSchema(ScreenshotSchema),
      },
      {
        name: "browser_go_back",
        description: "Navigate back in the tab's history",
        inputSchema: zodToJsonSchema(GoBackSchema),
      },
      {
        name: "browser_go_forward",
        description: "Navigate forward in the tab's history",
        inputSchema: zodToJsonSchema(GoForwardSchema),
      },
      {
        name: "browser_evaluate_js",
        description: "Evaluate arbitrary JavaScript expression in the main page context",
        inputSchema: zodToJsonSchema(EvaluateJsSchema),
      },
      {
        name: "browser_scroll",
        description: "Scroll the page in a given direction or scroll a specific element into view",
        inputSchema: zodToJsonSchema(ScrollSchema),
      },
      {
        name: "browser_wait_for",
        description: "Wait for a specific element (selector) or text to appear on the page",
        inputSchema: zodToJsonSchema(WaitForSchema),
      },
      {
        name: "browser_get_console_logs",
        description: "Retrieve intercepted console logs and errors from the page",
        inputSchema: zodToJsonSchema(GetConsoleLogsSchema),
      },
      {
        name: "browser_layout_info",
        description: "Get layout metrics including full scrollable content size and viewport size. Useful for determining how to capture chunks of very long pages. When calculating chunks, always include a 10-20% vertical overlap to prevent losing content at the seams.",
        inputSchema: zodToJsonSchema(GetLayoutInfoSchema),
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  return handleToolCall(name, args, sendToBrowser);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Browcy MCP Server running on stdio");
  
  // Try to become Primary
  httpServer.listen(WS_PORT, '127.0.0.1', () => {
    isPrimary = true;
    console.error(`Primary node started. WebSocket and IPC bridge listening on 127.0.0.1:${WS_PORT}`);
  });

  httpServer.on('error', (e: any) => {
    if (e.code === 'EADDRINUSE') {
      isPrimary = false;
      console.error(`Port ${WS_PORT} in use. Running as Secondary Proxy node.`);
    } else {
      console.error("HTTP Server Error", e);
    }
  });

  // Graceful shutdown to release port 8765
  const shutdown = () => {
    console.error("Shutting down MCP server...");
    httpServer.close();
    wss.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch(console.error);
