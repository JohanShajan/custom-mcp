import express from "express";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

import {
  ListToolsRequestSchema,
  CallToolRequestSchema
} from "@modelcontextprotocol/sdk/types.js";

// Crash logging
process.on("uncaughtException", err => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", err => {
  console.error("Unhandled Rejection:", err);
});

// Fix SQLite path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, "expense.db");

// const db = new Database(dbPath);

const db = new Database(':memory:');

// Create table
db.prepare(`
  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL,
    category TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// MCP Server
const server = new Server(
  {
    name: "expense-server",
    version: "1.0.0"
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// Tool list
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

// Tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "addExpense") {
    db.prepare(
      "INSERT INTO expenses (amount, category) VALUES (?, ?)"
    ).run(args.amount, args.category);

    return { content: [{ type: "text", text: "Expense added successfully" }] };
  }

  if (name === "getTotalExpense") {
    const row = db.prepare("SELECT SUM(amount) AS total FROM expenses").get();
    return {
      content: [{ type: "text", text: `Total expense: ${row.total || 0}` }]
    };
  }

  if (name === "add") {
    return {
      content: [{ type: "text", text: `Result: ${args.a + args.b}` }]
    };
  }

  if (name === "subtract") {
    return {
      content: [{ type: "text", text: `Result: ${args.a - args.b}` }]
    };
  }

  if (name === "emi") {
    const r = args.rate / 12 / 100;
    const emi =
      (args.principal * r * Math.pow(1 + r, args.months)) /
      (Math.pow(1 + r, args.months) - 1);

    return {
      content: [{ type: "text", text: `Monthly EMI: ${emi.toFixed(2)}` }]
    };
  }

  return { content: [{ type: "text", text: "Unknown tool" }] };
});

// Express server
const app = express();
app.use(express.json());

// MCP endpoint
app.post("/mcp", async (req, res) => {
  try {
    const response = await server.handleRequest(req.body);
    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Health check
app.get("/", (req, res) => {
  res.send("MCP Server Running");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`MCP Server running on port ${PORT}`);
});
