// Cards for the PR reviewer brief. Every card shares one light background and the same
// enter/exit fade, so card-to-card cuts read as dissolves. Styles are computed from `lt` only.

const BG = 'linear-gradient(160deg, #f5f9fc, #e3edf6)';
const base = (name) => `
  .t-${name} { background: ${BG}; color: var(--ink); overflow: hidden; }
  .t-${name} .hd { position: absolute; left: 120px; right: 120px; top: 92px; font-size: 56px; font-weight: 800; color: var(--primary); letter-spacing: -1px; }
  .t-${name} .hd.mono { font-family: ui-monospace, Menlo, monospace; font-size: 40px; letter-spacing: 0; color: #4b5d78; }
  .t-${name} code, .t-${name} .mono { font-family: ui-monospace, Menlo, monospace; }
`;
// The root stays opaque: the compositor dissolves from the previous card's background, and a
// root fade would show the dark stage between cards. Content rises in on its own cues.
const fadeIO = (el, lt, scene) => {
  el.style.opacity = 1;
  const end = scene.endAt ?? scene.dur; const out = 1 - prog(lt, end - 0.3, 0.3);
  if (out < 1) for (const ch of el.children) ch.style.opacity = parseFloat(ch.style.opacity === '' ? 1 : ch.style.opacity) * out;
};
const rise = (e, lt, t0, d = 0.5, dy = 36) => {
  if (!e) return; const p = easeOut(prog(lt, t0, d));
  e.style.opacity = p; e.style.transform = `translateY(${(1 - p) * dy}px)`;
};
const popIn = (e, lt, t0, d = 0.45) => {
  if (!e) return; const p = prog(lt, t0, d);
  e.style.opacity = p > 0 ? 1 : 0; e.style.transform = `scale(${p > 0 ? 0.6 + 0.4 * back(p) : 0}) rotate(-2deg)`;
};

// shift: the old default identity, then the problem with it.
addCard('shift', {
  css: base('shift') + `
    .t-shift .hdr { position: absolute; left: 120px; top: 220px; width: 1680px; background: #fff; border-radius: 22px; padding: 30px 44px; box-shadow: 0 24px 60px rgba(20,40,70,.16); font-size: 38px; }
    .t-shift .hdr .k { color: #5b6b82; font-weight: 600; } .t-shift .hdr .v { color: var(--primary); font-weight: 800; }
    .t-shift .lbl { position: absolute; left: 120px; top: 400px; font-size: 28px; letter-spacing: 6px; font-weight: 700; color: #c0392b; }
    .t-shift .old { position: absolute; left: 120px; top: 450px; width: 1680px; background: #1c2a3f; color: #e8eef7; border-radius: 22px; padding: 36px 44px; font-size: 34px; line-height: 1.5; }
    .t-shift .old .note { margin-top: 12px; color: var(--highlight); font-size: 28px; font-family: Inter, sans-serif; font-style: italic; }
    .t-shift .punch { position: absolute; left: 50%; top: 790px; transform: translate(-50%, -50%); background: var(--highlight); color: var(--ink); font-family: Caveat, cursive; font-size: 68px; font-weight: 700; padding: 14px 40px; border-radius: 14px; box-shadow: 0 18px 40px rgba(0,0,0,.2); white-space: nowrap; }`,
  build: (c) => `<div class="hd">${esc(c.heading)}</div>
    <div class="hdr"><span class="k">${esc(c.header.label)}</span> &nbsp; <span class="v mono">${esc(c.header.text)}</span></div>
    <div class="lbl">${esc(c.before.label)}</div>
    <div class="old"><code>${esc(c.before.code)}</code><div class="note">${esc(c.before.note)}</div></div>
    <div class="punch">${esc(c.punch.text)}</div>`,
  draw(el, c, lt, scene) {
    this.enter(el, c, lt); fadeIO(el, lt, scene);
  },
  enter(el, c, lt) {
    rise(el.querySelector('.hd'), lt, 0.1);
    rise(el.querySelector('.hdr'), lt, c.header.t);
    rise(el.querySelector('.lbl'), lt, c.before.t - 0.1);
    rise(el.querySelector('.old'), lt, c.before.t);
    const p = el.querySelector('.punch'); const q = prog(lt, c.punch.t, 0.4);
    p.style.opacity = q > 0 ? 1 : 0; p.style.transform = `translate(-50%,-50%) rotate(-3deg) scale(${q > 0 ? 0.5 + 0.5 * back(q) : 0})`;
  },
});

// flow: two lanes, each an arrow from a path to the identity it sends.
addCard('flow', {
  css: base('flow') + `
    .t-flow .lane { position: absolute; left: 120px; width: 1680px; background: #fff; border-radius: 24px; box-shadow: 0 24px 60px rgba(20,40,70,.14); padding: 30px 44px; }
    .t-flow .row { display: flex; align-items: center; gap: 30px; }
    .t-flow .path { width: 480px; } .t-flow .path .t { font-size: 40px; font-weight: 800; color: var(--ink); } .t-flow .path .s { font-size: 26px; color: #5b6b82; font-weight: 600; margin-top: 4px; }
    .t-flow .arr { font-size: 54px; color: var(--accent); font-weight: 800; }
    .t-flow .to { flex: 1; background: color-mix(in srgb, var(--accent) 16%, #fff); border: 3px solid var(--accent); border-radius: 16px; padding: 18px 28px; font-size: 36px; font-weight: 800; color: color-mix(in srgb, var(--accent) 60%, #000); }
    .t-flow .notes { margin-top: 18px; display: flex; flex-direction: column; gap: 10px; }
    .t-flow .n { font-size: 27px; color: #26374f; font-weight: 600; padding-left: 18px; border-left: 6px solid var(--highlight); }`,
  build: (c) => `<div class="hd">${esc(c.heading)}</div>${c.lanes.map((l, i) => `
    <div class="lane" style="top:${200 + i * 400}px">
      <div class="row"><div class="path"><div class="t">${esc(l.title)}</div><div class="s">${esc(l.sub)}</div></div><div class="arr">→</div><div class="to">${esc(l.to)}</div></div>
      <div class="notes">${l.notes.map((n) => `<div class="n">${esc(n.text)}</div>`).join('')}</div>
    </div>`).join('')}`,
  draw(el, c, lt, scene) {
    this.enter(el, c, lt); fadeIO(el, lt, scene);
  },
  enter(el, c, lt) {
    rise(el.querySelector('.hd'), lt, 0.1);
    [...el.querySelectorAll('.lane')].forEach((e, i) => {
      rise(e, lt, c.lanes[i].t - 0.1, 0.55);
      [...e.querySelectorAll('.n')].forEach((n, j) => rise(n, lt, c.lanes[i].notes[j].t, 0.4, 20));
    });
  },
});

// code: up to two code blocks, each with a highlighted line range.
addCard('code', {
  css: base('code') + `
    .t-code .blk { position: absolute; left: 120px; width: 1680px; background: #1c2a3f; border-radius: 22px; padding: 26px 36px; box-shadow: 0 24px 60px rgba(20,40,70,.25); }
    .t-code .ln { font-family: ui-monospace, Menlo, monospace; font-size: 27px; line-height: 1.5; color: #d7e1ee; white-space: pre; padding: 0 12px; border-radius: 8px; }
    .t-code .ln.mk { background: color-mix(in srgb, var(--highlight) 28%, transparent); color: #fff; }`,
  build: (c) => `<div class="hd mono">${esc(c.heading)}</div>${c.blocks.map((b, i) => `
    <div class="blk" style="top:${190 + i * 380}px">${b.lines.map((l, j) => `<div class="ln" data-i="${j}">${esc(l) || ' '}</div>`).join('')}</div>`).join('')}`,
  draw(el, c, lt, scene) {
    this.enter(el, c, lt); fadeIO(el, lt, scene);
  },
  enter(el, c, lt) {
    rise(el.querySelector('.hd'), lt, 0.1);
    [...el.querySelectorAll('.blk')].forEach((e, i) => {
      const b = c.blocks[i]; rise(e, lt, b.t - 0.1, 0.55);
      const on = lt >= b.mark.t;
      [...e.querySelectorAll('.ln')].forEach((ln, j) => ln.classList.toggle('mk', on && j >= b.mark.from && j <= b.mark.to));
    });
  },
});

// job: rows that slide in, like the built-in stack but with a sub line long enough for a sentence.
addCard('job', {
  css: base('job') + `
    .t-job .r { position: absolute; left: 120px; width: 1680px; background: #fff; border-radius: 22px; padding: 28px 40px; box-shadow: 0 24px 60px rgba(20,40,70,.16); display: flex; gap: 32px; align-items: center; }
    .t-job .ic { width: 100px; height: 100px; border-radius: 22px; display: grid; place-items: center; font-size: 56px; flex: none; }
    .t-job .t { font-size: 38px; font-weight: 800; color: var(--ink); letter-spacing: -.5px; }
    .t-job .s { font-size: 26px; color: #4b5d78; font-weight: 600; margin-top: 6px; }`,
  build: (c) => `<div class="hd">${esc(c.heading)}</div>${c.rows.map((r, i) => { const tone = r.tone === 'highlight' ? 'var(--highlight)' : 'var(--accent)';
    return `<div class="r" style="top:${210 + i * 220}px"><div class="ic" style="background:color-mix(in srgb, ${tone} 20%, transparent)">${esc(r.icon)}</div><div><div class="t">${esc(r.title)}</div><div class="s">${esc(r.sub)}</div></div></div>`; }).join('')}`,
  draw(el, c, lt, scene) {
    this.enter(el, c, lt); fadeIO(el, lt, scene);
  },
  enter(el, c, lt) {
    rise(el.querySelector('.hd'), lt, 0.1);
    [...el.querySelectorAll('.r')].forEach((e, i) => {
      const p = prog(lt, c.rows[i].t - 0.1, 0.5); e.style.opacity = p > 0 ? 1 : 0;
      e.style.transform = `translateX(${(1 - easeOut(p)) * 220}px) scale(${0.9 + 0.1 * easeOut(p)})`;
    });
  },
});

// look: the files a reviewer should open, then the review outcome and the deploy check.
addCard('look', {
  css: base('look') + `
    .t-look .f { position: absolute; left: 120px; width: 1680px; top: 0; background: #fff; border-radius: 18px; padding: 20px 36px; box-shadow: 0 18px 44px rgba(20,40,70,.14); display: flex; align-items: center; gap: 28px; }
    .t-look .f .p { font-family: ui-monospace, Menlo, monospace; font-size: 24px; color: #4b5d78; width: 660px; }
    .t-look .f .sym { font-family: ui-monospace, Menlo, monospace; font-size: 31px; font-weight: 700; color: var(--primary); width: 300px; }
    .t-look .f .why { font-size: 26px; color: #26374f; font-weight: 600; flex: 1; }
    .t-look .rv { position: absolute; left: 120px; width: 1680px; top: 608px; background: color-mix(in srgb, var(--accent) 16%, #fff); border: 3px solid var(--accent); border-radius: 18px; padding: 20px 36px; font-size: 32px; font-weight: 800; color: color-mix(in srgb, var(--accent) 60%, #000); }
    .t-look .dp { position: absolute; left: 120px; width: 1680px; top: 720px; background: color-mix(in srgb, var(--highlight) 24%, #fff); border: 3px solid var(--highlight); border-radius: 18px; padding: 20px 36px; font-size: 30px; font-weight: 700; color: #5a4300; line-height: 1.35; }`,
  build: (c) => `<div class="hd">${esc(c.heading)}</div>${c.files.map((f, i) => `
    <div class="f" style="top:${200 + i * 126}px"><div class="p">${esc(f.path)}</div><div class="sym">${esc(f.sym)}</div><div class="why">${esc(f.why)}</div></div>`).join('')}
    <div class="rv">${esc(c.review.text)}</div><div class="dp">${esc(c.deploy.text)}</div>`,
  draw(el, c, lt, scene) {
    this.enter(el, c, lt); fadeIO(el, lt, scene);
  },
  enter(el, c, lt) {
    rise(el.querySelector('.hd'), lt, 0.1);
    [...el.querySelectorAll('.f')].forEach((e, i) => rise(e, lt, c.files[i].t - 0.1, 0.45, 24));
    rise(el.querySelector('.rv'), lt, c.review.t - 0.1);
    rise(el.querySelector('.dp'), lt, c.deploy.t - 0.1);
  },
});

// gates: the end card, brand background, three gate results.
addCard('gates', {
  css: `
    .t-gates { background: var(--primary); color: #fff; overflow: hidden; }
    .t-gates .wrap { position: absolute; left: 0; right: 0; top: 200px; text-align: center; }
    .t-gates .ey { font-size: 26px; letter-spacing: 8px; font-weight: 700; color: var(--accent); }
    .t-gates .big { font-size: 112px; font-weight: 800; letter-spacing: -3px; margin-top: 14px; }
    .t-gates .g { display: flex; justify-content: center; gap: 40px; margin-top: 60px; }
    .t-gates .gate { background: rgba(255,255,255,.08); border: 2px solid rgba(255,255,255,.18); border-radius: 22px; padding: 26px 44px; min-width: 420px; }
    .t-gates .gate .l { font-size: 24px; letter-spacing: 4px; color: var(--accent2); font-weight: 700; }
    .t-gates .gate .v { font-size: 40px; font-weight: 800; margin-top: 8px; color: var(--highlight); }
    .t-gates .note { margin-top: 54px; font-size: 30px; color: #cfe2f5; font-weight: 600; }
    .t-gates .credits { position: absolute; left: 0; right: 0; bottom: 56px; text-align: center; font-size: 22px; color: #9fb7d2; }`,
  build: (c) => `<div class="wrap"><div class="ey">${esc(c.eyebrow)}</div><div class="big">${esc(c.title)}</div>
    <div class="g">${c.gates.map((g) => `<div class="gate"><div class="l">${esc(g.label)}</div><div class="v">${esc(g.value)}</div></div>`).join('')}</div>
    <div class="note">${esc(c.note)}</div></div><div class="credits">${(TL.credits || []).map(esc).join('<br>')}</div>`,
  draw(el, c, lt) {
    el.style.opacity = easeOut(prog(lt, 0, 0.6));
    rise(el.querySelector('.ey'), lt, 0.2); rise(el.querySelector('.big'), lt, 0.35, 0.7);
    [...el.querySelectorAll('.gate')].forEach((e, i) => rise(e, lt, 1.0 + i * 0.25, 0.5, 30));
    rise(el.querySelector('.note'), lt, 2.0);
  },
});
