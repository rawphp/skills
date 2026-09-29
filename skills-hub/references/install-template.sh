#!/usr/bin/env bash
# Symlink this skill into a skills directory (default ~/.agents/skills).
# Claude Code only: AGENTS_SKILLS_HUB=~/.claude/skills ./install.sh
set -euo pipefail
SOURCE_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILL_NAME="$(basename "$SOURCE_DIR")"
HUB="${AGENTS_SKILLS_HUB:-$HOME/.agents/skills}"
target="$HUB/$SKILL_NAME"

mkdir -p "$HUB"
if [ -L "$target" ]; then
  rm "$target"
elif [ -e "$target" ]; then
  mkdir -p "$HUB/.backups"
  mv "$target" "$HUB/.backups/$SKILL_NAME.bak.$(date +%s)"
  echo "Backed up existing $SKILL_NAME"
fi
ln -s "$SOURCE_DIR" "$target"
echo "Installed $SKILL_NAME -> $target (skills hub)"
