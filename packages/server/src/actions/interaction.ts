import { ClickSchema, TypeSchema, PressKeySchema, ScrollSchema, WaitForSchema } from "../schemas.js";
import type { BrowserRequest } from "@browcy/shared";

export const browser_click = async (args: any, sendToBrowser: (req: BrowserRequest) => Promise<any>) => {
  const payload = ClickSchema.parse(args);
  await sendToBrowser({ action: "click", payload } as BrowserRequest);
  return { content: [{ type: "text", text: `Clicked ${payload.selector}` }] };
};

export const browser_type = async (args: any, sendToBrowser: (req: BrowserRequest) => Promise<any>) => {
  const payload = TypeSchema.parse(args);
  await sendToBrowser({ action: "type", payload } as BrowserRequest);
  return { content: [{ type: "text", text: `Typed into ${payload.selector}` }] };
};

export const browser_press_key = async (args: any, sendToBrowser: (req: BrowserRequest) => Promise<any>) => {
  const payload = PressKeySchema.parse(args);
  await sendToBrowser({ action: "press_key", payload } as BrowserRequest);
  return { content: [{ type: "text", text: `Pressed key ${payload.key}` }] };
};

export const browser_scroll = async (args: any, sendToBrowser: (req: BrowserRequest) => Promise<any>) => {
  const payload = ScrollSchema.parse(args);
  await sendToBrowser({ action: "scroll", payload } as BrowserRequest);
  return { content: [{ type: "text", text: "Scroll successful" }] };
};

export const browser_wait_for = async (args: any, sendToBrowser: (req: BrowserRequest) => Promise<any>) => {
  const payload = WaitForSchema.parse(args);
  const result = await sendToBrowser({ action: "wait_for", payload } as BrowserRequest);
  return { content: [{ type: "text", text: result ? `Wait successful: ${result}` : "Wait successful" }] };
};
