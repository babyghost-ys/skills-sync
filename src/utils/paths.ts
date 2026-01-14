import { homedir } from "os";
import { resolve, join } from "path";

/**
 * Expand ~ to the user's home directory
 */
export function expandPath(path: string): string {
  if (path.startsWith("~")) {
    return join(homedir(), path.slice(1));
  }
  return path;
}

/**
 * Resolve a path to an absolute path, expanding ~ if present
 */
export function resolvePath(path: string): string {
  return resolve(expandPath(path));
}

/**
 * Get the default skills-sync source directory
 */
export function getSourceDir(): string {
  return resolvePath("~/.skills-sync");
}

/**
 * Get the config file path
 */
export function getConfigPath(): string {
  return join(getSourceDir(), "config.yaml");
}

/**
 * Shorten a path by replacing home directory with ~
 */
export function shortenPath(path: string): string {
  const home = homedir();
  if (path.startsWith(home)) {
    return "~" + path.slice(home.length);
  }
  return path;
}
