# skills-sync

Synchronise AI coding assistant skills from a centralised location to multiple targets using symlinks.

## Why?

AI coding assistants like Claude Code, Gemini CLI, and OpenCode each have their own skills/instructions folder. Instead of duplicating your custom skills across multiple locations, `skills-sync` lets you maintain a single source of truth and sync to all targets automatically.

## Installation

Requires [Bun](https://bun.sh/) runtime.

```bash
# Clone the repository
git clone https://github.com/peterleung/skills-sync.git
cd skills-sync

# Run the install script
./install.sh
```

## Quick Start

```bash
# Initialise skills-sync (creates ~/.skills-sync/)
skills-sync init

# Add your skill folders to ~/.skills-sync/skills/
# Each subfolder becomes a skill that gets synced

# Sync all skills to all targets
skills-sync
```

## Commands

### `skills-sync` or `skills-sync sync`

Sync all skills to all enabled targets.

```bash
skills-sync                         # Sync all skills to all targets
skills-sync sync                    # Same as above
skills-sync sync -s my-skill        # Sync specific skill only
skills-sync sync -t claude          # Sync to specific target only
skills-sync sync -d                 # Dry run (preview changes)
skills-sync sync -f                 # Force replace conflicting symlinks
```

When you delete a skill from the source folder, running `skills-sync` will automatically clean up the orphaned symlinks from all targets.

### `skills-sync status`

Show the current sync status of all skills and targets.

```bash
skills-sync status
```

Output shows sync state for each skill/target combination:
- `synced` - Symlink exists and points to correct source
- `not synced` - No symlink exists
- `broken` - Symlink exists but source was deleted
- `conflict` - Path exists but isn't our symlink
- `excluded` - Skill is excluded from this target

### `skills-sync unlink`

Remove symlinks from targets.

```bash
skills-sync unlink              # Remove all symlinks
skills-sync unlink -s my-skill  # Remove specific skill only
skills-sync unlink -t claude    # Remove from specific target only
skills-sync unlink -d           # Dry run
```

### `skills-sync init`

Initialise the skills-sync directory and configuration.

```bash
skills-sync init
```

Creates:
- `~/.skills-sync/skills/` - Place your skill folders here
- `~/.skills-sync/config.yaml` - Configuration file

### `skills-sync targets`

List available preset targets.

```bash
skills-sync targets
```

### `skills-sync add <target>`

Add a preset target to your configuration.

```bash
skills-sync add opencode
```

### `skills-sync remove <target>`

Remove a target from your configuration. This also unlinks all skills from that target.

```bash
skills-sync remove gemini
```

### `skills-sync exclude <skill> <target>`

Exclude a specific skill from syncing to a target.

```bash
skills-sync exclude frontend-design claude
```

### `skills-sync include <skill> <target>`

Re-include a previously excluded skill.

```bash
skills-sync include frontend-design claude
```

### `skills-sync uninstall`

Uninstall skills-sync.

```bash
skills-sync uninstall           # Unlink global command
skills-sync uninstall --purge   # Also remove ~/.skills-sync/ folder
```

## Preset Targets

| Target | Path |
|--------|------|
| `claude` | `~/.claude/skills` |
| `gemini` | `~/.gemini/skills` |
| `opencode` | `~/.config/opencode/skill` |

## Configuration

Configuration is stored in `~/.skills-sync/config.yaml`:

```yaml
targets:
  claude:
    path: ~/.claude/skills
    enabled: true
  gemini:
    path: ~/.gemini/skills
    enabled: true
  opencode:
    path: ~/.config/opencode/skill
    enabled: true
    exclude:
      - some-skill  # Per-target exclusions

exclude:
  - .git
  - .DS_Store
  - node_modules
  - config.yaml
```

## How It Works

1. Place your skill folders in `~/.skills-sync/skills/`
2. Run `skills-sync` to create symlinks in each target's skills directory
3. Each AI assistant sees the skills as if they were in their own folder
4. Edit skills in one place, changes reflect everywhere instantly

```
~/.skills-sync/skills/
├── my-custom-skill/
│   └── instructions.md
└── another-skill/
    └── instructions.md

↓ symlinks created ↓

~/.claude/skills/my-custom-skill → ~/.skills-sync/skills/my-custom-skill
~/.gemini/skills/my-custom-skill → ~/.skills-sync/skills/my-custom-skill
```

## License

MIT
