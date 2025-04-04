# Playwrighty

A Bun-based CLI tool for running E2E tests written in natural language using Playwright MCP (Model Context Protocol).

## Features

- Run E2E tests written in natural language (Japanese) through Markdown files
- Uses Playwright and MCP for browser automation
- Simple CLI interface for running tests
- Supports running tests in headless mode

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

### CLI Commands

```bash
# Run a single test file
bun cli run tests/sample.md

# Run a single test file in headless mode
bun cli run tests/sample.md --headless

# Run all tests in a directory
bun cli run-all tests

# List all available tests
bun cli list tests
```

### Writing E2E Tests in Markdown

Tests are written in Markdown format with the following structure:

```markdown
# Test Title

## テストシナリオ

Description of the test scenario.

## ステップ

1. First step description
2. Second step description
3. ...

## 期待される結果

- First expected result
- Second expected result
- ...
```

Example:

```markdown
# Google で検索するテスト

## テストシナリオ

このテストは Google のホームページにアクセスし、検索を実行します。

## ステップ

1. Google のホームページ（https://www.google.com）を開く
2. 検索ボックスに「Playwright MCP」と入力する
3. 検索ボタンをクリックする
4. 検索結果が表示されることを確認する

## 期待される結果

- 検索結果ページが表示される
- 検索結果に「Playwright」という単語が含まれる
```

### Programmatic Usage

```typescript
import { runTests } from "playwrighty";

// Run a single test
const results = await runTests("tests/sample.md", { headless: true });

// Run all tests in a directory
const dirResults = await runTests("tests", {
  headless: true,
  isDirectory: true,
});

console.log(`Total: ${dirResults.total}`);
console.log(`Success: ${dirResults.success}`);
console.log(`Failed: ${dirResults.failed}`);
```

## How It Works

1. The tool parses Markdown test files to extract test scenarios, steps, and expected results
2. It starts a Playwright MCP server to control the browser
3. Test steps are analyzed and converted to Playwright commands
4. The generated Playwright script is executed
5. Results are reported back to the user

## License

MIT
