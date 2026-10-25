// Builds preview.png (1200x630), the social link-preview card, from the game itself.
//
// Usage (from the repo root):
//   npm i --no-save playwright && npx playwright install chromium   # one time; a global install also works
//   node scripts/make-preview.mjs
//
// It serves index.html locally, uses the game's test hooks (?test=1, fixed seed) to set up a mid-game moment
// (the monster just lured one step onto open ground: its mound among the numbers, the changed numbers flickering
// red, scratch marks where it came from), freezes time on that frame, then lays the board out next to the game's
// own logo with CSS. Gameplay code is untouched; only the page's layout is rearranged for the shot.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'preview.png');
const W = 1200, H = 630;
const SEED = 7;

let pw;
try { pw = await import('playwright'); } catch {
  pw = createRequire(execSync('npm root -g').toString().trim() + '/')('playwright');
}

const server = http.createServer((req, res) => {
  const f = path.join(ROOT, 'index.html');
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  fs.createReadStream(f).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));

const browser = await pw.chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
// the game's own randomness is seeded by ?seed; also seed Math.random (dust particles), so the card comes out the same
await page.addInitScript(() => { let s = 42; Math.random = () => (s = (s * 16807) % 2147483647) / 2147483647; });
await page.clock.install({ time: 0 });
await page.clock.pauseAt(1000);                        // time only moves when we say so, from the very start
await page.goto(`http://127.0.0.1:${server.address().port}/index.html?test=1&seed=${SEED}`);
await page.clock.runFor(500);

// ---- a mid-game board, and a lure lined up: monster on X, stomp on S, it steps onto open tile Y between them ----
const scene = await page.evaluate(() => {
  const M = window.__MSM;
  const cheb = (G, a, b) => Math.max(Math.abs(a % G.W - b % G.W), Math.abs(((a / G.W) | 0) - ((b / G.W) | 0)));
  for (let g = 0; g < 300; g++) {
    M.start('easy');
    const G = M.G, W = G.W;
    M.reveal(66);
    // flag the pumpkins the numbers already give away, like a player would have
    for (let i = 0; i < G.N; i++) {
      if (!G.revealed[i] || !G.nums[i]) continue;
      const hid = [...G.nbr[i]].filter(j => !G.revealed[j]);
      if (hid.length === G.nums[i]) for (const j of hid) if (!G.flagged[j] && G.mines[j]) M.flag(j);
    }
    M.settle();
    let best = null;
    for (let y = 0; y < G.N; y++) {
      if (!G.revealed[y]) continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const yx = y % W, yy = (y / W) | 0;
        if ([yx - dx, yx + dx].some(v => v < 0 || v >= W) || [yy - dy, yy + dy].some(v => v < 0 || v >= G.H)) continue;
        const x = (yy - dy) * W + yx - dx, s = (yy + dy) * W + yx + dx;
        // it comes out of hidden ground (so its scratch marks show) onto open ground, lured by a stomp beyond
        if (G.revealed[x] || G.mines[x] || G.flagged[x] || !G.revealed[s]) continue;
        // numbers that change as it moves (those it leaves drop, those it reaches rise), open ground around it,
        // and a spot near the middle of the board
        const near = (a, b) => cheb(G, a, b) <= 1;
        const changed = [...Array(G.N).keys()].filter(j => G.revealed[j] && j !== y && near(j, x) !== near(j, y)).length;
        const open = [...G.nbr[y]].filter(j => G.revealed[j]).length;
        const centre = Math.abs(yx - 5.5) + Math.abs(yy - 5.5);
        const score = changed * 3 + open * 2 - centre;
        if (!best || score > best.score) best = { x, y, s, score, changed, open };
      }
    }
    if (!best || best.changed < 3 || best.open < 4) continue;
    M.place(0, best.x);
    return best;
  }
  return null;
});
if (!scene) { console.error('no suitable scene found'); process.exit(1); }

// ---- the card layout: board on the left, the game's logo and tagline on the right (under its moon) ----
await page.addStyleTag({ content: `
  #hud, #controls, #end, .edge, #fx { display: none !important; }
  #boardWrap { position: fixed !important; left: -10px; top: 19px; width: 592px; height: 592px; flex: none !important; }
  #card { position: fixed; left: 600px; top: 0; width: 570px; height: ${H}px; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 18px; text-align: center; z-index: 5; }
  #card img { image-rendering: pixelated; display: block; }
  #card p { margin: 0; font: 800 27px/1.4 ui-monospace, "SFMono-Regular", Menlo, Consolas, "Liberation Mono", monospace;
    color: #f1e8ff; letter-spacing: 1px; text-shadow: 0 2px 0 #1b0c30; }
  #card p em { font-style: normal; color: #c6ff4a; text-shadow: 0 0 10px rgba(198,255,74,.55), 0 2px 0 #1b0c30; }
` });
await page.evaluate(() => {
  // the title screen's own pixel-art logo canvases, copied as they were drawn and enlarged by whole art pixels
  // (6 -> 8 px per art pixel for MINESWEEPER, 4 -> 5 for SOMETHING MOVES), so they stay crisp
  const card = document.createElement('div');
  card.id = 'card';
  for (const [id, k] of [['logo1', 4 / 3], ['logo2', 5 / 4]]) {
    const cv = document.getElementById(id), img = document.createElement('img');
    img.src = cv.toDataURL('image/png');
    img.style.width = Math.round(parseFloat(cv.style.width) * k) + 'px';
    img.style.height = Math.round(parseFloat(cv.style.height) * k) + 'px';
    card.appendChild(img);
  }
  const p = document.createElement('p');
  p.innerHTML = 'One of the mines is alive.<br><em>It moves.</em> The numbers change.';
  card.appendChild(p);
  document.body.appendChild(card);
  window.dispatchEvent(new Event('resize'));
});
await page.clock.runFor(400);                          // the new layout settles (board re-laid out at 48 px tiles)

// ---- the moment: stomp, it steps out, and 100 ms later the numbers are mid-flicker ----
await page.evaluate(s => window.__MSM.stomp(s), scene.s);
await page.clock.runFor(100);
const check = await page.evaluate(() => ({ tile: window.__MSM.view.cssTile, mon: window.__MSM.G.mons[0].i, over: window.__MSM.G.over }));
if (check.mon !== scene.y || check.over) { console.error('the lure did not go as planned', check, scene); process.exit(1); }
await page.screenshot({ path: OUT });
await browser.close();
server.close();
if (errors.length) { console.error('page errors:', errors); process.exit(1); }
console.log(`wrote ${path.relative(process.cwd(), OUT)} (${W}x${H}, ${fs.statSync(OUT).size} bytes); board tiles ${check.tile}px, monster on tile ${check.mon}`);
