// import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import {
  coreMessageSchema,
  experimental_createMCPClient,
  generateText,
} from "ai";
import { Experimental_StdioMCPTransport } from "ai/mcp-stdio";
import dotenv from "dotenv";
import * as fs from "fs/promises";

dotenv.config();

export interface RunOptions {
  headless?: boolean;
  slowMo?: number;
  maxSteps?: number;
}

export interface TestResult {
  success: boolean;
  total: number;
}

export const runTests = async (
  testFilePath: string,
  options: RunOptions = {}
): Promise<TestResult> => {
  const testContent = await fs.readFile(testFilePath, "utf-8");

  const transport = new Experimental_StdioMCPTransport({
    command: "bunx",
    args: [
      "@playwright/mcp@latest",
      ...(options.headless ? ["--headless"] : []),
    ],
  });

  const mcpClient = await experimental_createMCPClient({
    transport,
  });

  try {
    return await executeTest(mcpClient, testContent, options);
  } finally {
    await mcpClient.close();
  }
};

const executeTest = async (
  mcpClient: Awaited<ReturnType<typeof experimental_createMCPClient>>,
  testContent: string,
  options: RunOptions = {}
): Promise<TestResult> => {
  const initialPrompt = `
You are an E2E test automation assistant. I will provide you with a test description in Markdown format.
Your role is as follows:

1. Understand the test steps in the Markdown
2. Execute each step using Playwright MCP tools
3. Evaluate the results of each step
4. Report the overall test results after all steps are completed

Test content:

${testContent}

First, please analyze this test and provide an overview of the steps to be executed.
Then, let's execute the steps one by one.
When all steps are completed, please explicitly summarize the test results and **include the exact phrase 'test passed' if the test was successful, or 'test failed' if it was not**.
`;

  const messages = [
    coreMessageSchema.parse({
      role: "user",
      content: initialPrompt,
    }),
  ];

  console.log("Sending message to LLM...");

  const tools = await mcpClient.tools();
  const result = await generateText({
    model: openai("gpt-4o-mini"),
    messages,
    tools,
    maxTokens: 2000,
    maxSteps: options.maxSteps ?? 30,
  });

  console.log(`Assistant: ${result.text}`);

  const isSuccess = result.text.toLowerCase().includes("test passed");

  return {
    success: isSuccess,
    total: result.steps.length,
  };
};
