import express from "express";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  { name: "test-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// Minimal tool list
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [{
    name: "ping",
    description: "Check if server is alive",
    inputSchema: { type: "object", properties: {} }
  }]
}));

// Minimal tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "ping") {
    return { content: [{ type: "text", text: "Pong! Cloud server is working." }] };
  }
  return { content: [{ type: "text", text: "Unknown tool" }] };
});

const app = express();
let transport;

// MCP standard requires two endpoints for SSE:
// 1. The SSE connection (GET)
app.get("/sse", async (req, res) => {
  transport = new SSEServerTransport("/messages", res);
  await server.connect(transport);
});

// 2. The message delivery (POST)
app.post("/messages", async (req, res) => {
  if (transport) {
    await transport.handlePostMessage(req, res);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});