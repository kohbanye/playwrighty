// import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import {
  coreMessageSchema,
  experimental_createMCPClient,
  streamText,
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
  fullText: string;
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
  const systemPrompt = `
You are an E2E test automation assistant. I will provide you with a test description in Markdown format.
Your role is as follows:

1. Understand the test steps in the Markdown
2. Execute each step using Playwright MCP tools
3. Evaluate the results of each step
4. Report the overall test results after all steps are completed

Test content written in Markdown format will be provided to you.
First, please analyze this test and provide an overview of the steps to be executed.
Then, let's execute the steps one by one.
For each step, please provide the exact phrase **'test passed'** if the step was successful, or **'test failed'**  if it was not.
When all steps are completed, please explicitly summarize the test results and provide a exact phrase **'all tests passed'** if all tests passed.
`;

  const userPrompt = `
Test content:

${testContent}
`;

  const messages = [
    coreMessageSchema.parse({
      role: "system",
      content: systemPrompt,
    }),
    coreMessageSchema.parse({
      role: "user",
      content: userPrompt,
    }),
  ];

  const tools = await mcpClient.tools();
  const result = streamText({
    model: openai("gpt-4o-mini"),
    messages,
    tools,
    maxTokens: 2000,
    maxSteps: options.maxSteps ?? 30,
  });

  const testResults = {
    fullText: "",
    stepMarks: "",
    numSuccess: 0,
    numFailures: 0,
  };

  for await (const chunk of result.textStream) {
    testResults.fullText += chunk;
    const numSuccess = testResults.fullText.match(/test passed/g)?.length ?? 0;
    const numFailures = testResults.fullText.match(/test failed/g)?.length ?? 0;

    if (numSuccess > testResults.numSuccess) {
      testResults.stepMarks += "🟢";
      testResults.numSuccess = numSuccess;
    }

    if (numFailures > testResults.numFailures) {
      testResults.stepMarks += "🔴";
      testResults.numFailures = numFailures;
    }

    process.stdout.write("\r\x1b[K"); // Clear current line
    process.stdout.write(`Steps: ${testResults.stepMarks}`);
  }
  process.stdout.write("\n");

  return {
    success: testResults.fullText.toLowerCase().includes("all tests passed"),
    total: testResults.numSuccess + testResults.numFailures,
    fullText: testResults.fullText,
  };
};
