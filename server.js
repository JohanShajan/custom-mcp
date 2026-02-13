import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema
} from "@modelcontextprotocol/sdk/types.js";

let expenses = [];

const server = new Server(
  { name: "expense-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "addExpense",
        description: "Add an expense",
        inputSchema: {
          type: "object",
          properties: {
            amount: { type: "number" },
            category: { type: "string" }
          },
          required: ["amount", "category"]
        }
      },
      {
        name: "getTotalExpense",
        description: "Get total expense",
        inputSchema: { type: "object", properties: {} }
      },
      {
        name: "add",
        description: "Add two numbers",
        inputSchema: {
          type: "object",
          properties: {
            a: { type: "number" },
            b: { type: "number" }
          },
          required: ["a", "b"]
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "addExpense") {
    expenses.push(args);
    return { content: [{ type: "text", text: "Expense added" }] };
  }

  if (name === "getTotalExpense") {
    const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);
    return {
      content: [{ type: "text", text: `Total: ${total}` }]
    };
  }

  if (name === "add") {
    return {
      content: [{ type: "text", text: `${args.a + args.b}` }]
    };
  }

  return {
    content: [{ type: "text", text: "Unknown tool" }]
  };
});

const transport = new StdioServerTransport();
await server.connect(transport);
