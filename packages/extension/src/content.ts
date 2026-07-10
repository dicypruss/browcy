// Browcy Content Script
import { actionHandlers } from './dom.js';
// Inject a script into the MAIN world to intercept console logs
(() => {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('dist/inject.js');
  script.onload = function() {
    script.remove();
  };
  (document.head || document.documentElement).appendChild(script);
})();


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Content script received:", request);
  const { action, payload } = request;

  const handler = actionHandlers[action];
  if (handler) {
    Promise.resolve(handler(payload))
      .then(result => sendResponse({ success: true, result }))
      .catch(e => sendResponse({ success: false, error: e.message || String(e) }));
    return true; // Indicates async response
  }

  // If action wasn't handled
  return false;
});
