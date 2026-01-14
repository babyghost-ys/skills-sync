import { readFileSync, existsSync } from "fs";
import { parse } from "yaml";
import { getConfigPath, getSourceDir, resolvePath } from "./utils/paths";

export interface TargetConfig {
  path: string;
  enabled: boolean;
}

export interface Config {
  targets: Record<string, TargetConfig>;
  exclude: string[];
}

const DEFAULT_CONFIG: Config = {
  targets: {
    claude: {
      path: "~/.claude/skills",
      enabled: true,
    },
    gemini: {
      path: "~/.gemini/skills",
      enabled: true,
    },
  },
  exclude: [".git", ".DS_Store", "node_modules", "config.yaml"],
};

/**
 * Load configuration from config.yaml
 */
export function loadConfig(): Config {
  const configPath = getConfigPath();

  if (!existsSync(configPath)) {
    throw new ConfigNotFoundError();
  }

  try {
    const content = readFileSync(configPath, "utf-8");
    const parsed = parse(content) as Partial<Config>;

    return {
      targets: { ...DEFAULT_CONFIG.targets, ...parsed.targets },
      exclude: parsed.exclude ?? DEFAULT_CONFIG.exclude,
    };
  } catch (error) {
    if (error instanceof ConfigNotFoundError) {
      throw error;
    }
    throw new ConfigParseError(error instanceof Error ? error.message : String(error));
  }
}

/**
 * Get the default configuration object
 */
export function getDefaultConfig(): Config {
  return DEFAULT_CONFIG;
}

/**
 * Check if source directory exists
 */
export function sourceExists(): boolean {
  return existsSync(getSourceDir());
}

/**
 * Check if config file exists
 */
export function configExists(): boolean {
  return existsSync(getConfigPath());
}

/**
 * Get enabled targets from config
 */
export function getEnabledTargets(config: Config, filterTarget?: string): Record<string, TargetConfig> {
  const result: Record<string, TargetConfig> = {};

  for (const [name, target] of Object.entries(config.targets)) {
    if (target.enabled && (!filterTarget || filterTarget === name)) {
      result[name] = {
        ...target,
        path: resolvePath(target.path),
      };
    }
  }

  return result;
}

export class ConfigNotFoundError extends Error {
  constructor() {
    super("Configuration file not found. Run 'skills-sync init' to create one.");
    this.name = "ConfigNotFoundError";
  }
}

export class ConfigParseError extends Error {
  constructor(details: string) {
    super(`Failed to parse config file: ${details}`);
    this.name = "ConfigParseError";
  }
}
