import { z } from "zod";

export const NavigateSchema = z.object({
  url: z.string().url("Must be a valid URL").describe("The full URL to navigate to (e.g. 'https://example.com')."),
  tabId: z.number().optional().describe("Optional ID of the tab to navigate. If omitted, uses active tab."),
});

export const ClickSchema = z.object({
  selector: z.string().describe("A standard CSS Selector (e.g. 'button.submit', '#login-btn') or an ARIA role/name to find and click the element on the live page."),
  tabId: z.number().optional().describe("Optional ID of the tab. If omitted, uses active tab."),
});

export const TypeSchema = z.object({
  selector: z.string().describe("CSS Selector or ARIA role/name of the input field to focus and type into."),
  text: z.string().describe("The exact text string you want to type into the selected input field."),
  tabId: z.number().optional().describe("Optional ID of the tab. If omitted, uses active tab."),
});

export const PressKeySchema = z.object({
  key: z.string().describe("The name of the key to press. Valid examples: 'Enter', 'Escape', 'Tab', 'ArrowDown', 'Backspace', 'a', 'B'."),
  tabId: z.number().optional().describe("Optional ID of the tab. If omitted, uses active tab."),
});

export const SnapshotSchema = z.object({
  tabId: z.number().optional().describe("Optional ID of the tab. If omitted, uses active tab."),
});

export const ReadPageSchema = z.object({
  tabId: z.number().optional().describe("Optional ID of the tab. If omitted, uses active tab."),
});

export const CreateTabSchema = z.object({
  url: z.string().url("Must be a valid URL").describe("The URL to open in the new tab."),
  active: z.boolean().optional().describe("Whether the new tab should become active immediately. Default: true")
});

export const SwitchTabSchema = z.object({
  tabId: z.number().describe("The numeric ID of the tab you want to switch to and make active.")
});

export const CloseTabSchema = z.object({
  tabId: z.number().describe("The numeric ID of the tab you want to close.")
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
  }).optional().describe("Specify the region of the page to capture. Use this with browser_layout_info to capture chunks of very long pages. Include 10-20% overlap.")
});

export const GoBackSchema = z.object({
  tabId: z.number().optional().describe("Optional ID of the tab. If omitted, uses active tab."),
});

export const GoForwardSchema = z.object({
  tabId: z.number().optional().describe("Optional ID of the tab. If omitted, uses active tab."),
});

export const EvaluateJsSchema = z.object({
  expression: z.string().describe("JavaScript expression to evaluate. WARNING: Do not use for clicking or typing if native tools exist."),
  tabId: z.number().optional().describe("Optional ID of the tab. If omitted, uses active tab."),
});

export const ScrollSchema = z.object({
  direction: z.enum(["up", "down", "left", "right"]).optional().describe("Direction to scroll. E.g. 'down' to scroll down the page."),
  amount: z.number().optional().describe("Amount of pixels to scroll. Default is 500."),
  selector: z.string().optional().describe("Optional: CSS Selector or ARIA role/name to specifically scroll into view instead of scrolling by pixels."),
  tabId: z.number().optional().describe("Optional ID of the tab. If omitted, uses active tab."),
});

export const WaitForSchema = z.object({
  selector: z.string().optional().describe("CSS Selector or ARIA role/name to wait for to appear in the DOM."),
  text: z.string().optional().describe("Text content to wait for on the page."),
  timeoutMs: z.number().optional().describe("Timeout in milliseconds. Default: 10000 (10 seconds)."),
  tabId: z.number().optional().describe("Optional ID of the tab. If omitted, uses active tab."),
});

export const GetConsoleLogsSchema = z.object({
  tabId: z.number().optional().describe("Optional ID of the tab. If omitted, uses active tab."),
});

export const GetLayoutInfoSchema = z.object({
  tabId: z.number().optional().describe("Optional ID of the tab. If omitted, uses active tab."),
});
