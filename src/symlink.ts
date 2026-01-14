import { symlink, lstat, readlink, unlink, mkdir, readdir } from "fs/promises";
import { existsSync } from "fs";
import { join, dirname } from "path";
import { getSourceDir, shortenPath } from "./utils/paths";
import type { Config } from "./config";

export type SyncResult = {
  type: "created" | "skipped" | "warning" | "error";
  message: string;
  detail?: string;
};

export type SymlinkStatus = "synced" | "not-synced" | "conflict" | "broken";

/**
 * Get all skill folders from the source directory
 */
export async function getSkillFolders(config: Config, filterSkill?: string): Promise<string[]> {
  const sourceDir = getSourceDir();

  if (!existsSync(sourceDir)) {
    return [];
  }

  const entries = await readdir(sourceDir, { withFileTypes: true });
  const folders = entries
    .filter((entry) => {
      if (!entry.isDirectory()) return false;
      if (config.exclude.includes(entry.name)) return false;
      if (filterSkill && entry.name !== filterSkill) return false;
      return true;
    })
    .map((entry) => entry.name);

  return folders.sort();
}

/**
 * Check the status of a symlink
 */
export async function checkSymlinkStatus(
  sourcePath: string,
  targetPath: string
): Promise<{ status: SymlinkStatus; detail?: string }> {
  if (!existsSync(targetPath)) {
    return { status: "not-synced" };
  }

  try {
    const stats = await lstat(targetPath);

    if (stats.isSymbolicLink()) {
      const linkTarget = await readlink(targetPath);

      // Check if symlink points to correct source
      if (linkTarget === sourcePath) {
        // Check if source exists (broken symlink check)
        if (existsSync(sourcePath)) {
          return { status: "synced" };
        } else {
          return { status: "broken" };
        }
      } else {
        return { status: "conflict", detail: `points to ${shortenPath(linkTarget)}` };
      }
    } else {
      // It's a real file or directory
      return { status: "conflict", detail: stats.isDirectory() ? "real directory" : "real file" };
    }
  } catch {
    return { status: "not-synced" };
  }
}

/**
 * Create a symlink from source to target
 */
export async function createSymlink(
  sourcePath: string,
  targetPath: string,
  options: { force?: boolean; dryRun?: boolean } = {}
): Promise<SyncResult> {
  const { force = false, dryRun = false } = options;

  // Check current status
  const { status, detail } = await checkSymlinkStatus(sourcePath, targetPath);

  if (status === "synced") {
    return { type: "skipped", message: "already synced" };
  }

  if (status === "broken") {
    if (dryRun) {
      return { type: "created", message: `would recreate broken symlink → ${shortenPath(targetPath)}` };
    }
    // Remove broken symlink and recreate
    await unlink(targetPath);
    await ensureParentDir(targetPath);
    await symlink(sourcePath, targetPath);
    return { type: "created", message: shortenPath(targetPath) };
  }

  if (status === "conflict") {
    const isSymlink = await isSymbolicLink(targetPath);

    if (isSymlink && force) {
      if (dryRun) {
        return { type: "created", message: `would replace symlink → ${shortenPath(targetPath)}` };
      }
      await unlink(targetPath);
      await symlink(sourcePath, targetPath);
      return { type: "created", message: `${shortenPath(targetPath)} (replaced)` };
    }

    if (!isSymlink) {
      // Never overwrite real files/directories
      return {
        type: "warning",
        message: `skipped (${detail}, use --force to replace)`,
        detail,
      };
    }

    return {
      type: "warning",
      message: `skipped (${detail})`,
      detail,
    };
  }

  // Status is "not-synced" - create new symlink
  if (dryRun) {
    return { type: "created", message: `would create → ${shortenPath(targetPath)}` };
  }

  await ensureParentDir(targetPath);
  await symlink(sourcePath, targetPath);
  return { type: "created", message: shortenPath(targetPath) };
}

/**
 * Remove a symlink (only if it points to our source)
 */
export async function removeSymlink(
  sourcePath: string,
  targetPath: string,
  options: { dryRun?: boolean } = {}
): Promise<SyncResult> {
  const { dryRun = false } = options;

  if (!existsSync(targetPath)) {
    return { type: "skipped", message: "does not exist" };
  }

  const { status } = await checkSymlinkStatus(sourcePath, targetPath);

  if (status === "synced" || status === "broken") {
    if (dryRun) {
      return { type: "created", message: `would remove → ${shortenPath(targetPath)}` };
    }
    await unlink(targetPath);
    return { type: "created", message: `removed ${shortenPath(targetPath)}` };
  }

  if (status === "conflict") {
    return { type: "warning", message: "skipped (not our symlink)" };
  }

  return { type: "skipped", message: "not synced" };
}

/**
 * Check if path is a symbolic link
 */
async function isSymbolicLink(path: string): Promise<boolean> {
  try {
    const stats = await lstat(path);
    return stats.isSymbolicLink();
  } catch {
    return false;
  }
}

/**
 * Ensure parent directory exists
 */
async function ensureParentDir(filePath: string): Promise<void> {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
}
