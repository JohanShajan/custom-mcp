import express from "express";

const app = express();
app.use(express.json());

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


// Root route (important for Railway health check)
app.get("/", (req, res) => {
  res.send("MCP Server Running");
});


app.post("/mcp", (req, res) => {
  try {
    const body = req.body || {};
    const { method, params, id } = body;

    if (!method) {
      return res.status(400).json({
        jsonrpc: "2.0",
        id: id || null,
        error: { message: "Invalid request: method missing" }
      });
    }

    // tools/list
    if (method === "tools/list") {
      return res.json({
        jsonrpc: "2.0",
        id,
        result: { tools }
      });
    }

    // tools/call
    if (method === "tools/call") {
      const { name, arguments: args } = params || {};

      if (name === "addExpense") {
        expenses.push(args || {});
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
        const result = (args?.a || 0) + (args?.b || 0);
        return res.json({
          jsonrpc: "2.0",
          id,
          result: {
            content: [{ type: "text", text: `${result}` }]
          }
        });
      }

      return res.json({
        jsonrpc: "2.0",
        id,
        error: { message: "Unknown tool" }
      });
    }

    return res.status(400).json({
      jsonrpc: "2.0",
      id,
      error: { message: "Unknown method" }
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("MCP server running on port", PORT);
});
