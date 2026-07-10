export {};

declare global {
  interface Window {
    __browcyLogs: any[];
  }
}

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
