# Privacy Policy for Browcy Extension

**Last Updated:** July 10, 2026

## Overview
Browcy ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how our Chrome Extension collects, uses, and safeguards your information. 

Browcy is an open-source Developer Tool designed to connect your local browser to your local AI agents via the Model Context Protocol (MCP).

## Data Collection and Usage
**Browcy is a 100% local, offline-first extension. We do not collect, store, or transmit any of your personal data to our own servers or any third-party analytics services.**

### Permissions We Request and Why:
1. **`debugger`**: 
   - Used to execute Chrome DevTools Protocol (CDP) commands. This is strictly required to bypass Content Security Policies (CSP) and capture high-quality full-page screenshots, allowing your local AI agent to "see" and interact with the page accurately.
2. **`scripting` & `activeTab`**: 
   - Used to inject temporary scripts to analyze page layout, simulate user clicks, and scroll the page based on the commands issued by your local MCP server.
3. **`tabs`**: 
   - Used to list your currently open tabs so your AI agent can switch between them or open new ones on your behalf.
4. **`storage`**: 
   - Used strictly locally on your device to save the WebSocket connection status and port settings.

### Data Transmission
All communication happens strictly between the Chrome Extension and your **locally running** MCP server (defaulting to `ws://localhost:8765`). **No data leaves your machine** through the Browcy extension. 

*Note: The AI agent or client (e.g., Claude Desktop, Cursor) you connect to the local MCP server may transmit data to their respective LLM providers (like OpenAI or Anthropic). Please review the privacy policies of the AI clients and LLM providers you choose to use.*

## Third-Party Services
We do not integrate with any third-party trackers, analytics, or ad networks. 

## Open Source Transparency
Our entire source code is available publicly. You are encouraged to audit the code to verify these privacy claims: [GitHub Repository Link]

## Contact Us
If you have any questions or concerns about this Privacy Policy, please open an issue in our GitHub repository.
