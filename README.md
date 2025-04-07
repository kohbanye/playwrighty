# Playwrighty

A bun-based CLI tool for running E2E tests written in natural language using Markdown files.

## Features

- Run E2E tests written in natural language Markdown
- Analyze natural language test steps and convert them to executable actions
- Simulate browser interactions with Playwright MCP
- Flexible test file parsing for different markdown formats
- Command-line interface for running tests

## Prerequisites

- Bun 1.0.0 or higher

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/playwrighty.git
cd playwrighty

# Install dependencies
bun install

# Install Playwright browsers
bunx playwright install
```

## Usage

### Running Tests

Run a single test file:

```bash
bun src/cli/index.ts run tests/examplecom_sample.md
```

### Options

- `--headless`: Run tests in headless mode
- `--slow-mo <ms>`: Slow down operations by specified milliseconds

## Writing Tests

Tests are written in Markdown format with natural language descriptions:

```markdown
# Example.com Test

Navigate to https://example.com.
Expect to see the page title "Example Domain".
```

## Advanced Usage

### Programmatic API

```typescript
import { runTests } from "playwrighty";

const results = await runTests("tests/examplecom_sample.md", {
  headless: true,
  slowMo: 100,
});

console.log(`Tests passed: ${results.success}/${results.total}`);
```
