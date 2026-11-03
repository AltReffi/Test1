// Laver app-ikon, Android-lag, splash og favicon fra SVG-kilderne i designs.js.
// Brug: node scripts/icon/build-icons.js assets   (kræver Playwright med Chromium)
// Konverter bagefter icon.png og android-icon-background.png til RGB uden alfa, og skaler
// Android-lagene til 512/432 px og favicon til 48 px (se docs/STATUS.md).
const { chromium } = require('playwright');
const fs = require('fs');
const { SPADE, INK, GREEN_D, suit, card, corner } = require('./designs');
const OUT = process.argv[2];
const defs = `<defs><radialGradient id="felt" cx="50%" cy="40%" r="75%"><stop offset="0" stop-color="#2A7350"/><stop offset="1" stop-color="${GREEN_D}"/></radialGradient>
<filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="14" stdDeviation="18" flood-color="#000" flood-opacity="0.35"/></filter></defs>`;
const felt = `<rect width="1024" height="1024" fill="url(#felt)"/>`;
const aceCard = (scale) => `<g transform="translate(512 512) scale(${scale}) translate(-512 -512)">
  ${card(512, 520, 540, 740, -7, (w, h) => corner(w, h, 'A', SPADE, INK) + suit(SPADE, 0, -10, 165, INK))}</g>`;
const svg = (body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">${defs}${body}</svg>`;
// Monokrom (Android 13+ temaikoner): kortets form med sparen skåret ud.
const mono = svg(`<mask id="m"><rect width="1024" height="1024" fill="#000"/>
  <g transform="translate(512 512) scale(0.62) translate(-512 -512)"><g transform="translate(512 520) rotate(-7)">
  <rect x="-270" y="-370" width="540" height="740" rx="49" fill="#fff"/>${suit(SPADE, 0, -10, 165, '#000')}</g></g></mask>
  <rect width="1024" height="1024" fill="#fff" mask="url(#m)"/>`);
const files = {
  'icon.svg': [svg(felt + aceCard(1)), false],
  'android-icon-foreground.svg': [svg(aceCard(0.62)), true],
  'android-icon-background.svg': [svg(felt), false],
  'android-icon-monochrome.svg': [mono, true],
  'splash-icon.svg': [svg(aceCard(1)), true],
};
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1024, height: 1024 } });
  for (const [name, [s, transparent]] of Object.entries(files)) {
    fs.writeFileSync(`${OUT}/kilde/${name}`, s);
    await p.setContent(`<html><body style="margin:0;background:transparent">${s}</body></html>`);
    await p.screenshot({ path: `${OUT}/${name.replace('.svg', '.png')}`, omitBackground: transparent });
  }
  await b.close();
})();
