import { join } from "path";
import pc from "picocolors";
import { loadConfig, getEnabledTargets, ConfigNotFoundError, sourceExists, isSkillExcluded } from "../config";
import { getSkillFolders, createSymlink } from "../symlink";
import { getSourceDir, shortenPath } from "../utils/paths";
import { logger } from "../utils/logger";

export interface SyncOptions {
  skill?: string;
  target?: string;
  dryRun?: boolean;
  force?: boolean;
}

export async function runSync(options: SyncOptions = {}): Promise<void> {
  const { skill: filterSkill, target: filterTarget, dryRun = false, force = false } = options;

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
      console.log(`Check your config at ${pc.cyan(shortenPath(getSourceDir()) + "/config.yaml")}`);
    } else {
      console.log(pc.yellow("Warning: No targets are enabled."));
      console.log(`Edit your config at ${pc.cyan(shortenPath(getSourceDir()) + "/config.yaml")}`);
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
      console.log(`Add skill folders to ${pc.cyan(shortenPath(getSourceDir()) + "/")}`);
    }
    process.exit(1);
  }

  const sourceDir = getSourceDir();

  // Print header
  if (dryRun) {
    logger.section(`Dry run: would sync from ${shortenPath(sourceDir)}`);
  } else {
    logger.section(`Syncing skills from ${shortenPath(sourceDir)}`);
  }

  // Track statistics
  let created = 0;
  let skipped = 0;
  let warnings = 0;
  let errors = 0;

  // Sync each skill folder
  for (const skillName of skillFolders) {
    logger.skillHeader(skillName);

    const sourcePath = join(sourceDir, skillName);

    for (const [targetName, targetConfig] of Object.entries(targets)) {
      // Check if skill is excluded from this target
      if (isSkillExcluded(config, skillName, targetName)) {
        logger.info(`${targetName}: excluded`);
        skipped++;
        continue;
      }

      const targetPath = join(targetConfig.path, skillName);

      try {
        const result = await createSymlink(sourcePath, targetPath, { force, dryRun });

        switch (result.type) {
          case "created":
            logger.success(`${targetName}: ${result.message}`);
            created++;
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

  // Print summary
  logger.summary(created, skipped, warnings, errors);

  if (dryRun && created > 0) {
    console.log(pc.dim("\nRun without --dry-run to apply changes."));
  }
}
