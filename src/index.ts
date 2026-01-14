#!/usr/bin/env bun

import { Command } from "commander";
import { runSync } from "./commands/sync";
import { runStatus } from "./commands/status";
import { runUnlink } from "./commands/unlink";
import { runInit } from "./commands/init";

const program = new Command();

program
  .name("skills-sync")
  .description("Synchronise AI coding assistant skills from a centralised location")
  .version("0.1.0");

// Default command: sync
program
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

program.parse();
