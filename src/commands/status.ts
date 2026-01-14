import { join } from "path";
import pc from "picocolors";
import { loadConfig, getEnabledTargets, ConfigNotFoundError, sourceExists } from "../config";
import { getSkillFolders, checkSymlinkStatus } from "../symlink";
import { getSourceDir, shortenPath } from "../utils/paths";
import { logger } from "../utils/logger";

export async function runStatus(): Promise<void> {
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

  const sourceDir = getSourceDir();
  const targets = getEnabledTargets(config);
  const skillFolders = await getSkillFolders(config);

  // Print source info
  console.log(`${pc.bold("Source:")} ${shortenPath(sourceDir)} (${skillFolders.length} skill folder${skillFolders.length !== 1 ? "s" : ""})`);

  // Print enabled targets
  console.log(`${pc.bold("Targets:")} ${Object.keys(targets).join(", ") || "none enabled"}`);

  if (skillFolders.length === 0) {
    console.log(pc.yellow("\nNo skill folders found."));
    console.log(`Add skill folders to ${pc.cyan(shortenPath(sourceDir) + "/")}`);
    return;
  }

  if (Object.keys(targets).length === 0) {
    console.log(pc.yellow("\nNo targets enabled."));
    console.log(`Edit your config at ${pc.cyan(shortenPath(sourceDir) + "/config.yaml")}`);
    return;
  }

  // Print status header
  logger.section("Sync Status:");

  // Track statistics
  let synced = 0;
  let notSynced = 0;
  let conflicts = 0;
  let broken = 0;

  // Check status of each skill folder
  for (const skillName of skillFolders) {
    logger.skillHeader(skillName);

    const sourcePath = join(sourceDir, skillName);

    for (const [targetName, targetConfig] of Object.entries(targets)) {
      const targetPath = join(targetConfig.path, skillName);

      try {
        const { status, detail } = await checkSymlinkStatus(sourcePath, targetPath);

        switch (status) {
          case "synced":
            logger.status(targetName, "synced");
            synced++;
            break;
          case "not-synced":
            logger.status(targetName, "not-synced");
            notSynced++;
            break;
          case "conflict":
            logger.status(targetName, "conflict", detail);
            conflicts++;
            break;
          case "broken":
            logger.status(targetName, "broken");
            broken++;
            break;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`${targetName}: ${message}`);
      }
    }
  }

  // Print summary
  console.log("");
  const parts: string[] = [];
  if (synced > 0) parts.push(pc.green(`${synced} synced`));
  if (notSynced > 0) parts.push(pc.red(`${notSynced} not synced`));
  if (conflicts > 0) parts.push(pc.yellow(`${conflicts} conflict${conflicts !== 1 ? "s" : ""}`));
  if (broken > 0) parts.push(pc.yellow(`${broken} broken`));

  console.log(`${pc.bold("Summary:")} ${parts.join(", ")}`);

  if (notSynced > 0 || broken > 0) {
    console.log(pc.dim(`\nRun ${pc.cyan("skills-sync")} to sync.`));
  }
}
