import express from "express";

let expenses = [];

const tools = [
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
];

const app = express();
app.use(express.json());

/* Health check (important for Railway) */
app.get("/", (req, res) => {
  res.send("MCP Server Running");
});

/* MCP endpoint */
app.post("/mcp", (req, res) => {
  try {
    const { method, params, id } = req.body;

    if (method === "tools/list") {
      return res.json({
        jsonrpc: "2.0",
        id,
        result: { tools }
      });
    }

    if (method === "tools/call") {
      const { name, arguments: args } = params || {};

      if (name === "addExpense") {
        expenses.push(args);
        return res.json({
          jsonrpc: "2.0",
          id,
          result: {
            content: [{ type: "text", text: "Expense added" }]
          }
        });
      }

      if (name === "getTotalExpense") {
        const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);
        return res.json({
          jsonrpc: "2.0",
          id,
          result: {
            content: [{ type: "text", text: `Total: ${total}` }]
          }
        });
      }

      if (name === "add") {
        return res.json({
          jsonrpc: "2.0",
          id,
          result: {
            content: [{ type: "text", text: `${args.a + args.b}` }]
          }
        });
      }
    }

    res.status(400).json({
      jsonrpc: "2.0",
      id,
      error: { message: "Unknown method" }
    });

  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).send("Server error");
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("MCP server running on port", PORT);
});
