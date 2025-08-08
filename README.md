# ZapSign MCP Server

A Model Context Protocol (MCP) server that exposes ZapSign API operations as callable tools for LLMs (e.g., Claude Desktop or Cursor) or any MCP-compatible client.

## 🚦 Getting Started

### ⚙️ Prerequisites
- Node.js v18+ (v20+ recommended)
- npm
- A ZapSign API token

Note: Tools use the global `fetch` API available in Node v18+. If you must use an older Node version, adapt tools to import `node-fetch` and add it as a dependency.

### 📥 Installation
```sh
npm install
```

### 📦 Use via npm (published package)
If you prefer to use the published package `mcp-server-zapsign`:

- Global install (stdio by default):
```sh
npm install -g mcp-server-zapsign
mcp-server-zapsign
```

- Start in SSE mode (HTTP with Server-Sent Events):
```sh
mcp-server-zapsign --sse
# defaults to port 3001; override with PORT
PORT=4000 mcp-server-zapsign --sse
```

- Use without installing globally (via npx):
```sh
npx -y mcp-server-zapsign
npx -y mcp-server-zapsign --sse
```

- Providing credentials via environment variables (useful for npx/global):
```sh
ZAPSIGN_WORKSPACE_API_KEY=your_token_here npx -y mcp-server-zapsign --sse
```

> Note: When using the global/npx binary, ensure `ZAPSIGN_WORKSPACE_API_KEY` is exported in your environment if a local `.env` is not present.

### 🔐 Configuration
Create a `.env` file in the project root with your ZapSign API token:
```
ZAPSIGN_WORKSPACE_API_KEY=your_zapsign_api_token_here
```
This value is read by the tools (for example, see files under `tools/zapsign-workspace/api/`) to authenticate requests against `https://api.zapsign.com.br`.

## ▶️ Running the MCP Server
You can run the server in STDIO mode (for Claude Desktop and Cursor, and most MCP clients) or in SSE mode (HTTP with Server-Sent Events).

### STDIO (typical for Claude Desktop and Cursor)
Use absolute paths to ensure the correct Node version is used.

1) Find your Node path and version:
```sh
which node
node --version
```
Ensure it is v18+.

2) In Claude Desktop → Settings → Developers → Edit Config, or in Cursor → Settings → Features → MCP Servers, add:
```json
{
  "mcpServers": {
    "zapsign-mcp": {
      "command": "/absolute/path/to/node",
      "args": ["/absolute/path/to/mcpServer.js"]
    }
  }
}
```
Restart Claude Desktop or Cursor and enable the server. If tools do not appear, verify Node version and the `.env` configuration.

Cursor (mcp.json alternative):
```json
{
  "mcpServers": {
    "zapsign-mcp": {
      "command": "mcp-server-zapsign",
      "args": []
    },
    "zapsign-mcp-sse": {
      "url": "http://localhost:3001/sse"
    }
  }
}
```

### SSE (HTTP via Server-Sent Events)
```sh
node mcpServer.js --sse
```
- Defaults to port `3001` (override with `PORT`).
- Endpoint: `GET /sse` to open an SSE session; `POST /messages?sessionId=...` for messages.

### 🐳 Docker
A minimal Docker setup is included. Build and run:
```sh
docker build -t zapsign-mcp .
```
Claude Desktop / Cursor (Edit Config):
```json
{
  "mcpServers": {
    "zapsign-mcp": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "--env-file=.env", "zapsign-mcp"]
    }
  }
}
```
Put your variables in `.env` (e.g., `ZAPSIGN_WORKSPACE_API_KEY`).

## 🧰 Available Tools (ZapSign)
These tools are discovered from `tools/paths.js` and exposed to MCP clients:

- list_templates: List templates from the ZapSign API.
- get_docs: Get documents from the ZapSign API.
- delete_doc: Delete a document using the ZapSign API.
- detail_doc: Retrieve details of a document from the ZapSign API.
- delete_signer: Delete a signer from the API.
- detail_template: Retrieve details of a specific template from ZapSign.
- delete_webhook_header: Delete a webhook header.
- add_time_stamp: Add a time stamp to a document using the ZapSign API.
- create_webhook_header: Create a webhook header in the ZapSign API.
- detail_siner: Retrieve details of a signer from the API.
- add_signer: Add a signer to a document in ZapSign.
- sign_in_batch: Sign in a batch using the ZapSign API.
- delete_webhook: Delete a webhook from the ZapSign API.
- place_signatures: Place signatures on a document using the ZapSign API.
- update_siner: Update a signer in the ZapSign API.
- add_extra_doc: Add an extra document to ZapSign.
- add_extra_doc_from_template: Add an extra document from a template in ZapSign.
- create_webhook: Create a webhook in ZapSign.
- create_doc_from_upload_async: Create a document from an uploaded PDF asynchronously.
- create_doc_from_template: Create a document from a template using the ZapSign API.
- create_doc_from_upload: Create a document from an uploaded DOCX file.
- create_doc_from_template_async: Create a document from a template asynchronously using the ZapSign API.
- create_doc_from_upload_pdf: Create a document from an uploaded PDF.

You can also list tool names and schemas locally:
```sh
npm run list-tools
# or
node index.js tools
```

## ➕ Adding or Updating Tools
- Add a new tool module under `tools/zapsign-workspace/api/` following the existing pattern (`apiTool` export with a `function` and a `definition`).
- Register the new file in `tools/paths.js` so it’s discovered by the server.
- Ensure any required environment variables are read from `.env`.

## ⚠️ Notes & Tips
- If Claude Desktop, Cursor, or your MCP client cannot invoke tools, verify:
  - Node is v18+ (for native `fetch`).
  - `.env` contains a valid `ZAPSIGN_WORKSPACE_API_KEY`.
  - The absolute paths in the client config are correct.

## 📄 License
MIT
