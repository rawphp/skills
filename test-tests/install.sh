#!/bin/bash
# install.sh — Install or update the test-tests skill
# Usage: bash install.sh

SKILL_NAME="test-tests"
SOURCE_DIR="$(cd "$(dirname "$0")" && pwd)"
HUB="${AGENTS_SKILLS_HUB:-$HOME/.agents/skills}"
TARGET_DIR="$HUB/$SKILL_NAME"

if [ -L "$TARGET_DIR" ]; then
    echo "Updating existing symlink..."
    rm "$TARGET_DIR"
elif [ -d "$TARGET_DIR" ]; then
    echo "Replacing existing directory with symlink..."
    rm -rf "$TARGET_DIR"
fi

mkdir -p "$(dirname "$TARGET_DIR")"
ln -s "$SOURCE_DIR" "$TARGET_DIR"

echo "Installed: $TARGET_DIR -> $SOURCE_DIR"
