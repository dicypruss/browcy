import { EvaluateJsSchema, GetConsoleLogsSchema } from "../schemas.js";
import type { BrowserRequest } from "@browcy/shared";

export const browser_evaluate_js = async (args: any, sendToBrowser: (req: BrowserRequest) => Promise<any>) => {
  const payload = EvaluateJsSchema.parse(args);
  const result = await sendToBrowser({ action: "evaluate_js", payload } as BrowserRequest);
  return { content: [{ type: "text", text: JSON.stringify(result) }] };
};

export const browser_get_console_logs = async (args: any, sendToBrowser: (req: BrowserRequest) => Promise<any>) => {
  const payload = args ? GetConsoleLogsSchema.parse(args) : {};
  const result = await sendToBrowser({ action: "get_console_logs", payload } as BrowserRequest);
  return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
};
