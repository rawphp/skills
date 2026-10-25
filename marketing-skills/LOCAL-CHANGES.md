# Local changes to the vendored marketing skills

This folder is a vendored copy of an upstream repo. These edits are local; re-apply them after an upstream pull.

## 25 Oct 2026

- `skills/video/references/avatar-script.md`: added. The body of the retired `ai-avatar-script` skill (short-form 15–60 s avatar and talking-head scripts), front matter removed, first line `# Short-form avatar script (15–60 s)`.
- `skills/video/SKILL.md` description: appended "Also for a 15–60 s avatar or talking-head script (HeyGen, Synthesia, Captions): read references/avatar-script.md."
- `skills/video/SKILL.md` body: first line after the front matter is the one-way handoff line to `product-video` (narrated product video requests go up; `product-video` calls this skill's tools by path and never invokes it back).
