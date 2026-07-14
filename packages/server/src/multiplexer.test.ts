import { describe, it, expect, vi, afterEach } from 'vitest';
import { AgentMultiplexer } from './multiplexer.js';
import http from 'node:http';

describe('AgentMultiplexer', () => {
  let multiplexer: AgentMultiplexer | null = null;

  afterEach(() => {
    if (multiplexer) {
      multiplexer.getServer().close();
      multiplexer = null;
    }
  });

  it('starts successfully as Master on basePort', async () => {
    multiplexer = new AgentMultiplexer({ basePort: 10000, maxPorts: 5 });
    const result = await multiplexer.start();
    expect(result.isMaster).toBe(true);
    expect(result.port).toBe(10000);
  });

  it('binds to next port if basePort is occupied and announces itself', async () => {
    // Occupy the basePort first
    const dummyServer = http.createServer().listen(10010, '127.0.0.1');
    await new Promise(r => setTimeout(r, 100)); // wait for listen

    multiplexer = new AgentMultiplexer({ basePort: 10010, maxPorts: 5 });
    
    // We mock fetch so we don't actually try to announce to the dummy server
    const fetchMock = vi.spyOn(global, 'fetch').mockImplementation(async () => new Response());
    
    const result = await multiplexer.start();
    
    expect(result.isMaster).toBe(false);
    expect(result.port).toBe(10011);
    expect(fetchMock).toHaveBeenCalled();
    
    dummyServer.close();
    fetchMock.mockRestore();
  });

  it('validates /announce endpoint (400 on invalid data)', async () => {
    multiplexer = new AgentMultiplexer({ basePort: 10020, maxPorts: 5 });
    await multiplexer.start();

    // Valid data
    let res = await fetch(`http://127.0.0.1:10020/announce`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ port: 10021 })
    });
    expect(res.status).toBe(200);

    // Invalid data (no port)
    res = await fetch(`http://127.0.0.1:10020/announce`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hello: "world" })
    });
    expect(res.status).toBe(400);

    // Invalid data (wrong type)
    res = await fetch(`http://127.0.0.1:10020/announce`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ port: "10021" })
    });
    expect(res.status).toBe(400);
  });
});
