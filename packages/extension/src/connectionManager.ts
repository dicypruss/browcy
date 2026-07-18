export class ConnectionManager {
  public activeSockets = new Map<number, WebSocket>();

  ensureConnections(startPort: number, endPort: number, connectFn: (port: number) => void) {
    for (let port = startPort; port <= endPort; port++) {
      const ws = this.activeSockets.get(port);
      if (!ws || (ws.readyState !== WebSocket.CONNECTING && ws.readyState !== WebSocket.OPEN)) {
        if (ws) this.activeSockets.delete(port);
        connectFn(port);
      }
    }
  }
}
