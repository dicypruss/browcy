# Browcy

Browcy is an advanced Model Context Protocol (MCP) server and Chrome Extension pair that allows AI agents to securely interact with the user's browser. It enables actions like capturing ARIA snapshots, navigating, clicking, typing, and extracting console logs directly from the active Chrome session.

## Architecture

Browcy is structured as a monorepo containing three packages:
- **`@browcy/extension`**: The Chrome extension that injects into pages, intercepts logs, and executes DOM interactions.
- **`@browcy/server`**: The MCP server that exposes tools to AI agents and communicates with the extension via a secure WebSocket connection.
- **`@browcy/shared`**: Shared TypeScript types for the IPC protocol between the server and the extension.

### Security
Browcy implements strict security boundaries:
1. **WebSocket Origin Validation**: The MCP server strictly validates the `Origin` header of incoming WebSocket connections to ensure only the official `chrome-extension://` origin can connect.
2. **CSRF Protection**: Secondary MCP instances (when running multiple agents) communicate with the primary server via an HTTP IPC bridge. This bridge requires an `X-Browcy-IPC: true` header to prevent Cross-Site Request Forgery (CSRF) via rogue web pages.

## Prerequisites

- Node.js (v20+)
- Chrome Browser

## Installation & Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the packages:**
   ```bash
   npm run build --workspaces
   ```

3. **Install the Chrome Extension:**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right.
   - Click "Load unpacked" and select the `packages/extension/dist` directory.
   - Pin the Browcy extension to your toolbar.

## Usage

### Starting the MCP Server

The server implements a Primary/Secondary architecture. The first instance started will bind to port `8765` and become the **Primary Node**, establishing a direct WebSocket connection with the Chrome extension. Any subsequent instances will become **Secondary Nodes** and route their commands through the Primary Node.

To run the MCP server, add it to your agent's MCP configuration:
```json
{
  "mcpServers": {
    "browcy": {
      "command": "node",
      "args": ["/path/to/browcy/packages/server/dist/index.js"]
    }
  }
}
```

### Available MCP Tools
- `browser_list_tabs`: List all open tabs.
- `browser_create_tab`, `browser_close_tab`, `browser_switch_tab`: Manage tabs.
- `browser_navigate`, `browser_go_back`, `browser_go_forward`: Navigation.
- `browser_snapshot`: Capture the Accessibility Tree (ARIA Snapshot) of a page.
- `browser_read_page`: Extract all visible text content.
- `browser_click`, `browser_type`, `browser_press_key`, `browser_scroll`: DOM interactions.
- `browser_wait_for`: Wait for a selector or text to appear.
- `browser_evaluate_js`: Run arbitrary JavaScript in the page context.
- `browser_screenshot`: Capture a visual screenshot of the tab.
- `browser_get_console_logs`: Retrieve intercepted console logs.

## Testing

The project uses `vitest` for comprehensive testing, including a simulated DOM environment (`jsdom`) for the extension logic.

To run all tests:
```bash
npm test
```
