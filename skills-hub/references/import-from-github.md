# Import a skill from GitHub into skill dev + hub

## Sparse clone (preferred for monorepos)

```bash
REPO_URL="https://github.com/org/repo.git"
SUBPATH="skills/agent-orchestration/cmux"   # path inside the repo
NAME="cmux"                                 # folder name under ~/EA/skills

TMP=$(mktemp -d)
git clone --depth 1 --filter=blob:none --sparse "$REPO_URL" "$TMP/repo"
git -C "$TMP/repo" sparse-checkout set "$SUBPATH"

DEST="$HOME/EA/skills/$NAME"
mkdir -p "$DEST"
cp -R "$TMP/repo/$SUBPATH/." "$DEST/"

# Hub-aware installer if upstream does not provide one
if [ ! -f "$DEST/install.sh" ] || ! grep -q 'AGENTS_SKILLS_HUB\|.agents/skills' "$DEST/install.sh"; then
  cp "$HOME/EA/skills/skills-hub/references/install-template.sh" "$DEST/install.sh"
  chmod +x "$DEST/install.sh"
fi

# Frontmatter name must match folder name
# Fix SKILL.md name: field or rename DEST if they disagree

"$DEST/install.sh"
rm -rf "$TMP"
```

## Full clone (small single-skill repos)

```bash
git clone --depth 1 "$REPO_URL" "$HOME/EA/skills/$NAME"
# strip .git if you do not want nested repos:
# rm -rf "$HOME/EA/skills/$NAME/.git"
cp "$HOME/EA/skills/skills-hub/references/install-template.sh" \
   "$HOME/EA/skills/$NAME/install.sh"
chmod +x "$HOME/EA/skills/$NAME/install.sh"
"$HOME/EA/skills/$NAME/install.sh"
```

## After import

```bash
ls -la ~/.agents/skills/$NAME
test "$(realpath ~/.claude/skills)" = "$(realpath ~/.agents/skills)"
```

Do not leave the only copy under a client private tree. Dev = `~/EA/skills`; active = hub symlink.
