import { mkdir, writeFile } from "fs/promises";
import { stringify } from "yaml";
import pc from "picocolors";
import { getSourceDir, getConfigPath, shortenPath } from "../utils/paths";
import { getDefaultConfig, sourceExists, configExists } from "../config";
import { logger } from "../utils/logger";

export async function runInit(): Promise<void> {
  const sourceDir = getSourceDir();
  const configPath = getConfigPath();

  let createdSource = false;
  let createdConfig = false;

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

  // Print summary and next steps
  console.log("");

  if (createdSource || createdConfig) {
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
# See https://github.com/babyghost-ys/skills-sync for documentation

${yaml}`;
}
