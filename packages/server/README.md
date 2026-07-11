# Browcy MCP Server

This is the official Model Context Protocol (MCP) server for the **Browcy Chrome Extension**. 

It acts as a bridge, allowing your local AI agents (like Claude Desktop or Antigravity) to natively connect to your live Chrome browser, capture high-quality screenshots, extract Accessibility Trees (ARIA), and natively click/type on elements.

## 🚀 Installation & Usage

You do not need to install this package globally. You can run it directly via `npx`.

### Using with Claude Desktop

Add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "browcy": {
      "command": "npx",
      "args": [
        "-y",
        "browcy-mcp@latest"
      ]
    }
  }
}
```

### Important Requirement
This server **requires** the Browcy Chrome Extension to be installed and active in your browser. 

Since the extension is currently pending review in the Chrome Web Store, you can install it manually:
1. Go to our [GitHub Releases / Tags](https://github.com/dicypruss/browcy/tags).
2. Download the `browcy-extension-vX.X.X.zip` file from the latest release.
3. Open `chrome://extensions/` in your browser.
4. Enable **Developer mode** in the top right corner.
5. Drag and drop the downloaded ZIP file into the extensions page to install it.
6. Open the extension popup and ensure it says "Connection: Connected" (it connects to this MCP server locally on port 8765).

## 🛠 Features available to AI Agents
- `browser_list_tabs`: View all your open tabs.
- `browser_click` / `browser_type` / `browser_scroll`: Native DOM interactions that do not rely on fragile JavaScript injections.
- `browser_snapshot`: Extracts the ARIA Accessibility Tree of the page for perfect element targeting.
- `browser_screenshot`: Captures high-res visual representations of the active tab.

For the full source code and contribution guidelines, visit our [GitHub Repository](https://github.com/dicypruss/browcy).
