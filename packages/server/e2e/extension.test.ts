import { test, expect } from 'vitest';
import { chromium, BrowserContext } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import { AgentMultiplexer } from '../src/multiplexer.js';
import { WebSocketServer } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('E2E: Extension connects to MCP Server and executes click', async () => {
  // 1. Path to unpacked extension
  const extensionPath = path.join(__dirname, '../../extension');
  console.log('[E2E] Extension path:', extensionPath);

  // 2. Start MCP Multiplexer
  const multiplexer = new AgentMultiplexer({ basePort: 8765, maxPorts: 10 });
  const wss = new WebSocketServer({ noServer: true });
  
  multiplexer.getServer().on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket as any, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });

  wss.on('connection', (ws) => {
    console.log('[E2E] Extension connected to test WebSocket server!');
    multiplexer.setActiveClient(ws);
  });

  const { isMaster, port } = await multiplexer.start();
  console.log('[E2E] Multiplexer started on port:', port, 'isMaster:', isMaster);

  // 3. Launch Playwright with extension
  let context: BrowserContext | undefined;
  try {
    console.log('[E2E] Launching browser...');
    const userDataDir = path.join(__dirname, '../.chrome-data');
    context = await chromium.launchPersistentContext(userDataDir, {
      headless: false, // Must be false to support Chrome extensions
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        `--no-sandbox`,
        `--disable-gpu`,
        `--disable-dev-shm-usage`
      ],
    });
    console.log('[E2E] Browser launched');

    context.on('serviceworker', worker => {
      console.log('[E2E] Service Worker created:', worker.url());
      worker.on('console', msg => console.log('[EXT BG]', msg.text()));
    });

    // 4. Open our dumb page fixture
    const page = await context.newPage();
    const fixtureUrl = `file://${path.join(__dirname, '../test/fixtures/dumb.html')}`;
    console.log('[E2E] Navigating to fixture:', fixtureUrl);
    await page.goto(fixtureUrl);
    console.log('[E2E] Navigation complete');

    // Give extension a moment to inject content scripts and connect to WebSocket
    // Background script polls ports every 3 seconds, so we might need to wait up to 4s.
    console.log('[E2E] Waiting for extension to connect...');
    // Wait for the extension to connect to the specific client port
    let wsClient = multiplexer.getActiveClient();
    let retries = 100;
    while (!wsClient && retries > 0) {
      wsClient = multiplexer.getActiveClient();
      if (wsClient) break;
      await new Promise((r) => setTimeout(r, 100));
      retries--;
    }
    console.log('[E2E] Connection status:', wsClient ? 'Connected' : 'Not connected');

    // 5. Verify the extension connected to our Multiplexer
    expect(wsClient).toBeDefined();
    expect(wsClient).not.toBeNull();

    // 6. Send MCP command to browser
    // Wait for the WS client to be open
    if (wsClient?.readyState !== 1) { // 1 = OPEN
      console.log('[E2E] Waiting for WebSocket to be OPEN...');
      await new Promise(r => setTimeout(r, 500));
    }

    console.log('[E2E] Sending click command...');
    wsClient!.send(JSON.stringify({ id: 1, action: "click", payload: { selector: '#test-btn' } }));

    // 7. Verify the DOM changed as expected
    console.log('[E2E] Waiting for DOM update...');
    await page.waitForFunction(() => {
      return document.getElementById('output')?.textContent === 'Button was clicked!';
    }, { timeout: 10000 });

    const outputText = await page.locator('#output').textContent();
    console.log('[E2E] Output text:', outputText);
    expect(outputText).toBe('Button was clicked!');

  } finally {
    console.log('[E2E] Cleaning up...');
    await context?.close();
    multiplexer.getServer().close();
  }
}, 60000); // 60s timeout for E2E
