import { getMcpClient, disconnectMcpClient } from "../lib/mcp-client";

async function main() {
  try {
    const client = await getMcpClient();
    console.log("Tools:", client.tools);

    // Try a lightweight call if available
    if (client.tools.includes("list_supported_jurisdictions")) {
      const res = await client.callTool("list_supported_jurisdictions", {});
      console.log("list_supported_jurisdictions ->", JSON.stringify(res).slice(0, 500));
    } else if (client.tools.includes("generate_legal_document")) {
      const res = await client.callTool("generate_legal_document", {
        documentType: "Test",
        state: "CA",
        county: "Los Angeles",
        petitioner: "John Doe",
        respondent: "State of California"
      });
      console.log("generate_legal_document ->", JSON.stringify(res).slice(0, 500));
    } else {
      console.log("No known testable tools available.");
    }
  } catch (e: any) {
    console.error("MCP test failed:", e?.message || e);
    process.exitCode = 1;
  } finally {
    await disconnectMcpClient();
  }
}

main();


