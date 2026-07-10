import { SnapshotSchema, ReadPageSchema, GetLayoutInfoSchema } from "../schemas.js";
import type { BrowserRequest } from "@browcy/shared";

export const browser_snapshot = async (args: any, sendToBrowser: (req: BrowserRequest) => Promise<any>) => {
  const payload = args ? SnapshotSchema.parse(args) : {};
  const snapshot = await sendToBrowser({ action: "snapshot", payload } as BrowserRequest);
  return { content: [{ type: "text", text: snapshot }] };
};

export const browser_read_page = async (args: any, sendToBrowser: (req: BrowserRequest) => Promise<any>) => {
  const payload = args ? ReadPageSchema.parse(args) : {};
  const text = await sendToBrowser({ action: "extract_text", payload } as BrowserRequest);
  return { content: [{ type: "text", text: text }] };
};

export const browser_layout_info = async (args: any, sendToBrowser: (req: BrowserRequest) => Promise<any>) => {
  const payload = args ? GetLayoutInfoSchema.parse(args) : {};
  const result = await sendToBrowser({ action: "layout_info", payload } as BrowserRequest);
  return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
};
