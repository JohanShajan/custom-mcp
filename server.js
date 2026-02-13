import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"; // Standard for many MCP hosts
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const server = new Server({
  name: "test-server",
  version: "1.0.0"
}, {
  capabilities: { tools: {} }
});

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [{
    name: "ping",
    description: "Check if server is alive",
    inputSchema: { type: "object", properties: {} }
  }]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "ping") {
    return { content: [{ type: "text", text: "Pong! Server is working." }] };
  }
  return { content: [{ type: "text", text: "Unknown tool" }], isError: true };
});

// Using Stdio transport as a fallback if Express is failing you
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("MCP Server running on Stdio");