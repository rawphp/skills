// One entry per footage scene (every script.json line without a "card").
// setup: put the app in the scene's start state (no capture yet). run: the beats, cued to VO words.
// r API: at(word, n, off) move click type selectAll cam camOut ring sticker sfx scrollBy ensureVisible rect wait
export default {
  s03: {
    setup: async (page, ctx) => { await ctx.goto('/things'); },
    run: async (r, page) => {
      await r.at('list.', 1, -0.3);
      await r.cam({ x: 360, y: 150, width: 900, height: 420 }, { zoom: 1.6 });   // viewport CSS px
      await r.at('Pick');
      const row = page.getByRole('link', { name: 'First thing' });
      await r.click(row, { dur: 0.6 });
      await page.getByRole('heading', { name: 'First thing' }).waitFor();         // wait for the state, not a timer
      r.camOut(0.8);
      await r.at('there');
      await r.ring(page.getByText('Status'), { dur: 2.4 });
    },
  },
  s04: {
    setup: async (page, ctx) => { await ctx.goto('/inbox'); },
    run: async (r, page) => {
      await r.at('Then', 1, 0.3);   // footage shows once the intro card fades at "Then"
      await r.click(page.getByRole('link', { name: 'Your item is ready' }), { dur: 0.7 });
    },
  },
};
