import { CreateTabSchema, SwitchTabSchema, CloseTabSchema } from "../schemas.js";
import type { BrowserRequest } from "@browcy/shared";

export const browser_list_tabs = async (args: any, sendToBrowser: (req: BrowserRequest) => Promise<any>) => {
  const result = await sendToBrowser({ action: "list_tabs" });
  return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
};

export const browser_create_tab = async (args: any, sendToBrowser: (req: BrowserRequest) => Promise<any>) => {
  const payload = CreateTabSchema.parse(args);
  const result = await sendToBrowser({ action: "create_tab", payload } as BrowserRequest);
  return { content: [{ type: "text", text: `Tab created: ${JSON.stringify(result)}` }] };
};

export const browser_switch_tab = async (args: any, sendToBrowser: (req: BrowserRequest) => Promise<any>) => {
  const payload = SwitchTabSchema.parse(args);
  await sendToBrowser({ action: "switch_tab", payload } as BrowserRequest);
  return { content: [{ type: "text", text: `Switched to tab ${payload.tabId}` }] };
};

export const browser_close_tab = async (args: any, sendToBrowser: (req: BrowserRequest) => Promise<any>) => {
  const payload = CloseTabSchema.parse(args);
  await sendToBrowser({ action: "close_tab", payload } as BrowserRequest);
  return { content: [{ type: "text", text: `Closed tab ${payload.tabId}` }] };
};
