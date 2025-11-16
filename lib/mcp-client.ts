import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { spawn, ChildProcess } from "child_process";

interface McpClient {
  tools: string[];
  callTool: (toolName: string, args: any) => Promise<any>;
  disconnect?: () => Promise<void>;
}

let cachedClient: McpClient | null = null;
let clientProcess: ChildProcess | null = null;

/**
 * Get or create an MCP client connected to n8n-mcp
 * Uses the configuration from mcp-config.json
 */
export async function getMcpClient(): Promise<McpClient> {
  // Return cached client if available
  if (cachedClient) {
    return cachedClient;
  }

  try {
    // Read configuration - prefer cloud n8n instance
    const n8nApiUrl = process.env.N8N_API_URL || "https://askailegal3.app.n8n.cloud/";
    const n8nApiKey = process.env.N8N_API_KEY;
    
    if (!n8nApiKey) {
      throw new Error("N8N_API_KEY environment variable is required. Please set it in your .env.local file.");
    }

    // MCP client initialization (silent)

    // Spawn n8n-mcp process
    const command = "npx";
    const args = ["n8n-mcp"];
    const env = {
      ...process.env,
      MCP_MODE: "stdio",
      LOG_LEVEL: "error",
      DISABLE_CONSOLE_OUTPUT: "true",
      N8N_API_URL: n8nApiUrl,
      N8N_API_KEY: n8nApiKey,
    };

    clientProcess = spawn(command, args, {
      env,
      stdio: ["pipe", "pipe", "pipe"],
    });

    // Handle process errors
    clientProcess.on("error", (error) => {
      console.error("❌ MCP client process error:", error);
      cachedClient = null;
      clientProcess = null;
    });

    clientProcess.on("exit", (code) => {
      // MCP client process exited (silent)
      cachedClient = null;
      clientProcess = null;
    });

    // Create stdio transport
    const transport = new StdioClientTransport({
      command: command,
      args: args,
      env: env as Record<string, string>,
    });

    // Create MCP client
    const client = new Client(
      {
        name: "ask-ai-legal-mcp-client",
        version: "1.0.0",
      },
      {
        capabilities: {},
      }
    );

    // Connect to the server
    await client.connect(transport);

    // MCP client connected (silent)

    // List available tools
    const toolsList = await client.listTools();
    const toolNames = toolsList.tools.map((tool) => tool.name);

    // Create the client interface
    const mcpClient: McpClient = {
      tools: toolNames,
      callTool: async (toolName: string, args: any) => {
        try {
          // Calling MCP tool (silent)
          
          // Find the tool definition
          const tool = toolsList.tools.find((t) => t.name === toolName);
          if (!tool) {
            throw new Error(`Tool ${toolName} not found. Available tools: ${toolNames.join(", ")}`);
          }

          // Call the tool
          const result = await client.callTool({
            name: toolName,
            arguments: args,
          });

          // MCP tool completed (silent)
          return result;
        } catch (error: any) {
          console.error(`❌ Error calling MCP tool ${toolName}:`, error);
          throw new Error(`MCP tool call failed: ${error.message}`);
        }
      },
      disconnect: async () => {
        try {
          await client.close();
          if (clientProcess) {
            clientProcess.kill();
            clientProcess = null;
          }
          cachedClient = null;
          // MCP client disconnected (silent)
        } catch (error) {
          console.error("❌ Error disconnecting MCP client:", error);
        }
      },
    };

    // Cache the client
    cachedClient = mcpClient;

    return mcpClient;
  } catch (error: any) {
    console.error("❌ Failed to initialize MCP client:", error);
    
    // Fallback to mock client if connection fails
    console.warn("⚠️ Falling back to mock MCP client");
    return {
      tools: ["generate_legal_document"],
      callTool: async (toolName: string, args: any) => {
        console.warn(`⚠️ Using mock implementation for tool: ${toolName}`);
        return {
          success: false,
          error: `MCP connection failed: ${error.message}. Using mock implementation.`,
          document: null,
          metadata: {
            tool: toolName,
            args: args,
            mock: true,
          },
        };
      },
    };
  }
}

/**
 * Disconnect the MCP client and cleanup
 */
export async function disconnectMcpClient(): Promise<void> {
  if (cachedClient?.disconnect) {
    await cachedClient.disconnect();
  }
  cachedClient = null;
}
