# product-intro-video field lessons

Lessons from real runs that change how the next run goes. Apply while briefing, scripting and recording.

No pending field lessons. New lessons may be appended by the post-skill field-lessons loop.

## All-card videos: scope shared CSS to each `.t-<name>` root (2026-10-07, reviewer comparison)

A comparison or explainer with no live app is twelve `addCard` templates and no `rec.mjs`. A shared base stylesheet (`.dk .in`, `.dk .stk`) scoped to a class the compositor never puts on the card root fails silently: headings and stickers render as unstyled flow text that only shows as a faint line under the captions in stills. Generate the base per template (`base(name)` with `.t-${name}`) and preview one still per scene before the full render. Cards have no sticker layer, so a joke note is a `.stk` element inside the card, popped from `lt` with `back()`, placed clear of the bottom 140 px.
