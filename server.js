import express from "express";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { createClient } from "@libsql/client";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";

// Initialize Database (Cloud-safe version)
const db = createClient({ url: "file:expense.db" });

// Initialize MCP Server
const server = new Server(
  { name: "expense-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// Tool list (Simplified for testing)
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [{
    name: "ping",
    description: "Check if server is alive",
    inputSchema: { type: "object", properties: {} }
  }]
}));

// Tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "ping") {
    return { content: [{ type: "text", text: "Cloud server is online!" }] };
  }
  return { content: [{ type: "text", text: "Unknown tool" }] };
});

const app = express();
let transport;

// MCP standard requires two endpoints for SSE cloud deployment
app.get("/sse", async (req, res) => {
  transport = new SSEServerTransport("/messages", res);
  await server.connect(transport);
});

app.post("/messages", express.json(), async (req, res) => {
  if (transport) {
    await transport.handlePostMessage(req, res);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`MCP Server running on port ${PORT}`);
});