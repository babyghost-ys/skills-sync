#!/bin/bash

# skills-sync uninstall script

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILLS_SYNC_DIR="$HOME/.skills-sync"

show_help() {
    echo "Usage: ./uninstall.sh [options]"
    echo ""
    echo "Options:"
    echo "  --purge    Remove ~/.skills-sync/ folder including all skills and config"
    echo "  --help     Show this help message"
    echo ""
    echo "By default, only unlinks the global command. Your skills and config are preserved."
}

PURGE=false

# Parse arguments
for arg in "$@"; do
    case $arg in
        --purge)
            PURGE=true
            shift
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        *)
            echo "Unknown option: $arg"
            show_help
            exit 1
            ;;
    esac
done

echo "Uninstalling skills-sync..."

# Change to project directory
cd "$SCRIPT_DIR"

# First run skills-sync unlink to remove symlinks from targets
if command -v skills-sync &> /dev/null; then
    echo "→ Removing symlinks from targets..."
    skills-sync unlink 2>/dev/null || true
fi

# Unlink globally
echo "→ Unlinking global command..."
bun unlink 2>/dev/null || true

# Remove from bun's global bin if exists
BUN_BIN="$HOME/.bun/bin/skills-sync"
if [ -L "$BUN_BIN" ] || [ -f "$BUN_BIN" ]; then
    rm -f "$BUN_BIN"
    echo "→ Removed $BUN_BIN"
fi

echo ""
echo "✓ Global command unlinked"

# Optionally remove skills-sync directory
if [ "$PURGE" = true ]; then
    echo ""
    if [ -d "$SKILLS_SYNC_DIR" ]; then
        echo "⚠ Removing $SKILLS_SYNC_DIR..."
        rm -rf "$SKILLS_SYNC_DIR"
        echo "✓ Removed $SKILLS_SYNC_DIR"
    else
        echo "→ $SKILLS_SYNC_DIR does not exist"
    fi
else
    echo ""
    echo "Note: Your skills and config at $SKILLS_SYNC_DIR have been preserved."
    echo "      Use --purge to remove them as well."
fi

echo ""
echo "✓ Uninstallation complete!"
