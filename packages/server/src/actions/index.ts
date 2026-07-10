import type { BrowserRequest } from "@browcy/shared";

import * as tabs from "./tabs.js";
import * as navigation from "./navigation.js";
import * as dom from "./dom.js";
import * as interaction from "./interaction.js";
import * as screenshot from "./screenshot.js";
import * as javascript from "./javascript.js";

export type ActionHandler = (args: any, sendToBrowser: (req: BrowserRequest) => Promise<any>) => Promise<{ content: Array<{ type: string, text?: string, data?: string, mimeType?: string }>, isError?: boolean }>;

export const handlers: Record<string, ActionHandler> = {
  ...tabs,
  ...navigation,
  ...dom,
  ...interaction,
  ...screenshot,
  ...javascript,
};

export async function handleToolCall(
  name: string,
  args: any,
  sendToBrowser: (req: BrowserRequest) => Promise<any>
): ReturnType<ActionHandler> {
  try {
    const handler = handlers[name];
    if (!handler) {
      throw new Error(`Unknown tool: ${name}`);
    }
    return await handler(args, sendToBrowser);
  } catch (error: any) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
}
