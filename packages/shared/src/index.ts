export type BrowserRequest =
  | { action: "list_tabs"; payload?: never }
  | { action: "create_tab"; payload: { url: string; active?: boolean } }
  | { action: "switch_tab"; payload: { tabId: number } }
  | { action: "close_tab"; payload: { tabId: number } }
  | { action: "navigate"; payload: { url: string; tabId?: number } }
  | { action: "snapshot"; payload: { tabId?: number } }
  | { action: "extract_text"; payload: { tabId?: number } }
  | { action: "click"; payload: { selector: string; tabId?: number } }
  | { action: "type"; payload: { selector: string; text: string; tabId?: number } }
  | { action: "press_key"; payload: { key: string; tabId?: number } }
  | { action: "screenshot"; payload: { tabId?: number } }
  | { action: "go_back"; payload: { tabId?: number } }
  | { action: "go_forward"; payload: { tabId?: number } }
  | { action: "evaluate_js"; payload: { expression: string; tabId?: number } }
  | { action: "scroll"; payload: { direction?: "up" | "down" | "left" | "right"; amount?: number; selector?: string; tabId?: number } }
  | { action: "wait_for"; payload: { selector?: string; text?: string; timeoutMs?: number; tabId?: number } }
  | { action: "get_console_logs"; payload: { tabId?: number } }
  | { action: "layout_info"; payload: { tabId?: number } }
  | { action: "ping"; payload?: never };

export type BrowserResponse<T = any> = 
  | { success: true; result: T }
  | { success: false; error: string };

export type SystemRequest =
  | { action: "system_connect_port"; payload: { port: number } };

// Utility type for WebSocket Message envelope
export type WSMessageRequest = (BrowserRequest | SystemRequest) & { id?: number };
export type WSMessageResponse = { id: number } & ({ result: any } | { error: string });
