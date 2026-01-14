import { readFileSync, writeFileSync, existsSync } from "fs";
import { parse, stringify } from "yaml";
import { getConfigPath, getSourceDir, resolvePath } from "./utils/paths";

export interface TargetConfig {
  path: string;
  enabled: boolean;
  exclude?: string[]; // Per-target skill exclusions
}

export interface Config {
  targets: Record<string, TargetConfig>;
  exclude: string[]; // Global exclusions (system files like .git, .DS_Store)
}

const DEFAULT_CONFIG: Config = {
  targets: {
    claude: {
      path: "~/.claude/skills",
      enabled: true,
      exclude: [],
    },
    gemini: {
      path: "~/.gemini/skills",
      enabled: true,
      exclude: [],
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

    // Merge targets with defaults, ensuring exclude arrays exist
    const targets: Record<string, TargetConfig> = {};
    const mergedTargets = { ...DEFAULT_CONFIG.targets, ...parsed.targets };

    for (const [name, target] of Object.entries(mergedTargets)) {
      targets[name] = {
        ...target,
        exclude: target.exclude ?? [],
      };
    }

    return {
      targets,
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
 * Save configuration to config.yaml
 */
export function saveConfig(config: Config): void {
  const configPath = getConfigPath();

  // Clean up empty exclude arrays for cleaner YAML output
  const cleanConfig: Config = {
    targets: {},
    exclude: config.exclude,
  };

  for (const [name, target] of Object.entries(config.targets)) {
    cleanConfig.targets[name] = {
      path: target.path,
      enabled: target.enabled,
      ...(target.exclude && target.exclude.length > 0 ? { exclude: target.exclude } : {}),
    };
  }

  const yamlContent = `# skills-sync configuration
# See https://github.com/your-repo/skills-sync for documentation

${stringify(cleanConfig, { indent: 2, lineWidth: 0 })}`;

  writeFileSync(configPath, yamlContent, "utf-8");
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

/**
 * Check if a skill is excluded from a specific target
 */
export function isSkillExcluded(config: Config, skillName: string, targetName: string): boolean {
  const target = config.targets[targetName];
  if (!target) return false;
  return target.exclude?.includes(skillName) ?? false;
}

/**
 * Add a skill to a target's exclude list
 */
export function excludeSkill(config: Config, skillName: string, targetName: string): boolean {
  const target = config.targets[targetName];
  if (!target) return false;

  if (!target.exclude) {
    target.exclude = [];
  }

  if (!target.exclude.includes(skillName)) {
    target.exclude.push(skillName);
    return true;
  }

  return false; // Already excluded
}

/**
 * Remove a skill from a target's exclude list
 */
export function includeSkill(config: Config, skillName: string, targetName: string): boolean {
  const target = config.targets[targetName];
  if (!target || !target.exclude) return false;

  const index = target.exclude.indexOf(skillName);
  if (index !== -1) {
    target.exclude.splice(index, 1);
    return true;
  }

  return false; // Not in exclude list
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
