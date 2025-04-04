#!/usr/bin/env bun

import { Command } from "commander";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { MCPClient } from "../core/mcp-client";
import { findTestFiles, parseMarkdownTest } from "../utils/markdown-parser";

// Load environment variables
dotenv.config();

const program = new Command();

program
  .name("playwrighty")
  .description("CLI tool for running E2E tests written in natural language")
  .version("0.1.0");

// Run a single test file
program
  .command("run")
  .description("Run a single E2E test file")
  .argument("<file>", "Path to the test file (Markdown format)")
  .option("-h, --headless", "Run in headless mode", false)
  .action(async (file, options) => {
    try {
      if (!fs.existsSync(file)) {
        console.error(`Test file not found: ${file}`);
        process.exit(1);
      }

      // Set headless mode if specified
      process.env.PLAYWRIGHT_HEADLESS = options.headless ? "true" : "false";

      const client = new MCPClient();

      try {
        // Start MCP client
        await client.start();

        // Parse test file
        const scenario = parseMarkdownTest(file);

        // Execute test
        const success = await client.executeTest(scenario);

        if (success) {
          console.log("✅ Test passed!");
        } else {
          console.error("❌ Test failed");
          process.exit(1);
        }
      } catch (error) {
        console.error(`Error occurred: ${error}`);
        process.exit(1);
      } finally {
        // Stop MCP client
        await client.stop();
      }
    } catch (error) {
      console.error(`Error occurred: ${error}`);
      process.exit(1);
    }
  });

// Run all tests in a directory
program
  .command("run-all")
  .description("Run all E2E tests in a directory")
  .argument("[directory]", "Path to the test directory", "tests")
  .option("-h, --headless", "Run in headless mode", false)
  .action(async (directory, options) => {
    try {
      const dirPath = path.resolve(process.cwd(), directory);

      if (!fs.existsSync(dirPath)) {
        console.error(`Directory not found: ${dirPath}`);
        process.exit(1);
      }

      // Set headless mode if specified
      process.env.PLAYWRIGHT_HEADLESS = options.headless ? "true" : "false";

      const testFiles = findTestFiles(dirPath);

      if (testFiles.length === 0) {
        console.log(`No test files found in: ${dirPath}`);
        process.exit(0);
      }

      console.log(`Found ${testFiles.length} test files`);

      const client = new MCPClient();
      let failedTests = 0;

      try {
        // Start MCP client
        await client.start();

        // Execute each test
        for (const file of testFiles) {
          console.log(`\nRunning: ${path.basename(file)}`);

          // Parse test file
          const scenario = parseMarkdownTest(file);

          // Execute test
          const success = await client.executeTest(scenario);

          if (!success) {
            failedTests++;
          }
        }

        // Print summary
        console.log("\n=== Test Results ===");
        console.log(`Total: ${testFiles.length}`);
        console.log(`Passed: ${testFiles.length - failedTests}`);
        console.log(`Failed: ${failedTests}`);

        if (failedTests > 0) {
          process.exit(1);
        }
      } catch (error) {
        console.error(`Error occurred: ${error}`);
        process.exit(1);
      } finally {
        // Stop MCP client
        await client.stop();
      }
    } catch (error) {
      console.error(`Error occurred: ${error}`);
      process.exit(1);
    }
  });

// List all available tests
program
  .command("list")
  .description("List all available test files")
  .argument("[directory]", "Path to the test directory", "tests")
  .action((directory) => {
    try {
      const dirPath = path.resolve(process.cwd(), directory);

      if (!fs.existsSync(dirPath)) {
        console.error(`Directory not found: ${dirPath}`);
        process.exit(1);
      }

      const testFiles = findTestFiles(dirPath);

      if (testFiles.length === 0) {
        console.log(`No test files found in: ${dirPath}`);
        return;
      }

      console.log(`=== Available Tests (${testFiles.length}) ===`);

      for (const file of testFiles) {
        try {
          const scenario = parseMarkdownTest(file);
          console.log(`• ${scenario.title} (${path.basename(file)})`);
          console.log(`  ${scenario.description}`);
          console.log();
        } catch (error) {
          console.log(`• ${path.basename(file)} (parse error)`);
        }
      }
    } catch (error) {
      console.error(`Error occurred: ${error}`);
      process.exit(1);
    }
  });

program.parse(process.argv);
