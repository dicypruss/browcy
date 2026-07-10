import { z } from "zod";

export const NavigateSchema = z.object({
  url: z.string().url("Must be a valid URL"),
  tabId: z.number().optional().describe("Optional ID of the tab to navigate. If omitted, uses active tab."),
});

export const ClickSchema = z.object({
  selector: z.string().describe("CSS Selector or ARIA role/name to click"),
  tabId: z.number().optional().describe("Optional ID of the tab. If omitted, uses active tab."),
});

export const TypeSchema = z.object({
  selector: z.string().describe("CSS Selector or ARIA role/name to focus and type into"),
  text: z.string(),
  tabId: z.number().optional().describe("Optional ID of the tab. If omitted, uses active tab."),
});

export const PressKeySchema = z.object({
  key: z.string().describe("The key to press, e.g., 'Enter', 'Escape', 'Tab'"),
  tabId: z.number().optional().describe("Optional ID of the tab. If omitted, uses active tab."),
});

export const SnapshotSchema = z.object({
  tabId: z.number().optional().describe("Optional ID of the tab. If omitted, uses active tab."),
});

export const ReadPageSchema = z.object({
  tabId: z.number().optional().describe("Optional ID of the tab. If omitted, uses active tab."),
});

export const CreateTabSchema = z.object({
  url: z.string().url("Must be a valid URL"),
  active: z.boolean().optional().describe("Whether the new tab should become active immediately. Default: true")
});

export const SwitchTabSchema = z.object({
  tabId: z.number().describe("ID of the tab to switch to")
});

export const CloseTabSchema = z.object({
  tabId: z.number().describe("ID of the tab to close")
});

export const ScreenshotSchema = z.object({
  tabId: z.number().optional().describe("Optional ID of the tab. If omitted, uses active tab."),
  fullPage: z.boolean().optional().describe("If true, captures the entire scrollable height of the page using Chrome DevTools Protocol. Defaults to false (viewport only)."),
  savePath: z.string().optional().describe("Optional absolute path to save the screenshot file. If provided, the screenshot will be saved to disk instead of being returned as base64 in the chat."),
  clip: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
    scale: z.number().optional()
  }).optional().describe("Specify the region of the page to capture. Use this with browser_layout_info to capture chunks of very long pages. It is highly recommended to include a 10-20% overlap (нахлест) between chunks so that text or elements at the edges are not lost.")
});

export const GoBackSchema = z.object({
  tabId: z.number().optional().describe("Optional ID of the tab. If omitted, uses active tab."),
});

export const GoForwardSchema = z.object({
  tabId: z.number().optional().describe("Optional ID of the tab. If omitted, uses active tab."),
});

export const EvaluateJsSchema = z.object({
  expression: z.string().describe("JavaScript expression to evaluate in the main page context"),
  tabId: z.number().optional().describe("Optional ID of the tab. If omitted, uses active tab."),
});

export const ScrollSchema = z.object({
  direction: z.enum(["up", "down", "left", "right"]).optional().describe("Direction to scroll"),
  amount: z.number().optional().describe("Amount of pixels to scroll. Default is 500"),
  selector: z.string().optional().describe("CSS Selector or ARIA role/name to scroll into view"),
  tabId: z.number().optional().describe("Optional ID of the tab. If omitted, uses active tab."),
});

export const WaitForSchema = z.object({
  selector: z.string().optional().describe("CSS Selector or ARIA role/name to wait for"),
  text: z.string().optional().describe("Text content to wait for"),
  timeoutMs: z.number().optional().describe("Timeout in milliseconds (default: 10000)"),
  tabId: z.number().optional().describe("Optional ID of the tab. If omitted, uses active tab."),
});

export const GetConsoleLogsSchema = z.object({
  tabId: z.number().optional().describe("Optional ID of the tab. If omitted, uses active tab."),
});

export const GetLayoutInfoSchema = z.object({
  tabId: z.number().optional().describe("Optional ID of the tab. If omitted, uses active tab."),
});
