// Tager kladder til App Store-skærmbilleder fra webudgaven med demodata.
// Brug: start `npx expo start --web --port 8081`, og kør derefter
//   node scripts/appstore-screenshots.js docs/appstore/skaermbilleder
// Kræver Playwright med Chromium (ikke en afhængighed i projektet).
const { chromium } = require('playwright');
const path = require('path');
const OUTDIR = process.argv[2];
const P = ['Mette', 'Jens', 'Lise', 'Peter'];
const seated = P;
// Deterministisk "tilfældighed"
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const pick = (a) => a[Math.floor(rnd() * a.length)];
function round() {
  const r = rnd();
  if (r < 0.08) return { type: 'pass', seated };
  if (r < 0.16) { const p = pick(P); return { type: 'sol', seated, sols: [{ player: p, kind: pick(['sol', 'sol', 'renSol']), success: rnd() < 0.6 }] }; }
  const bidder = pick(P); const others = P.filter(x => x !== bidder);
  const alone = rnd() < 0.1;
  const level = pick([7, 7, 8, 8, 8, 9, 9, 10]);
  const pahaeng = pick(['ingen', 'ingen', 'ingen', 'vip', 'gode', 'sans']);
  const tricks = Math.max(0, Math.min(13, level + pick([-2, -1, 0, 0, 0, 1, 1, 2])));
  return { type: 'trump', seated, bidder, partner: alone ? null : pick(others), bid: { level, pahaeng }, tricks };
}
const day = 86400000;
const now = new Date(2026, 10, 3, 21, 30).getTime();
const games = [0, 7, 14, 21, 35, 49].map((ago, i) => {
  const t = now - ago * day;
  return { id: 'demo' + i, createdAt: t, updatedAt: t, players: P, systemId: 'whist-dk', oerePerPoint: 10, moneyEnabled: true,
    rounds: Array.from({ length: i === 0 ? 14 : 18 + Math.floor(rnd() * 10) }, round) };
});
const sizes = [['6,9', 440, 956], ['6,3', 402, 874]];
(async () => {
  const browser = await chromium.launch();
  for (const [label, w, h] of sizes) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    await ctx.addInitScript((g) => { localStorage.setItem('whist:games:v1', JSON.stringify(g)); }, games);
    const page = await ctx.newPage();
    const btn = (name, nth = 0) => page.getByRole('button', { name, exact: true }).locator('visible=true').nth(nth);
    const shot = async (n) => { await page.waitForTimeout(400); await page.screenshot({ path: path.join(OUTDIR, `${label}-${n}.jpg`), type: 'jpeg', quality: 92 }); };
    await page.goto('http://localhost:8081/game/demo0', { waitUntil: 'networkidle' });
    await shot('1-stilling');
    await btn('Ny runde').click();
    await btn('Lise', 0).click(); await btn('9', 0).click(); await btn('Vip').click(); await btn('Mette', 1).click();
    await page.waitForTimeout(400); await btn('10', 1).click();
    await shot('2-runde');
    await page.goBack();
    await btn('Afregning').click();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.locator('text=STILLING').or(page.getByText('Stilling', { exact: true })).first().scrollIntoViewIfNeeded().catch(() => {});
    await shot('3-afregning');
    await page.goto('http://localhost:8081/stats', { waitUntil: 'networkidle' });
    await shot('4-statistik');
    await page.goto('http://localhost:8081/', { waitUntil: 'networkidle' });
    await shot('5-forside');
    await ctx.close();
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
