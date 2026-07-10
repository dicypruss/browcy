import { ScreenshotSchema } from "../schemas.js";
import type { BrowserRequest } from "@browcy/shared";
import * as fs from "fs";

export const browser_screenshot = async (args: any, sendToBrowser: (req: BrowserRequest) => Promise<any>) => {
  const payload = args ? ScreenshotSchema.parse(args) : {};
  const dataUrl = await sendToBrowser({ action: "screenshot", payload } as BrowserRequest);
  const [prefix, b64] = dataUrl.split(',');
  const mime = prefix.split(':')[1].split(';')[0];
  
  if (payload.savePath) {
    fs.writeFileSync(payload.savePath, b64, 'base64');
    return { content: [{ type: "text", text: `Screenshot saved successfully to ${payload.savePath}` }] };
  }
  
  return { content: [{ type: "image", data: b64, mimeType: mime }] };
};
