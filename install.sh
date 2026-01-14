#!/bin/bash

# skills-sync install script

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Installing skills-sync..."

# Change to project directory
cd "$SCRIPT_DIR"

# Install dependencies
echo "→ Installing dependencies..."
bun install

# Link globally
echo "→ Linking globally..."
bun link

echo ""
echo "✓ Installation complete!"
echo ""
echo "You can now use 'skills-sync' from anywhere."
echo "Run 'skills-sync init' to get started."
