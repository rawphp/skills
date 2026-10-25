// Example house cards: paper grid, dark open and close, one accent. The default house preset for product-video; a brand's own folder replaces it.
// Card fields beyond the engine's: walks (walk count, on the title and chapter cards) and fig (the small figure label).
// Fonts: Space Grotesk, JetBrains Mono, Instrument Serif. Everything is a function of lt (seconds into the scene).
(() => {
  const fonts = document.createElement('link');
  fonts.rel = 'stylesheet';
  fonts.href = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=JetBrains+Mono:wght@400;700&family=Instrument+Serif:ital@0;1&display=block';
  document.head.appendChild(fonts);
  const setup0 = window.setup;
  window.setup = async (tl) => {
    await setup0(tl);
    for (const f of ['700 40px "Space Grotesk"', '500 40px "Space Grotesk"', '400 20px "JetBrains Mono"', '700 20px "JetBrains Mono"', 'italic 400 40px "Instrument Serif"']) await document.fonts.load(f);
  };

  const HOUSE = { teal: '#0f766e', tealDark: '#115e59', tealMid: '#14b8a6', tealSoft: '#ccfbf1', navy: '#1e293b', navyMid: '#475569', paper: '#f8fafc', ink: '#0f172a', red: '#dc2626', yellow: '#f59e0b', sky: '#7dd3fc' };
  const GRID = (c, a1, a2) => `linear-gradient(${c(a2)} 2px, transparent 2px) 0 0/200px 200px, linear-gradient(90deg, ${c(a2)} 2px, transparent 2px) 0 0/200px 200px,
    linear-gradient(${c(a1)} 1px, transparent 1px) 0 0/40px 40px, linear-gradient(90deg, ${c(a1)} 1px, transparent 1px) 0 0/40px 40px`;
  const inkA = (a) => `rgba(15,23,42,${a})`, whiteA = (a) => `rgba(255,255,255,${a})`;
  const PAPER = `${GRID(inkA, 0.05, 0.085)}, ${HOUSE.paper}`;
  const NAVY = `${GRID(whiteA, 0.045, 0.075)}, ${HOUSE.navy}`;
  const base = (name, bg) => `.t-${name} { background: ${bg}; overflow: hidden; font-family: 'Space Grotesk', sans-serif; color: ${HOUSE.ink}; }
    .t-${name} .h-fig { position: absolute; left: 70px; top: 62px; font: 700 22px 'JetBrains Mono', monospace; letter-spacing: 2px; }
    .t-${name} .h-fig span { font-weight: 400; opacity: .6; margin-left: 18px; }`;
  const up = (e, p, dy = 40) => { e.style.opacity = p; e.style.transform = `translateY(${(1 - p) * dy}px)`; };
  const wipe = (el, lt) => { const p = ease(prog(lt, 0, 0.42)); el.style.clipPath = `inset(0 0 0 ${(1 - p) * 100}%)`; };
  const stampIn = (e, lt, t, rot = -7) => {
    const p = prog(lt, t - 0.05, 0.28);
    e.style.opacity = p > 0 ? 1 : 0;
    e.style.transform = `translate(-50%,-50%) rotate(${rot}deg) scale(${p > 0 ? 2.2 - 1.2 * easeOut(p) : 0})`;
  };

  // Cold open: two records of the same thing in two systems, matched by name.
  addCard('house-open', {
    css: `${base('house-open', NAVY)}
      .t-house-open { color: #fff; }
      .t-house-open .h-rec { position: absolute; top: 330px; width: 600px; height: 300px; border-radius: 22px; background: #fff; color: ${HOUSE.ink};
        box-shadow: 0 26px 60px rgba(0,0,0,.35); padding: 44px 48px; }
      .t-house-open .h-rec.a { left: 160px; } .t-house-open .h-rec.b { left: 1160px; }
      .t-house-open .h-sys { display: inline-block; font: 700 24px 'JetBrains Mono', monospace; letter-spacing: 2px; padding: 8px 16px; border-radius: 8px; background: ${HOUSE.tealSoft}; color: ${HOUSE.teal}; }
      .t-house-open .h-rec.b .h-sys { background: #ffe9c2; color: #9a5a00; }
      .t-house-open .h-name { margin-top: 34px; font-size: 54px; font-weight: 700; line-height: 1.08; letter-spacing: -1px; }
      .t-house-open .h-line { position: absolute; left: 760px; top: 478px; width: 400px; height: 0; border-top: 6px dashed ${HOUSE.sky}; }
      .t-house-open .h-rule { position: absolute; left: 0; right: 0; top: 506px; text-align: center; font: 700 26px 'JetBrains Mono', monospace; color: ${HOUSE.sky}; white-space: nowrap; }
      .t-house-open .h-stamp { position: absolute; left: 960px; top: 720px; font: 700 76px 'Space Grotesk'; letter-spacing: 6px; color: ${HOUSE.red}; border: 9px solid ${HOUSE.red};
        border-radius: 16px; padding: 6px 34px; white-space: nowrap; background: rgba(30,52,82,.5); }`,
    build: (c) => `<div class="h-fig">FIG_00<span>${esc(c.fig || 'BEFORE')}</span></div>
      <div class="h-rec a"><div class="h-sys">${esc(c.a.sys)}</div><div class="h-name">${esc(c.a.name)}</div></div>
      <div class="h-rec b"><div class="h-sys">${esc(c.b.sys)}</div><div class="h-name">${esc(c.b.name)}</div></div>
      <div class="h-line"></div><div class="h-rule">${esc(c.rule.text)}</div><div class="h-stamp">${esc(c.stamp.text)}</div>`,
    draw(el, c, lt) {
      el.querySelector('.h-fig').style.opacity = easeOut(prog(lt, 0.1, 0.5));
      const slide = (sel, t, dx) => { const e = el.querySelector(sel); const p = easeOut(prog(lt, t - 0.15, 0.55)); e.style.opacity = p; e.style.transform = `translateX(${(1 - p) * dx}px) rotate(${(1 - p) * (dx > 0 ? 3 : -3)}deg)`; };
      slide('.h-rec.a', Math.min(c.a.t, 0.6), -260); slide('.h-rec.b', c.b.t, 260);
      const line = el.querySelector('.h-line'); const lp = prog(lt, c.rule.t - 0.1, 0.5);
      line.style.width = `${400 * ease(lp)}px`;
      const red = lt > c.stamp.t - 0.05; line.style.borderTopColor = red ? HOUSE.red : HOUSE.sky;
      up(el.querySelector('.h-rule'), easeOut(prog(lt, c.rule.t, 0.45)), 20);
      el.querySelector('.h-rule').style.color = red ? HOUSE.red : HOUSE.sky;
      // the two records eye each other, then drift apart once they're strangers
      const apart = easeOut(prog(lt, c.stamp.t, 0.8)) * 40;
      el.querySelector('.h-rec.a').style.marginLeft = `${-apart}px`; el.querySelector('.h-rec.b').style.marginLeft = `${apart}px`;
      stampIn(el.querySelector('.h-stamp'), lt, c.stamp.t);
      const sc = c.scratchT ?? 1e9;
      const shake = lt > sc && lt < sc + 0.35 ? Math.sin((lt - sc) * 90) * 12 * (1 - (lt - sc) / 0.35) : 0;
      el.style.transform = `translateX(${shake}px)`;
      el.style.filter = lt > sc ? `grayscale(${prog(lt, sc, 0.2)}) blur(${3 * prog(lt, sc, 0.25)}px)` : '';
    },
  });

  // Cold open for a later phase: three failures, then a stamp. Not the two-record card.
  addCard('house-villain', {
    css: `${base('house-villain', NAVY)}
      .t-house-villain { color: #fff; }
      .t-house-villain .h-rows { position: absolute; left: 260px; right: 260px; top: 240px; display: flex; flex-direction: column; gap: 28px; }
      .t-house-villain .h-row { display: flex; align-items: baseline; gap: 36px; background: #fff; color: ${HOUSE.ink}; border-radius: 18px; padding: 22px 36px; box-shadow: 0 18px 40px rgba(0,0,0,.28); }
      .t-house-villain .h-k { font: 700 28px 'JetBrains Mono', monospace; letter-spacing: 3px; color: ${HOUSE.teal}; width: 280px; }
      .t-house-villain .h-v { font-size: 64px; font-weight: 700; letter-spacing: -2px; }
      .t-house-villain .h-stamp { position: absolute; left: 50%; top: 760px; font: 700 84px 'Space Grotesk'; letter-spacing: 8px; color: ${HOUSE.red}; border: 9px solid ${HOUSE.red};
        border-radius: 16px; padding: 4px 36px; white-space: nowrap; background: rgba(30,52,82,.55); }`,
    build: (c) => `<div class="h-fig">FIG_00<span>${esc(c.fig || 'BEFORE')}</span></div>
      <div class="h-rows">${c.lines.map((l) => `<div class="h-row"><div class="h-k">${esc(l.k)}</div><div class="h-v">${esc(l.v)}</div></div>`).join('')}</div>
      <div class="h-stamp">${esc(c.stamp.text)}</div>`,
    draw(el, c, lt) {
      el.querySelector('.h-fig').style.opacity = easeOut(prog(lt, 0.05, 0.4));
      [...el.querySelectorAll('.h-row')].forEach((e, i) => {
        const p = easeOut(prog(lt, Math.max(0.15, c.lines[i].t - 0.05), 0.4));
        e.style.opacity = p; e.style.transform = `translateX(${(1 - p) * (i % 2 ? 80 : -80)}px)`;
      });
      stampIn(el.querySelector('.h-stamp'), lt, c.stamp.t, -8);
      const sc = c.scratchT ?? 1e9;
      const shake = lt > sc && lt < sc + 0.35 ? Math.sin((lt - sc) * 90) * 10 * (1 - (lt - sc) / 0.35) : 0;
      el.style.transform = `translateX(${shake}px)`;
      el.style.filter = lt > sc ? `grayscale(${prog(lt, sc, 0.2)}) blur(${3 * prog(lt, sc, 0.25)}px)` : '';
    },
  });

  // Title: navy, the eight walks as eight squares.
  addCard('house-title', {
    css: `${base('house-title', NAVY)}
      .t-house-title { color: #fff; }
      .t-house-title .h-eye { position: absolute; left: 0; right: 0; top: 300px; text-align: center; font: 700 28px 'JetBrains Mono', monospace; letter-spacing: 6px; color: ${HOUSE.tealMid}; }
      .t-house-title .h-big { position: absolute; left: 0; right: 0; top: 350px; text-align: center; font-size: 168px; font-weight: 700; letter-spacing: -6px; }
      .t-house-title .h-sub { position: absolute; left: 0; right: 0; top: 570px; text-align: center; font: italic 400 64px 'Instrument Serif', serif; color: ${HOUSE.sky}; }
      .t-house-title .h-row { position: absolute; left: 50%; top: 700px; transform: translateX(-50%); display: flex; gap: 18px; align-items: center; }
      .t-house-title .h-sq { width: 44px; height: 44px; border-radius: 10px; background: ${HOUSE.teal}; border: 3px solid ${HOUSE.tealMid}; }
      .t-house-title .h-pill { margin-left: 26px; padding: 10px 26px; border-radius: 999px; background: ${HOUSE.yellow}; color: ${HOUSE.ink}; font: 700 30px 'JetBrains Mono', monospace; white-space: nowrap; }`,
    build: (c) => `<div class="h-fig">FIG_01<span>THE BUILD</span></div><div class="h-eye">${esc(c.eyebrow)}</div><div class="h-big">${esc(c.title)}</div>
      <div class="h-sub">${esc(c.sub.text)}</div><div class="h-row">${'<div class="h-sq"></div>'.repeat(c.walks)}<div class="h-pill">${esc(c.pill.text)}</div></div>`,
    draw(el, c, lt) {
      el.querySelector('.h-fig').style.opacity = easeOut(prog(lt, 0.1, 0.5));
      up(el.querySelector('.h-eye'), easeOut(prog(lt, 0.05, 0.5)));
      const b = el.querySelector('.h-big'); const p = easeOut(prog(lt, 0.15, 0.6));
      b.style.opacity = p; b.style.transform = `translateY(${(1 - p) * 50}px) scale(${1 + 0.012 * lt})`;
      up(el.querySelector('.h-sub'), easeOut(prog(lt, c.sub.t, 0.5)));
      [...el.querySelectorAll('.h-sq')].forEach((q, i) => { const a = prog(lt, c.pill.t - 0.3 + i * 0.07, 0.3); q.style.opacity = a > 0 ? 1 : 0; q.style.transform = `scale(${a > 0 ? 0.3 + 0.7 * back(a) : 0})`; });
      const pl = el.querySelector('.h-pill'); const a = prog(lt, c.pill.t + 0.4, 0.4); pl.style.opacity = a > 0 ? 1 : 0; pl.style.transform = `scale(${a > 0 ? 0.4 + 0.6 * back(a) : 0}) rotate(-2deg)`;
    },
  });

  // Chapter card: one per walk, wiped in from the right over the last frame of the walk before.
  addCard('house-chapter', {
    css: `${base('house-chapter', PAPER)}
      .t-house-chapter .h-num { position: absolute; left: 110px; top: 190px; font-size: 440px; font-weight: 700; letter-spacing: -24px; line-height: 1; color: transparent; -webkit-text-stroke: 6px ${HOUSE.teal}; }
      .t-house-chapter .h-k { position: absolute; left: 760px; top: 330px; font: 700 28px 'JetBrains Mono', monospace; letter-spacing: 4px; color: ${HOUSE.teal}; }
      .t-house-chapter .h-t { position: absolute; left: 752px; top: 372px; font-size: 118px; font-weight: 700; letter-spacing: -4px; color: ${HOUSE.navy}; white-space: nowrap; }
      .t-house-chapter .h-a { position: absolute; left: 760px; top: 530px; font: italic 400 62px 'Instrument Serif', serif; color: ${HOUSE.tealDark}; white-space: nowrap; }
      .t-house-chapter .h-bar { position: absolute; left: 760px; top: 680px; display: flex; gap: 12px; }
      .t-house-chapter .h-seg { width: 92px; height: 14px; border-radius: 7px; background: rgba(15,23,42,.12); }
      .t-house-chapter .h-edge { position: absolute; top: 0; bottom: 0; width: 14px; background: ${HOUSE.teal}; }`,
    build: (c) => `<div class="h-fig">FIG_${String(c.num + 1).padStart(2, '0')}<span>WALK ${c.num} OF ${c.walks}</span></div>
      <div class="h-num">0${c.num}</div><div class="h-k">WALK 0${c.num} / 0${c.walks}</div><div class="h-t">${esc(c.title)}</div><div class="h-a">${esc(c.aside.text)}</div>
      <div class="h-bar">${[...Array(c.walks).keys()].map(() => '<div class="h-seg"></div>').join('')}</div><div class="h-edge"></div>`,
    draw(el, c, lt) {
      wipe(el, lt);
      const wp = ease(prog(lt, 0, 0.42)); const edge = el.querySelector('.h-edge');
      edge.style.left = `${(1 - wp) * 1920 - 7}px`; edge.style.opacity = 1 - prog(lt, 0.4, 0.2);
      const n = el.querySelector('.h-num'); const np = easeOut(prog(lt, 0.1, 0.6));
      n.style.opacity = np; n.style.transform = `translateX(${(1 - np) * -60 + lt * 6}px)`;
      up(el.querySelector('.h-k'), easeOut(prog(lt, 0.2, 0.4)), 20);
      const t = el.querySelector('.h-t'); const tp = easeOut(prog(lt, 0.25, 0.5)); t.style.opacity = tp; t.style.transform = `translateX(${(1 - tp) * 60 - lt * 4}px)`;
      up(el.querySelector('.h-a'), easeOut(prog(lt, Math.max(0.5, c.aside.t), 0.45)), 24);
      [...el.querySelectorAll('.h-seg')].forEach((s, i) => {
        const on = i + 1 < c.num ? 1 : i + 1 === c.num ? prog(lt, 0.45, 0.4) : 0;
        s.style.background = i + 1 < c.num ? HOUSE.navy : i + 1 === c.num ? `color-mix(in srgb, ${HOUSE.teal} ${on * 100}%, rgba(15,23,42,.12))` : 'rgba(15,23,42,.12)';
      });
    },
  });

  // Recap: seven walks tick off, then the running tally.
  addCard('house-recap', {
    css: `${base('house-recap', PAPER)}
      .t-house-recap .h-h { position: absolute; left: 140px; top: 130px; font-size: 88px; font-weight: 700; letter-spacing: -3px; color: ${HOUSE.navy}; }
      .t-house-recap .h-tile { position: absolute; width: 790px; height: 112px; border-radius: 18px; background: #fff; border: 3px solid rgba(15,23,42,.1);
        display: flex; align-items: center; gap: 26px; padding: 0 28px; box-shadow: 0 12px 28px rgba(20,40,70,.08); }
      .t-house-recap .h-n { flex: none; width: 60px; height: 60px; border-radius: 14px; background: ${HOUSE.navy}; color: #fff; font: 700 28px 'JetBrains Mono', monospace; display: grid; place-items: center; }
      .t-house-recap .h-x { font-size: 38px; font-weight: 700; color: ${HOUSE.ink}; letter-spacing: -.5px; white-space: nowrap; flex: 1; }
      .t-house-recap .h-ok { flex: none; width: 54px; height: 54px; border-radius: 50%; background: ${HOUSE.teal}; color: #fff; display: grid; place-items: center; font-size: 34px; font-weight: 700; }
      .t-house-recap .h-stamp { position: absolute; left: 1430px; top: 175px; font: 700 34px 'JetBrains Mono', monospace; color: ${HOUSE.teal}; border: 6px solid ${HOUSE.teal};
        border-radius: 14px; padding: 10px 22px; white-space: nowrap; background: rgba(246,244,238,.92); }`,
    build: (c) => `<div class="h-fig">FIG_09<span>${esc(c.fig || 'AT A GLANCE')}</span></div><div class="h-h">${esc(c.heading)}</div>
      ${c.items.map((it, i) => `<div class="h-tile" style="left:${140 + (i >= 4 ? 850 : 0)}px;top:${300 + (i % 4) * 136}px"><div class="h-n">0${it.num}</div><div class="h-x">${esc(it.text)}</div><div class="h-ok">✓</div></div>`).join('')}
      <div class="h-stamp">${esc(c.stamp.text)}</div>`,
    draw(el, c, lt) {
      wipe(el, lt);
      el.querySelector('.h-fig').style.opacity = easeOut(prog(lt, 0.2, 0.5));
      up(el.querySelector('.h-h'), easeOut(prog(lt, 0.2, 0.5)));
      [...el.querySelectorAll('.h-tile')].forEach((e, i) => {
        const p = prog(lt, c.items[i].t - 0.15, 0.45); e.style.opacity = easeOut(p); e.style.transform = `translateY(${(1 - easeOut(p)) * 30}px)`;
        const k = prog(lt, c.items[i].t + 0.2, 0.35); const ok = e.querySelector('.h-ok'); ok.style.transform = `scale(${k > 0 ? back(k) : 0})`;
      });
      stampIn(el.querySelector('.h-stamp'), lt, c.stamp.t, -4);
    },
  });

  // Close: navy, the claim, the credits.
  addCard('house-close', {
    css: `${base('house-close', NAVY)}
      .t-house-close { color: #fff; }
      .t-house-close .h-eye { position: absolute; left: 0; right: 0; top: 280px; text-align: center; font: 700 28px 'JetBrains Mono', monospace; letter-spacing: 6px; color: ${HOUSE.tealMid}; }
      .t-house-close .h-big { position: absolute; left: 0; right: 0; top: 330px; text-align: center; font-size: 150px; font-weight: 700; letter-spacing: -5px; }
      .t-house-close .h-sub { position: absolute; left: 0; right: 0; top: 530px; text-align: center; font: italic 400 58px 'Instrument Serif', serif; color: ${HOUSE.sky}; }
      .t-house-close .h-cred { position: absolute; left: 0; right: 0; top: 780px; text-align: center; font: 400 22px 'JetBrains Mono', monospace; color: rgba(255,255,255,.62); line-height: 1.7; }`,
    build: (c) => `<div class="h-fig">FIG_10<span>${esc(c.fig || 'END')}</span></div><div class="h-eye">${esc(c.eyebrow)}</div><div class="h-big">${esc(c.title)}</div>
      <div class="h-sub">${esc(c.sub.text)}</div><div class="h-cred">${(TL.credits || []).map(esc).join('<br>')}</div>`,
    draw(el, c, lt) {
      wipe(el, lt);
      el.querySelector('.h-fig').style.opacity = easeOut(prog(lt, 0.2, 0.5));
      up(el.querySelector('.h-eye'), easeOut(prog(lt, 0.25, 0.5)));
      const b = el.querySelector('.h-big'); const p = easeOut(prog(lt, 0.35, 0.6)); b.style.opacity = p; b.style.transform = `translateY(${(1 - p) * 50}px) scale(${1 + 0.01 * lt})`;
      up(el.querySelector('.h-sub'), easeOut(prog(lt, c.sub.t, 0.5)));
      el.querySelector('.h-cred').style.opacity = easeOut(prog(lt, c.sub.t + 1.2, 0.8));
    },
  });
})();
