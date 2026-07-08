# ADR-001: Dual-Mode Architecture and Graceful Shutdown for MCP Server

## Status
Accepted

## Date
2026-07-08

## Context
The `browcy` project consists of a Chrome Extension and a local Node.js Server. The server must fulfill two roles simultaneously:
1. Act as a standard **Model Context Protocol (MCP)** server communicating via standard input/output (stdio) so AI agents can use it.
2. Act as a **WebSocket Server** to communicate with the Chrome Extension (since extensions cannot natively use stdio).

During development, we encountered a critical issue: when the MCP server was killed or restarted by the AI host environment (Antigravity), the Node.js process would sometimes leave the WebSocket server running as a "zombie" process in the background. When the server started again, it threw a `EADDRINUSE: address already in use :::8765` error, breaking the connection with the Chrome Extension.

## Decision
1. **Dual-Mode Execution**: The server (`index.ts`) will initialize both the standard MCP Server (stdio) and a `ws` WebSocket Server on port 8765 in the same Node.js process.
2. **Graceful Shutdown**: We implemented explicit signal handlers for `SIGINT` and `SIGTERM`. When the process is asked to terminate, these handlers will gracefully close the WebSocket server, close all active client connections, and flush any remaining stdio streams before calling `process.exit(0)`.

## Alternatives Considered

### Chrome Extension Native Messaging
- **Pros**: More robust IPC mechanism compared to WebSockets; no port conflicts.
- **Cons**: Extremely difficult to distribute and configure cross-platform. Requires manual creation of JSON manifests in specific OS directories by the end-user.
- **Rejected**: Too complex for a seamless developer experience. WebSockets are simpler for local communication.

### Dynamic Port Allocation
- **Pros**: Avoids `EADDRINUSE` entirely by asking the OS for any free port.
- **Cons**: The Chrome Extension needs to know which port to connect to. If the port is dynamic, we would need a complex side-channel to communicate the current port to the extension.
- **Rejected**: Hardcoding port `8765` is much simpler for the extension to connect to automatically.

## Consequences
- The server successfully runs in both modes simultaneously.
- AI Agents can restart the MCP server without causing "address in use" errors.
- The port `8765` is now strictly managed.
- If a hard crash occurs (`SIGKILL`), the port might still hang, but standard termination (`SIGINT/SIGTERM`) is fully handled.
