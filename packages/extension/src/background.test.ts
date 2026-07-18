import { describe, it, expect, vi } from 'vitest';
import { ConnectionManager } from './connectionManager.js';

describe('ConnectionManager', () => {
  it('should attempt to connect to all ports in the provided range', () => {
    const manager = new ConnectionManager();
    const connectFn = vi.fn();
    
    manager.ensureConnections(8765, 8775, connectFn);
    
    expect(connectFn).toHaveBeenCalledTimes(11);
    
    const portsCalled = connectFn.mock.calls.map(c => c[0]);
    expect(portsCalled).toContain(8765);
    expect(portsCalled).toContain(8766);
    expect(portsCalled).toContain(8775);
  });

  it('should not reconnect if socket is already CONNECTING or OPEN', () => {
    const manager = new ConnectionManager();
    const connectFn = vi.fn();

    // Mock an open socket for port 8766
    manager.activeSockets.set(8766, { readyState: 1 /* OPEN */ } as WebSocket);
    // Mock a connecting socket for port 8767
    manager.activeSockets.set(8767, { readyState: 0 /* CONNECTING */ } as WebSocket);

    manager.ensureConnections(8765, 8767, connectFn);
    
    // Only 8765 should be called, 8766 and 8767 are already handled
    expect(connectFn).toHaveBeenCalledTimes(1);
    expect(connectFn).toHaveBeenCalledWith(8765);
  });
});
