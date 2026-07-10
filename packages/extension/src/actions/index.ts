import * as tabs from "./tabs.js";
import * as navigation from "./navigation.js";
import * as dom from "./dom.js";
import * as screenshot from "./screenshot.js";
import * as javascript from "./javascript.js";

export type ActionHandler = (payload: any, id: number, sendResponse: (data: any) => void, tabId?: number) => Promise<void>;

export const actionHandlers: Record<string, ActionHandler> = {
  ...tabs,
  ...navigation,
  ...dom,
  ...screenshot,
  ...javascript
};
