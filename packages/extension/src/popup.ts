function updateUI(status: string) {
  const textEl = document.getElementById('status-text');
  const dotEl = document.getElementById('status-dot');
  if (!textEl || !dotEl) return;

  textEl.textContent = status.charAt(0).toUpperCase() + status.slice(1);
  dotEl.className = `dot ${status}`;
}

chrome.storage.local.get(['connectionStatus'], (result) => {
  updateUI((result.connectionStatus as string) || 'disconnected');
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.connectionStatus) {
    updateUI(changes.connectionStatus.newValue as string);
  }
});

document.getElementById('reconnect-btn')?.addEventListener('click', () => {
  updateUI('connecting');
  chrome.runtime.sendMessage({ action: "reconnect" });
});
