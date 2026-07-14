function updateUI(activePorts: number[] = []) {
  const textEl = document.getElementById('status-text');
  const dotEl = document.getElementById('status-dot');
  const portsListEl = document.getElementById('ports-list');
  if (!textEl || !dotEl || !portsListEl) return;

  if (activePorts.length > 0) {
    textEl.textContent = `Active Agents: ${activePorts.length}`;
    dotEl.className = `dot connected`;
    portsListEl.innerHTML = activePorts.map(p => `<div>🔌 Port ${p}</div>`).join('');
  } else {
    textEl.textContent = `No Agents Connected`;
    dotEl.className = `dot disconnected`;
    portsListEl.innerHTML = '';
  }
}

chrome.storage.local.get(['activePorts'], (result) => {
  updateUI((result.activePorts as number[]) || []);
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.activePorts) {
    updateUI(changes.activePorts.newValue as number[]);
  }
});

document.getElementById('reconnect-btn')?.addEventListener('click', () => {
  const dotEl = document.getElementById('status-dot');
  if (dotEl) dotEl.className = `dot connecting`;
  chrome.runtime.sendMessage({ action: "reconnect" });
});
