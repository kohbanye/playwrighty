import { program } from "commander";
import fs from "fs/promises";
import path from "path";
import { RunOptions, runTests } from "../runner/test-runner.js";

program
  .name("playwrighty")
  .description("Run E2E tests written in natural language using Markdown files")
  .version("1.0.0");

program
  .command("run [testFile]")
  .description(
    "Run tests. If no file is specified, runs all tests in tests/ directory"
  )
  .option("--headed", "Run tests in headed mode", false)
  .option(
    "--slow-mo <ms>",
    "Slow down operations by specified milliseconds",
    parseInt
  )
  .option(
    "--max-steps <count>",
    "Maximum number of steps to execute before ending test",
    parseInt,
    30
  )
  .action(async (testFile, options) => {
    try {
      if (testFile) {
        // Run a single test file
        const testFilePath = path.resolve(process.cwd(), testFile);
        await runSingleTest(testFilePath, options);
        return;
      }

      // Run all markdown files in tests/ directory
      const testsDir = path.resolve(process.cwd(), "tests");
      const files = await fs.readdir(testsDir);
      const mdFiles = files.filter((file) => file.endsWith(".md"));

      if (mdFiles.length === 0) {
        console.log("No test files found in tests/ directory");
        process.exit(1);
      }

      console.log(`Found ${mdFiles.length} test files`);

      let allPassed = true;
      for (const file of mdFiles) {
        const testFilePath = path.join(testsDir, file);
        const success = await runSingleTest(testFilePath, options);
        if (!success) allPassed = false;
        console.log("\n----------------------------\n");
      }

      process.exit(allPassed ? 0 : 1);
    } catch (error) {
      console.error("Error running test:", error);
      process.exit(1);
    }
  });

const runSingleTest = async (
  testFilePath: string,
  options: any
): Promise<boolean> => {
  console.log(`Running test: ${testFilePath}`);

  const testOptions: RunOptions = {
    headless: !options.headed,
    slowMo: options.slowMo,
    maxSteps: options.maxSteps,
  };

  const result = await runTests(testFilePath, testOptions);

  console.log(`\nTest Results:`);
  console.log(`Total steps: ${result.total}`);
  console.log(`Success: ${result.success ? "Yes" : "No"}`);

  return result.success;
};

program.parse(process.argv);
