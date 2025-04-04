import path from "path";
import { MCPClient } from "./core/mcp-client";
import { findTestFiles, parseMarkdownTest } from "./utils/markdown-parser";

/**
 * Main entry point for programmatic usage
 */
export const runTests = async (
  testFilePath: string,
  options: {
    headless?: boolean;
    isDirectory?: boolean;
  } = {}
): Promise<{
  total: number;
  success: number;
  failed: number;
}> => {
  // Set headless mode if specified
  if (options.headless !== undefined) {
    process.env.PLAYWRIGHT_HEADLESS = options.headless ? "true" : "false";
  }

  const client = new MCPClient();

  try {
    // Start MCP client
    await client.start();

    const files = options.isDirectory
      ? findTestFiles(testFilePath)
      : [testFilePath];

    const results = {
      total: files.length,
      success: 0,
      failed: 0,
    };

    // Execute each test
    for (const file of files) {
      console.log(`\nRunning: ${path.basename(file)}`);

      // Parse test file
      const scenario = parseMarkdownTest(file);

      // Execute test
      const success = await client.executeTest(scenario);

      if (success) {
        results.success++;
      } else {
        results.failed++;
      }
    }

    return results;
  } finally {
    // Stop MCP client
    await client.stop();
  }
};

// Export core modules for programmatic usage
export { MCPClient } from "./core/mcp-client";
export { findTestFiles, parseMarkdownTest } from "./utils/markdown-parser";
export type { TestScenario } from "./utils/markdown-parser";
