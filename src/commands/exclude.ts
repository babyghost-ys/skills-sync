import pc from "picocolors";
import {
  loadConfig,
  saveConfig,
  excludeSkill,
  includeSkill,
  isSkillExcluded,
  ConfigNotFoundError,
  sourceExists,
} from "../config";
import { getSkillFolders } from "../symlink";
import { logger } from "../utils/logger";

export interface ExcludeOptions {
  target: string;
}

export async function runExclude(skillName: string, options: ExcludeOptions): Promise<void> {
  const { target: targetName } = options;

  // Check if initialised
  if (!sourceExists()) {
    console.log(pc.red("Error: skills-sync is not initialised."));
    console.log(`Run ${pc.cyan("skills-sync init")} to get started.`);
    process.exit(1);
  }

  // Load config
  let config;
  try {
    config = loadConfig();
  } catch (error) {
    if (error instanceof ConfigNotFoundError) {
      console.log(pc.red("Error: Configuration file not found."));
      console.log(`Run ${pc.cyan("skills-sync init")} to create one.`);
      process.exit(1);
    }
    throw error;
  }

  // Validate target exists
  if (!config.targets[targetName]) {
    console.log(pc.red(`Error: Target '${targetName}' not found.`));
    console.log(`Available targets: ${Object.keys(config.targets).join(", ")}`);
    process.exit(1);
  }

  // Validate skill exists
  const skillFolders = await getSkillFolders(config);
  if (!skillFolders.includes(skillName)) {
    console.log(pc.red(`Error: Skill '${skillName}' not found.`));
    console.log(`Available skills: ${skillFolders.join(", ") || "none"}`);
    process.exit(1);
  }

  // Check if already excluded
  if (isSkillExcluded(config, skillName, targetName)) {
    logger.info(`'${skillName}' is already excluded from ${targetName}`);
    return;
  }

  // Add exclusion
  excludeSkill(config, skillName, targetName);
  saveConfig(config);

  logger.success(`Excluded '${skillName}' from ${targetName}`);
  console.log(pc.dim(`\nRun ${pc.cyan("skills-sync")} to apply changes.`));
}

export async function runInclude(skillName: string, options: ExcludeOptions): Promise<void> {
  const { target: targetName } = options;

  // Check if initialised
  if (!sourceExists()) {
    console.log(pc.red("Error: skills-sync is not initialised."));
    console.log(`Run ${pc.cyan("skills-sync init")} to get started.`);
    process.exit(1);
  }

  // Load config
  let config;
  try {
    config = loadConfig();
  } catch (error) {
    if (error instanceof ConfigNotFoundError) {
      console.log(pc.red("Error: Configuration file not found."));
      console.log(`Run ${pc.cyan("skills-sync init")} to create one.`);
      process.exit(1);
    }
    throw error;
  }

  // Validate target exists
  if (!config.targets[targetName]) {
    console.log(pc.red(`Error: Target '${targetName}' not found.`));
    console.log(`Available targets: ${Object.keys(config.targets).join(", ")}`);
    process.exit(1);
  }

  // Check if not excluded
  if (!isSkillExcluded(config, skillName, targetName)) {
    logger.info(`'${skillName}' is not excluded from ${targetName}`);
    return;
  }

  // Remove exclusion
  includeSkill(config, skillName, targetName);
  saveConfig(config);

  logger.success(`Included '${skillName}' back to ${targetName}`);
  console.log(pc.dim(`\nRun ${pc.cyan("skills-sync")} to apply changes.`));
}
