import { rm } from "fs/promises";
import { existsSync } from "fs";
import { spawn } from "child_process";
import pc from "picocolors";
import { getBaseDir, shortenPath } from "../utils/paths";
import { loadConfig, getEnabledTargets, configExists, sourceExists } from "../config";
import { getSkillFolders, removeSymlink } from "../symlink";
import { getSourceDir } from "../utils/paths";
import { join } from "path";
import { logger } from "../utils/logger";

export interface UninstallOptions {
  purge?: boolean;
}

async function runCommand(command: string, args: string[]): Promise<{ success: boolean; output: string }> {
  return new Promise((resolve) => {
    const proc = spawn(command, args, { shell: true });
    let output = "";

    proc.stdout.on("data", (data) => {
      output += data.toString();
    });

    proc.stderr.on("data", (data) => {
      output += data.toString();
    });

    proc.on("close", (code) => {
      resolve({ success: code === 0, output });
    });

    proc.on("error", () => {
      resolve({ success: false, output });
    });
  });
}

export async function runUninstall(options: UninstallOptions = {}): Promise<void> {
  const { purge = false } = options;
  const baseDir = getBaseDir();

  logger.section("Uninstalling skills-sync...");

  // Step 1: Remove symlinks from targets
  if (configExists() && sourceExists()) {
    console.log("");
    console.log(pc.dim("Removing symlinks from targets..."));

    try {
      const config = loadConfig();
      const targets = getEnabledTargets(config);
      const skillFolders = await getSkillFolders(config);
      const sourceDir = getSourceDir();

      for (const skillName of skillFolders) {
        const sourcePath = join(sourceDir, skillName);

        for (const [targetName, targetConfig] of Object.entries(targets)) {
          const targetPath = join(targetConfig.path, skillName);
          await removeSymlink(sourcePath, targetPath);
        }
      }

      logger.success("Removed symlinks from targets");
    } catch {
      logger.warn("Could not remove symlinks (may already be removed)");
    }
  }

  // Step 2: Unlink global command
  console.log("");
  console.log(pc.dim("Unlinking global command..."));

  const { success } = await runCommand("bun", ["unlink"]);
  if (success) {
    logger.success("Unlinked global command");
  } else {
    logger.warn("Could not unlink (may already be unlinked)");
  }

  // Step 3: Optionally remove ~/.skills-sync/
  if (purge) {
    console.log("");
    console.log(pc.dim(`Removing ${shortenPath(baseDir)}...`));

    if (existsSync(baseDir)) {
      await rm(baseDir, { recursive: true, force: true });
      logger.success(`Removed ${shortenPath(baseDir)}`);
    } else {
      logger.info(`${shortenPath(baseDir)} does not exist`);
    }
  }

  // Summary
  console.log("");
  console.log(pc.green("✓ Uninstallation complete!"));

  if (!purge) {
    console.log("");
    console.log(pc.dim(`Note: Your skills and config at ${shortenPath(baseDir)} have been preserved.`));
    console.log(pc.dim("      Use --purge to remove them as well."));
  }
}
