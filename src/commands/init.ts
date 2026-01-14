import { mkdir, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { stringify } from "yaml";
import pc from "picocolors";
import { getSourceDir, getConfigPath, shortenPath } from "../utils/paths";
import { getDefaultConfig, sourceExists, configExists } from "../config";
import { logger } from "../utils/logger";

const EXAMPLE_SKILL_CONTENT = `# Example Skill

This is an example skill folder created by \`skills-sync init\`.

## Instructions

Add your custom AI coding rules and instructions here. This file will be synced to all enabled AI tool directories.

## Usage

1. Edit this file or create new skill folders in \`~/.skills-sync/skills/\`
2. Run \`skills-sync\` to sync your skills to Claude, Gemini, etc.
3. Run \`skills-sync status\` to check sync status

## Tips

- Each folder in \`~/.skills-sync/skills/\` becomes a skill
- Name folders descriptively (e.g., \`typescript-rules\`, \`code-review\`, \`debugging\`)
- Use \`SKILL.md\` or any markdown file for your instructions
`;

export async function runInit(): Promise<void> {
  const sourceDir = getSourceDir();
  const configPath = getConfigPath();
  const exampleDir = join(sourceDir, "example");
  const exampleFile = join(exampleDir, "SKILL.md");

  let createdSource = false;
  let createdConfig = false;
  let createdExample = false;

  logger.section("Initialising skills-sync...");

  // Create source directory
  if (!sourceExists()) {
    await mkdir(sourceDir, { recursive: true });
    logger.success(`Created ${shortenPath(sourceDir)}/`);
    createdSource = true;
  } else {
    logger.info(`${shortenPath(sourceDir)}/ already exists`);
  }

  // Create config file
  if (!configExists()) {
    const defaultConfig = getDefaultConfig();
    const yamlContent = generateConfigYaml(defaultConfig);
    await writeFile(configPath, yamlContent, "utf-8");
    logger.success(`Created ${shortenPath(configPath)}`);
    createdConfig = true;
  } else {
    logger.info(`${shortenPath(configPath)} already exists`);
  }

  // Create example skill folder
  if (!existsSync(exampleDir)) {
    await mkdir(exampleDir, { recursive: true });
    await writeFile(exampleFile, EXAMPLE_SKILL_CONTENT, "utf-8");
    logger.success(`Created ${shortenPath(exampleDir)}/SKILL.md`);
    createdExample = true;
  } else {
    logger.info(`${shortenPath(exampleDir)}/ already exists`);
  }

  // Print summary and next steps
  console.log("");

  if (createdSource || createdConfig || createdExample) {
    console.log(pc.green("✓ Initialisation complete!"));
  } else {
    console.log(pc.blue("→ Already initialised"));
  }

  console.log(`
${pc.bold("Next steps:")}

  1. Add your skill folders to ${pc.cyan(shortenPath(sourceDir) + "/")}
     Each folder should contain a SKILL.md or similar markdown file.

  2. Edit ${pc.cyan(shortenPath(configPath))} to configure targets.

  3. Run ${pc.cyan("skills-sync")} to sync your skills.

  4. Run ${pc.cyan("skills-sync status")} to check sync status.
`);
}

function generateConfigYaml(config: ReturnType<typeof getDefaultConfig>): string {
  const yaml = stringify(config, {
    indent: 2,
    lineWidth: 0,
  });

  return `# skills-sync configuration
# See https://github.com/your-repo/skills-sync for documentation

${yaml}`;
}
