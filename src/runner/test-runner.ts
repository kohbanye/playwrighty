import { anthropic } from "@ai-sdk/anthropic";
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
  steps: Array<{
    step: number;
    action: string;
    result: any;
  }>;
}

export async function runTests(
  testFilePath: string,
  options: RunOptions = {}
): Promise<TestResult> {
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
    return await executeTestLoop(mcpClient, testContent, options);
  } finally {
    await mcpClient.close();
  }
}

async function executeTestLoop(
  mcpClient: ReturnType<typeof experimental_createMCPClient> extends Promise<
    infer T
  >
    ? T
    : never,
  testContent: string,
  options: RunOptions = {}
): Promise<TestResult> {
  const stepResults: Array<{ step: number; action: string; result: any }> = [];
  let currentStep = 0;
  const maxSteps = options.maxSteps || 30;

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
`;

  let messages = [
    coreMessageSchema.parse({
      role: "user",
      content: initialPrompt,
    }),
  ];

  while (true) {
    console.log("Sending message to Claude...");

    const tools = await mcpClient.tools();
    const result = await generateText({
      model: anthropic("claude-3-5-sonnet-latest"),
      maxTokens: 2000,
      messages,
      tools,
    });

    console.log("Received response from Claude");

    console.log(`Assistant: ${result.text}`);

    if (result.text.toLowerCase().includes("test completed")) {
      break;
    }

    if (result.text.length > 0) {
      messages.push(
        coreMessageSchema.parse({
          role: "assistant",
          content: result.text,
        })
      );
    }

    if (result.toolResults.length > 0) {
      messages.push(
        coreMessageSchema.parse({
          role: "tool",
          content: result.toolResults,
        })
      );
    } else {
      messages.push(
        coreMessageSchema.parse({
          role: "user",
          content:
            "If the previous step was successful, please execute the next step. If all steps are completed, please explicitly summarize the test results and ALWAYS include the exact phrase 'test completed' in your response. This phrase is required for the test runner to recognize completion.",
        })
      );
    }

    currentStep++;

    if (currentStep > maxSteps) {
      console.log(
        `Maximum step count (${maxSteps}) reached. Ending test execution.`
      );
      break;
    }
  }

  return {
    success: stepResults.every((r) => r.result.success),
    total: stepResults.length,
    steps: stepResults,
  };
}
