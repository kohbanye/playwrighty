# Playwrighty

Playwrighty is a CLI tool for running E2E tests written in natural language using Markdown files.

## Features

- Run E2E tests written in natural language Markdown
- Analyze natural language test steps and convert them to executable actions
- Simulate browser interactions with Playwright MCP
- Flexible test file parsing for different markdown formats
- Command-line interface for running tests

## Prerequisites

- Bun 1.0.0 or higher
- Node.js 16.0.0 or higher

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
bun src/cli/index.ts run tests/sample.md
```

### Options

- `--headless`: Run tests in headless mode
- `--slow-mo <ms>`: Slow down operations by specified milliseconds

## Writing Tests

Tests are written in Markdown format with natural language descriptions:

```markdown
# Test Title

This is a description of the test.

## Steps

1. Open the Google homepage
2. Type "Playwright" in the search box
3. Click the search button
4. Wait for the results to appear

## Expected Results

- Search results page is displayed
- The results contain the word "Playwright"
```

Playwrighty supports flexible test descriptions:

- Headings can be in English or Japanese
- Steps can be numbered, bulleted, or plain text
- You can add arbitrary sections for organization

## Advanced Usage

### Programmatic API

```typescript
import { runTests } from "playwrighty";

const results = await runTests("tests/sample.md", {
  headless: true,
  slowMo: 100,
});

console.log(`Tests passed: ${results.success}/${results.total}`);
```

## License

MIT
