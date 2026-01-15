#!/usr/bin/env bun

import { Command } from "commander";
import { runSync } from "./commands/sync";
import { runStatus } from "./commands/status";
import { runUnlink } from "./commands/unlink";
import { runInit } from "./commands/init";
import { runUninstall } from "./commands/uninstall";
import { runExclude, runInclude } from "./commands/exclude";
import { runAddTarget, runRemoveTarget, runListTargets } from "./commands/target";

const program = new Command();

program
  .name("skills-sync")
  .description("Synchronise AI coding assistant skills from a centralised location")
  .version("0.1.0")
  .allowExcessArguments(false)
  .allowUnknownOption(false)
  .option("-s, --skill <name>", "Sync specific skill folder only")
  .option("-t, --target <name>", "Sync to specific target only (e.g., claude, gemini)")
  .option("-d, --dry-run", "Show what would happen without making changes")
  .option("-f, --force", "Force replace existing symlinks pointing elsewhere")
  .action(async (options) => {
    await runSync({
      skill: options.skill,
      target: options.target,
      dryRun: options.dryRun,
      force: options.force,
    });
  });

// Status command
program
  .command("status")
  .description("Show current sync status")
  .action(async () => {
    await runStatus();
  });

// Unlink command
program
  .command("unlink")
  .description("Remove all symlinks")
  .option("-s, --skill <name>", "Unlink specific skill folder only")
  .option("-t, --target <name>", "Unlink from specific target only")
  .option("-d, --dry-run", "Show what would happen without making changes")
  .action(async (options) => {
    await runUnlink({
      skill: options.skill,
      target: options.target,
      dryRun: options.dryRun,
    });
  });

// Init command
program
  .command("init")
  .description("Initialise config and source directory")
  .action(async () => {
    await runInit();
  });

// Uninstall command
program
  .command("uninstall")
  .description("Uninstall skills-sync (unlink global command)")
  .option("--purge", "Also remove ~/.skills-sync/ folder including all skills and config")
  .action(async (options) => {
    await runUninstall({
      purge: options.purge,
    });
  });

// Exclude command
program
  .command("exclude <skill> <target>")
  .description("Exclude a skill from syncing to a target (e.g., skills-sync exclude frontend-design claude)")
  .action(async (skill, target) => {
    await runExclude(skill, { target });
  });

// Include command
program
  .command("include <skill> <target>")
  .description("Include a skill back for a target (e.g., skills-sync include frontend-design claude)")
  .action(async (skill, target) => {
    await runInclude(skill, { target });
  });

// Add target command
program
  .command("add <target>")
  .description("Add a preset target to config (e.g., skills-sync add opencode)")
  .action(async (target) => {
    await runAddTarget(target);
  });

// Remove target command
program
  .command("remove <target>")
  .description("Remove a target from config (e.g., skills-sync remove gemini)")
  .action(async (target) => {
    await runRemoveTarget(target);
  });

// List targets command
program
  .command("targets")
  .description("List available preset targets")
  .action(() => {
    runListTargets();
  });

program.parse();
