import {
  NavigateSchema, ClickSchema, TypeSchema, PressKeySchema, SnapshotSchema, ReadPageSchema, CreateTabSchema, SwitchTabSchema, CloseTabSchema, ScreenshotSchema, GoBackSchema, GoForwardSchema, EvaluateJsSchema, ScrollSchema, WaitForSchema, GetConsoleLogsSchema, GetLayoutInfoSchema
} from "./schemas.js";
import type { BrowserRequest } from '@browcy/shared';
import * as fs from 'fs';

export async function handleToolCall(
  name: string, 
  args: any, 
  sendToBrowser: (req: BrowserRequest) => Promise<any>
): Promise<{ content: Array<{ type: string, text?: string, data?: string, mimeType?: string }>, isError?: boolean }> {
  try {
    if (name === "browser_list_tabs") {
      const result = await sendToBrowser({ action: "list_tabs" });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }

    if (name === "browser_create_tab") {
      const payload = CreateTabSchema.parse(args);
      const result = await sendToBrowser({ action: "create_tab", payload } as BrowserRequest);
      return { content: [{ type: "text", text: `Tab created: ${JSON.stringify(result)}` }] };
    }

    if (name === "browser_switch_tab") {
      const payload = SwitchTabSchema.parse(args);
      await sendToBrowser({ action: "switch_tab", payload } as BrowserRequest);
      return { content: [{ type: "text", text: `Switched to tab ${payload.tabId}` }] };
    }

    if (name === "browser_close_tab") {
      const payload = CloseTabSchema.parse(args);
      await sendToBrowser({ action: "close_tab", payload } as BrowserRequest);
      return { content: [{ type: "text", text: `Closed tab ${payload.tabId}` }] };
    }

    if (name === "browser_navigate") {
      const payload = NavigateSchema.parse(args);
      await sendToBrowser({ action: "navigate", payload } as BrowserRequest);
      return { content: [{ type: "text", text: `Navigated to ${payload.url}` }] };
    }

    if (name === "browser_snapshot") {
      const payload = args ? SnapshotSchema.parse(args) : {};
      const snapshot = await sendToBrowser({ action: "snapshot", payload } as BrowserRequest);
      return { content: [{ type: "text", text: snapshot }] };
    }

    if (name === "browser_read_page") {
      const payload = args ? ReadPageSchema.parse(args) : {};
      const text = await sendToBrowser({ action: "extract_text", payload } as BrowserRequest);
      return { content: [{ type: "text", text: text }] };
    }

    if (name === "browser_click") {
      const payload = ClickSchema.parse(args);
      await sendToBrowser({ action: "click", payload } as BrowserRequest);
      return { content: [{ type: "text", text: `Clicked ${payload.selector}` }] };
    }

    if (name === "browser_type") {
      const payload = TypeSchema.parse(args);
      await sendToBrowser({ action: "type", payload } as BrowserRequest);
      return { content: [{ type: "text", text: `Typed into ${payload.selector}` }] };
    }

    if (name === "browser_press_key") {
      const payload = PressKeySchema.parse(args);
      await sendToBrowser({ action: "press_key", payload } as BrowserRequest);
      return { content: [{ type: "text", text: `Pressed key ${payload.key}` }] };
    }

    if (name === "browser_screenshot") {
      const payload = args ? ScreenshotSchema.parse(args) : {};
      const dataUrl = await sendToBrowser({ action: "screenshot", payload } as BrowserRequest);
      const [prefix, b64] = dataUrl.split(',');
      const mime = prefix.split(':')[1].split(';')[0];
      
      if (payload.savePath) {
        fs.writeFileSync(payload.savePath, b64, 'base64');
        return { content: [{ type: "text", text: `Screenshot saved successfully to ${payload.savePath}` }] };
      }
      
      return { content: [{ type: "image", data: b64, mimeType: mime }] };
    }

    if (name === "browser_go_back") {
      const payload = args ? GoBackSchema.parse(args) : {};
      await sendToBrowser({ action: "go_back", payload } as BrowserRequest);
      return { content: [{ type: "text", text: "Navigated back" }] };
    }

    if (name === "browser_go_forward") {
      const payload = args ? GoForwardSchema.parse(args) : {};
      await sendToBrowser({ action: "go_forward", payload } as BrowserRequest);
      return { content: [{ type: "text", text: "Navigated forward" }] };
    }

    if (name === "browser_evaluate_js") {
      const payload = EvaluateJsSchema.parse(args);
      const result = await sendToBrowser({ action: "evaluate_js", payload } as BrowserRequest);
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }

    if (name === "browser_scroll") {
      const payload = ScrollSchema.parse(args);
      await sendToBrowser({ action: "scroll", payload } as BrowserRequest);
      return { content: [{ type: "text", text: "Scroll successful" }] };
    }

    if (name === "browser_wait_for") {
      const payload = WaitForSchema.parse(args);
      const result = await sendToBrowser({ action: "wait_for", payload } as BrowserRequest);
      return { content: [{ type: "text", text: result ? `Wait successful: ${result}` : "Wait successful" }] };
    }

    if (name === "browser_get_console_logs") {
      const payload = args ? GetConsoleLogsSchema.parse(args) : {};
      const result = await sendToBrowser({ action: "get_console_logs", payload } as BrowserRequest);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }

    if (name === "browser_layout_info") {
      const payload = args ? GetLayoutInfoSchema.parse(args) : {};
      const result = await sendToBrowser({ action: "layout_info", payload } as BrowserRequest);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error: any) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
}
