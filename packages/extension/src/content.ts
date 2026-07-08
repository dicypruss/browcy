// Browcy Content Script
import { actionHandlers } from './dom.js';
// Inject a script into the MAIN world to intercept console logs
(() => {
  const script = document.createElement('script');
  script.textContent = `
    window.__browcyLogs = [];
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.log = function(...args) {
      window.__browcyLogs.push({ type: 'log', message: args.map(a => { try { return typeof a === 'object' ? JSON.stringify(a) : String(a); } catch(e) { return String(a); } }).join(' ') });
      originalLog.apply(console, args);
    };
    console.error = function(...args) {
      window.__browcyLogs.push({ type: 'error', message: args.map(a => { try { return typeof a === 'object' ? JSON.stringify(a) : String(a); } catch(e) { return String(a); } }).join(' ') });
      originalError.apply(console, args);
    };
    console.warn = function(...args) {
      window.__browcyLogs.push({ type: 'warn', message: args.map(a => { try { return typeof a === 'object' ? JSON.stringify(a) : String(a); } catch(e) { return String(a); } }).join(' ') });
      originalWarn.apply(console, args);
    };
    window.addEventListener('error', (e) => {
      window.__browcyLogs.push({ type: 'uncaught_error', message: e.message });
    });
    
    window.addEventListener('message', (e) => {
      if (e.data && e.data.type === 'BROWCY_GET_LOGS') {
        window.postMessage({ type: 'BROWCY_LOGS_RESULT', logs: window.__browcyLogs }, '*');
        window.__browcyLogs = []; // clear after reading
      }
    });
  `;
  (document.head || document.documentElement).appendChild(script);
  script.remove();
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
