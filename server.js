import express from "express";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  { name: "test-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// Define a simple tool to test connectivity
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [{
    name: "ping",
    description: "Check if the cloud server is alive",
    inputSchema: { type: "object", properties: {} }
  }]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "ping") {
    return { content: [{ type: "text", text: "Cloud connection successful!" }] };
  }
  return { content: [{ type: "text", text: "Unknown tool" }], isError: true };
});

const app = express();
let transport;

// Endpoint 1: Establish the SSE connection
app.get("/sse", async (req, res) => {
  transport = new SSEServerTransport("/messages", res);
  await server.connect(transport);
});

// Endpoint 2: Receive messages from the client
app.post("/messages", express.json(), async (req, res) => {
  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    res.status(400).send("No active SSE connection");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`MCP Server running on port ${PORT}`);
});