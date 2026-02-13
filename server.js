import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import express from "express";

import {
  ListToolsRequestSchema,
  CallToolRequestSchema
} from "@modelcontextprotocol/sdk/types.js";

// Crash logs
process.on("uncaughtException", err => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", err => {
  console.error("Unhandled Rejection:", err);
});

// In-memory storage (replaces SQLite)
let expenses = [];

// MCP server
const server = new Server(
  {
    name: "expense-server",
    version: "1.0.0"
  },
  {
    capabilities: { tools: {} }
  }
);

// Tool definitions
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "addExpense",
        description: "Add an expense with amount and category",
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
        description: "Get total expense recorded",
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
      },
      {
        name: "subtract",
        description: "Subtract two numbers",
        inputSchema: {
          type: "object",
          properties: {
            a: { type: "number" },
            b: { type: "number" }
          },
          required: ["a", "b"]
        }
      },
      {
        name: "emi",
        description: "Calculate EMI",
        inputSchema: {
          type: "object",
          properties: {
            principal: { type: "number" },
            rate: { type: "number" },
            months: { type: "number" }
          },
          required: ["principal", "rate", "months"]
        }
      }
    ]
  };
});

// Tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  // Add Expense
  if (name === "addExpense") {
    expenses.push({
      amount: args.amount,
      category: args.category
    });

    return {
      content: [{ type: "text", text: "Expense added successfully" }]
    };
  }

  // Get Total Expense
  if (name === "getTotalExpense") {
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);

    return {
      content: [
        { type: "text", text: `Total expense: ${total}` }
      ]
    };
  }

  // Add numbers
  if (name === "add") {
    return {
      content: [{ type: "text", text: `Result: ${args.a + args.b}` }]
    };
  }

  // Subtract numbers
  if (name === "subtract") {
    return {
      content: [{ type: "text", text: `Result: ${args.a - args.b}` }]
    };
  }

  // EMI calculation
  if (name === "emi") {
    const r = args.rate / 12 / 100;
    const emi =
      (args.principal * r * Math.pow(1 + r, args.months)) /
      (Math.pow(1 + r, args.months) - 1);

    return {
      content: [
        { type: "text", text: `Monthly EMI: ${emi.toFixed(2)}` }
      ]
    };
  }

  return {
    content: [{ type: "text", text: "Unknown tool" }]
  };
});

// EXPRESS SERVER
const app = express();
app.use(express.json());

app.post("/mcp", async (req, res) => {
  try {
    const response = await server.handleRequest(req.body);
    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("MCP server running on port", PORT);
});
