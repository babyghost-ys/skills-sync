import pc from "picocolors";

export const logger = {
  /**
   * Success message (green checkmark)
   */
  success(message: string): void {
    console.log(`    ${pc.green("✓")} ${message}`);
  },

  /**
   * Info/already synced message (blue arrow)
   */
  info(message: string): void {
    console.log(`    ${pc.blue("→")} ${message}`);
  },

  /**
   * Warning message (yellow warning sign)
   */
  warn(message: string): void {
    console.log(`    ${pc.yellow("⚠")} ${message}`);
  },

  /**
   * Error message (red X)
   */
  error(message: string): void {
    console.log(`    ${pc.red("✗")} ${message}`);
  },

  /**
   * Skill folder header (indented)
   */
  skillHeader(name: string): void {
    console.log(`\n  ${pc.bold(name)}/`);
  },

  /**
   * Section header
   */
  section(message: string): void {
    console.log(`\n${pc.bold(message)}`);
  },

  /**
   * Plain message
   */
  log(message: string): void {
    console.log(message);
  },

  /**
   * Dimmed message
   */
  dim(message: string): void {
    console.log(pc.dim(message));
  },

  /**
   * Summary line
   */
  summary(
    created: number,
    skipped: number,
    warnings: number,
    errors: number = 0,
    removed: number = 0
  ): void {
    const parts: string[] = [];
    if (created > 0) parts.push(pc.green(`${created} created`));
    if (removed > 0) parts.push(pc.magenta(`${removed} removed`));
    if (skipped > 0) parts.push(pc.blue(`${skipped} skipped`));
    if (warnings > 0) parts.push(pc.yellow(`${warnings} warning${warnings > 1 ? "s" : ""}`));
    if (errors > 0) parts.push(pc.red(`${errors} error${errors > 1 ? "s" : ""}`));

    console.log(`\n${pc.bold("Summary:")} ${parts.join(", ")}`);
  },

  /**
   * Status indicator for status command
   */
  status(target: string, status: "synced" | "not-synced" | "conflict" | "broken", detail?: string): void {
    const statusMap = {
      synced: pc.green("✓ synced"),
      "not-synced": pc.red("✗ not synced"),
      conflict: pc.yellow(`⚠ conflict${detail ? ` (${detail})` : ""}`),
      broken: pc.yellow(`⚠ broken symlink`),
    };
    console.log(`    ${target}: ${statusMap[status]}`);
  },
};

export type Logger = typeof logger;
