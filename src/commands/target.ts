import pc from "picocolors";
import {
  loadConfig,
  saveConfig,
  configExists,
  PRESET_TARGETS,
} from "../config";
import { logger } from "../utils/logger";
import { runUnlink } from "./unlink";

/**
 * Add a preset target to the config
 */
export async function runAddTarget(targetName: string): Promise<void> {
  if (!configExists()) {
    logger.error("Configuration not found. Run 'skills-sync init' first.");
    process.exit(1);
  }

  const preset = PRESET_TARGETS[targetName];
  if (!preset) {
    logger.error(`Unknown preset target: ${targetName}`);
    console.log("");
    console.log(`Available presets: ${pc.cyan(Object.keys(PRESET_TARGETS).join(", "))}`);
    process.exit(1);
  }

  const config = loadConfig();

  if (config.targets[targetName]) {
    logger.info(`Target '${targetName}' already exists in config`);
    if (!config.targets[targetName].enabled) {
      config.targets[targetName].enabled = true;
      saveConfig(config);
      logger.success(`Enabled target '${targetName}'`);
    }
    return;
  }

  // Add the preset target
  config.targets[targetName] = {
    path: preset.path,
    enabled: true,
    exclude: [],
  };

  saveConfig(config);
  logger.success(`Added target '${targetName}' (${preset.path})`);
  console.log("");
  console.log(`Run ${pc.cyan("skills-sync")} to sync skills to the new target.`);
}

/**
 * Remove a target from the config
 */
export async function runRemoveTarget(
  targetName: string,
  options: { keepSymlinks?: boolean } = {}
): Promise<void> {
  if (!configExists()) {
    logger.error("Configuration not found. Run 'skills-sync init' first.");
    process.exit(1);
  }

  const config = loadConfig();

  if (!config.targets[targetName]) {
    logger.error(`Target '${targetName}' not found in config`);
    console.log("");
    console.log(`Current targets: ${pc.cyan(Object.keys(config.targets).join(", "))}`);
    process.exit(1);
  }

  // Unlink symlinks for this target first (unless --keep-symlinks)
  if (!options.keepSymlinks) {
    logger.section(`Removing symlinks for '${targetName}'...`);
    await runUnlink({ target: targetName });
    console.log("");
  }

  // Remove the target from config
  delete config.targets[targetName];
  saveConfig(config);
  logger.success(`Removed target '${targetName}' from config`);
}

/**
 * List available preset targets
 */
export function runListTargets(): void {
  if (!configExists()) {
    logger.error("Configuration not found. Run 'skills-sync init' first.");
    process.exit(1);
  }

  const config = loadConfig();
  const currentTargets = Object.keys(config.targets);

  logger.section("Available preset targets:");
  console.log("");

  for (const [name, preset] of Object.entries(PRESET_TARGETS)) {
    const inConfig = currentTargets.includes(name);
    const status = inConfig
      ? pc.green("(added)")
      : pc.dim("(not added)");
    console.log(`  ${pc.bold(name)} ${status}`);
    console.log(`    ${pc.dim(preset.path)}`);
  }

  console.log("");
  console.log(`Use ${pc.cyan("skills-sync add <target>")} to add a target.`);
  console.log(`Use ${pc.cyan("skills-sync remove <target>")} to remove a target.`);
}
