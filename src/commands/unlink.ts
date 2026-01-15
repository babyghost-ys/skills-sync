import { join } from "path";
import pc from "picocolors";
import { loadConfig, getEnabledTargets, ConfigNotFoundError, sourceExists } from "../config";
import { getSkillFolders, removeSymlink } from "../symlink";
import { getSourceDir, shortenPath } from "../utils/paths";
import { logger } from "../utils/logger";

export interface UnlinkOptions {
  skill?: string;
  target?: string;
  dryRun?: boolean;
}

export async function runUnlink(options: UnlinkOptions = {}): Promise<void> {
  const { skill: filterSkill, target: filterTarget, dryRun = false } = options;

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

  // Get enabled targets
  const targets = getEnabledTargets(config, filterTarget);

  if (Object.keys(targets).length === 0) {
    if (filterTarget) {
      console.log(pc.yellow(`Warning: Target '${filterTarget}' is not enabled or doesn't exist.`));
    } else {
      console.log(pc.yellow("Warning: No targets are enabled."));
    }
    process.exit(1);
  }

  // Get skill folders
  const skillFolders = await getSkillFolders(config, filterSkill);

  if (skillFolders.length === 0) {
    if (filterSkill) {
      console.log(pc.yellow(`Warning: Skill folder '${filterSkill}' not found.`));
    } else {
      console.log(pc.yellow("Warning: No skill folders found."));
    }
    process.exit(1);
  }

  const sourceDir = getSourceDir();

  // Print header
  if (dryRun) {
    logger.section(`Dry run: would unlink skills from ${shortenPath(sourceDir)}`);
  } else {
    logger.section(`Unlinking skills from ${shortenPath(sourceDir)}`);
  }

  // Track statistics
  let removed = 0;
  let skipped = 0;
  let warnings = 0;
  let errors = 0;

  // Unlink each skill folder
  for (const skillName of skillFolders) {
    logger.skillHeader(skillName);

    const sourcePath = join(sourceDir, skillName);

    for (const [targetName, targetConfig] of Object.entries(targets)) {
      const targetPath = join(targetConfig.path, skillName);

      try {
        const result = await removeSymlink(sourcePath, targetPath, { dryRun });

        switch (result.type) {
          case "created":
            logger.success(`${targetName}: ${result.message}`);
            removed++;
            break;
          case "skipped":
            logger.info(`${targetName}: ${result.message}`);
            skipped++;
            break;
          case "warning":
            logger.warn(`${targetName}: ${result.message}`);
            warnings++;
            break;
          case "error":
            logger.error(`${targetName}: ${result.message}`);
            errors++;
            break;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`${targetName}: ${message}`);
        errors++;
      }
    }
  }

  // Print summary (0 created, removed goes in the removed slot)
  logger.summary(0, skipped, warnings, errors, removed);

  if (dryRun && removed > 0) {
    console.log(pc.dim("\nRun without --dry-run to apply changes."));
  }
}
