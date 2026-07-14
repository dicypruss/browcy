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
import { handleToolCall } from "./actions/index.js";
import type { BrowserRequest, WSMessageResponse, WSMessageRequest } from "@browcy/shared";

import { AgentMultiplexer } from "./multiplexer.js";

// --- Multi-Agent Architecture Setup ---
const WS_PORT_START = 8765;
const multiplexer = new AgentMultiplexer({ basePort: WS_PORT_START, maxPorts: 10 });

let requestCounter = 0;
const pendingRequests = new Map<
  number,
  { resolve: (value: any) => void; reject: (reason?: any) => void }
>();

const wss = new WebSocketServer({ noServer: true });

multiplexer.getServer().on('upgrade', (request, socket, head) => {
  const origin = request.headers.origin;
  if (!verifyWebSocketOrigin(origin)) {
    console.error(`Blocked WS connection from unauthorized origin: ${origin || 'undefined'}`);
    socket.destroy();
    return;
  }
  wss.handleUpgrade(request, socket as any, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

wss.on("connection", (ws) => {
  const isMaster = multiplexer.isMaster();
  console.error(`Browser extension connected to ${isMaster ? 'Master' : 'Secondary'} node on port ${multiplexer.getPort()}!`);
  multiplexer.setActiveClient(ws);

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
    multiplexer.setActiveClient(null);
  });
});

async function sendToBrowser(request: BrowserRequest): Promise<any> {
  const currentPort = multiplexer.getPort();
  if (wss.clients.size === 0) {
    throw new Error(`No active browser connection on port ${currentPort}. Please open the Browcy extension.`);
  }
  
  // Get the first (and only) active client
  const activeClient = Array.from(wss.clients)[0];
  if (activeClient.readyState !== WebSocket.OPEN) {
    throw new Error(`Browser connection on port ${currentPort} is not open.`);
  }

  const id = ++requestCounter;
  return new Promise((resolve, reject) => {
    pendingRequests.set(id, { resolve, reject });
    const wsReq: WSMessageRequest = { ...request, id };
    activeClient.send(JSON.stringify(wsReq));
    
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
        description: "List all open browser tabs in the user's live browser (returns their IDs, titles, URLs).",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "browser_create_tab",
        description: "Open a new browser tab in the user's live browser.",
        inputSchema: zodToJsonSchema(CreateTabSchema as any),
      },
      {
        name: "browser_switch_tab",
        description: "Switch to a specific tab in the user's live browser (make it active/visible).",
        inputSchema: zodToJsonSchema(SwitchTabSchema as any),
      },
      {
        name: "browser_close_tab",
        description: "Close a specific tab in the user's live browser.",
        inputSchema: zodToJsonSchema(CloseTabSchema as any),
      },
      {
        name: "browser_navigate",
        description: "Navigate a tab to a specific URL. (RECOMMENDED)",
        inputSchema: zodToJsonSchema(NavigateSchema as any),
      },
      {
        name: "browser_snapshot",
        description: "Capture the Accessibility Tree (ARIA Snapshot) of a tab. Use this to understand the page structure and find elements to interact with.",
        inputSchema: zodToJsonSchema(SnapshotSchema as any),
      },
      {
        name: "browser_read_page",
        description: "Extract all visible text content from the page.",
        inputSchema: zodToJsonSchema(ReadPageSchema as any),
      },
      {
        name: "browser_click",
        description: "Click an element on the page in the user's live browser. (RECOMMENDED) Works natively and accurately without evaluating JS. Always prefer this over evaluate_js.",
        inputSchema: zodToJsonSchema(ClickSchema as any),
      },
      {
        name: "browser_type",
        description: "Type text into an element in the user's live browser. (RECOMMENDED) Safely types text natively without JS. Always prefer this over evaluate_js.",
        inputSchema: zodToJsonSchema(TypeSchema as any),
      },
      {
        name: "browser_press_key",
        description: "Simulate a physical key press (e.g. 'Enter', 'Escape') in the user's live browser. (RECOMMENDED)",
        inputSchema: zodToJsonSchema(PressKeySchema as any),
      },
      {
        name: "browser_screenshot",
        description: "Capture a visual screenshot of the active tab (returns base64 encoded image). The user will see exactly what you capture.",
        inputSchema: zodToJsonSchema(ScreenshotSchema as any),
      },
      {
        name: "browser_go_back",
        description: "Navigate back in the tab's history.",
        inputSchema: zodToJsonSchema(GoBackSchema as any),
      },
      {
        name: "browser_go_forward",
        description: "Navigate forward in the tab's history.",
        inputSchema: zodToJsonSchema(GoForwardSchema as any),
      },
      {
        name: "browser_evaluate_js",
        description: "Evaluate arbitrary JavaScript in the page. (USE AS LAST RESORT) Do NOT use this for clicking, typing, or scrolling. Use the native browser_click, browser_type, or browser_scroll tools instead, as they are much more reliable.",
        inputSchema: zodToJsonSchema(EvaluateJsSchema as any),
      },
      {
        name: "browser_scroll",
        description: "Scroll the page in a given direction or scroll a specific element into view. (RECOMMENDED)",
        inputSchema: zodToJsonSchema(ScrollSchema as any),
      },
      {
        name: "browser_wait_for",
        description: "Wait for a specific element (selector) or text to appear on the page.",
        inputSchema: zodToJsonSchema(WaitForSchema as any),
      },
      {
        name: "browser_get_console_logs",
        description: "Retrieve intercepted console logs and errors from the page.",
        inputSchema: zodToJsonSchema(GetConsoleLogsSchema as any),
      },
      {
        name: "browser_layout_info",
        description: "Get layout metrics including full scrollable content size and viewport size. Useful for determining how to capture chunks of very long pages. When calculating chunks, always include a 10-20% vertical overlap to prevent losing content at the seams.",
        inputSchema: zodToJsonSchema(GetLayoutInfoSchema as any),
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
  
  try {
    const result = await multiplexer.start();
    console.error(`Browcy MCP node started. WebSocket listening on 127.0.0.1:${result.port} (${result.isMaster ? 'Master' : 'Secondary'})`);
  } catch (err: any) {
    console.error(err.message);
    process.exit(1);
  }

  // Graceful shutdown to release port
  const shutdown = () => {
    console.error("Shutting down MCP server...");
    multiplexer.getServer().close();
    wss.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  process.stdin.on('close', shutdown);
  process.stdin.on('end', shutdown);
}

main().catch(console.error);
