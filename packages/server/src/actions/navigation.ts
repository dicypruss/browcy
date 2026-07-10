import { NavigateSchema, GoBackSchema, GoForwardSchema } from "../schemas.js";
import type { BrowserRequest } from "@browcy/shared";

export const browser_navigate = async (args: any, sendToBrowser: (req: BrowserRequest) => Promise<any>) => {
  const payload = NavigateSchema.parse(args);
  await sendToBrowser({ action: "navigate", payload } as BrowserRequest);
  return { content: [{ type: "text", text: `Navigated to ${payload.url}` }] };
};

export const browser_go_back = async (args: any, sendToBrowser: (req: BrowserRequest) => Promise<any>) => {
  const payload = args ? GoBackSchema.parse(args) : {};
  await sendToBrowser({ action: "go_back", payload } as BrowserRequest);
  return { content: [{ type: "text", text: "Navigated back" }] };
};

export const browser_go_forward = async (args: any, sendToBrowser: (req: BrowserRequest) => Promise<any>) => {
  const payload = args ? GoForwardSchema.parse(args) : {};
  await sendToBrowser({ action: "go_forward", payload } as BrowserRequest);
  return { content: [{ type: "text", text: "Navigated forward" }] };
};
