import fs from "fs";
import MarkdownIt from "markdown-it";
import path from "path";

export interface TestScenario {
  title: string;
  description: string;
  steps: string[];
  expectations: string[];
}

/**
 * Parse markdown test file and extract test scenario
 */
export const parseMarkdownTest = (filePath: string): TestScenario => {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const md = new MarkdownIt();
    const tokens = md.parse(content, {});

    let title = "";
    let description = "";
    let steps: string[] = [];
    let expectations: string[] = [];

    let currentSection = "";

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      if (token.type === "heading_open" && token.tag === "h1") {
        title = tokens[i + 1].content;
        i += 2; // Skip the heading_close token
      } else if (token.type === "heading_open" && token.tag === "h2") {
        const sectionTitle = tokens[i + 1].content;
        currentSection = sectionTitle.toLowerCase();
        i += 2; // Skip the heading_close token
      } else if (
        token.type === "paragraph_open" &&
        (currentSection === "テストシナリオ" ||
          currentSection === "test scenario" ||
          currentSection === "scenario")
      ) {
        description = tokens[i + 1].content;
        i += 2; // Skip the paragraph_close token
      } else if (
        token.type === "bullet_list_open" &&
        (currentSection === "期待される結果" ||
          currentSection === "expectations" ||
          currentSection === "expected results")
      ) {
        // Extract expectations from bullet list
        i++;
        while (i < tokens.length && tokens[i].type !== "bullet_list_close") {
          if (tokens[i].type === "list_item_open") {
            i++;
            // Find the content of the list item
            while (i < tokens.length && tokens[i].type !== "list_item_close") {
              if (tokens[i].type === "paragraph_open") {
                i++;
                expectations.push(tokens[i].content);
                i++;
              } else {
                i++;
              }
            }
          } else {
            i++;
          }
        }
      } else if (
        token.type === "ordered_list_open" &&
        (currentSection === "ステップ" ||
          currentSection === "steps" ||
          currentSection === "test steps")
      ) {
        // Extract steps from ordered list
        i++;
        while (i < tokens.length && tokens[i].type !== "ordered_list_close") {
          if (tokens[i].type === "list_item_open") {
            i++;
            // Find the content of the list item
            while (i < tokens.length && tokens[i].type !== "list_item_close") {
              if (tokens[i].type === "paragraph_open") {
                i++;
                steps.push(tokens[i].content);
                i++;
              } else {
                i++;
              }
            }
          } else {
            i++;
          }
        }
      }
    }

    return {
      title,
      description,
      steps,
      expectations,
    };
  } catch (error) {
    console.error(`Error parsing markdown file: ${error}`);
    throw error;
  }
};

/**
 * Find all markdown test files in the specified directory
 */
export const findTestFiles = (directoryPath: string): string[] => {
  try {
    const files = fs.readdirSync(directoryPath);
    return files
      .filter((file) => file.endsWith(".md"))
      .map((file) => path.join(directoryPath, file));
  } catch (error) {
    console.error(`Error finding test files: ${error}`);
    throw error;
  }
};
