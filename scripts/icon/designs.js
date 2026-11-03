// Tre ikonforslag som SVG (1024 × 1024, uden afrundede hjørner – iOS klipper selv).
const GREEN = '#1F5C3F', GREEN_D = '#163F2C', CREAM = '#F7F3E8', INK = '#1B1B18', RED = '#B3261E';
const SPADE = 'M0,-1 C0.35,-0.55 1,-0.25 1,0.2 C1,0.55 0.7,0.75 0.4,0.75 C0.25,0.75 0.1,0.68 0.05,0.6 C0.08,0.8 0.18,0.95 0.35,1.05 L-0.35,1.05 C-0.18,0.95 -0.08,0.8 -0.05,0.6 C-0.1,0.68 -0.25,0.75 -0.4,0.75 C-0.7,0.75 -1,0.55 -1,0.2 C-1,-0.25 -0.35,-0.55 0,-1 Z';
const HEART = 'M0,1 C-0.4,0.6 -1,0.25 -1,-0.25 C-1,-0.65 -0.7,-0.9 -0.4,-0.9 C-0.2,-0.9 -0.05,-0.8 0,-0.65 C0.05,-0.8 0.2,-0.9 0.4,-0.9 C0.7,-0.9 1,-0.65 1,-0.25 C1,0.25 0.4,0.6 0,1 Z';
const suit = (d, x, y, s, fill, rot = 0) => `<path d="${d}" fill="${fill}" transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"/>`;
const felt = `<defs><radialGradient id="felt" cx="50%" cy="40%" r="75%"><stop offset="0" stop-color="#2A7350"/><stop offset="1" stop-color="${GREEN_D}"/></radialGradient>
<filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="14" stdDeviation="18" flood-color="#000" flood-opacity="0.35"/></filter></defs>
<rect width="1024" height="1024" fill="url(#felt)"/>`;
function card(x, y, w, h, rot, inner) {
  return `<g transform="translate(${x} ${y}) rotate(${rot})" filter="url(#sh)">
  <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${w * 0.09}" fill="${CREAM}"/>${inner(w, h)}</g>`;
}
const corner = (w, h, letter, d, color) => `
  <text x="${-w / 2 + w * 0.13}" y="${-h / 2 + h * 0.15}" font-family="DejaVu Serif" font-weight="bold" font-size="${w * 0.17}" fill="${color}" text-anchor="middle">${letter}</text>
  ${suit(d, -w / 2 + w * 0.13, -h / 2 + h * 0.215, w * 0.055, color)}
  <g transform="rotate(180)"><text x="${-w / 2 + w * 0.13}" y="${-h / 2 + h * 0.15}" font-family="DejaVu Serif" font-weight="bold" font-size="${w * 0.17}" fill="${color}" text-anchor="middle">${letter}</text>
  ${suit(d, -w / 2 + w * 0.13, -h / 2 + h * 0.215, w * 0.055, color)}</g>`;

const designs = {
  A: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">${felt}
    ${card(512, 520, 540, 740, -7, (w, h) => corner(w, h, 'A', SPADE, INK) + suit(SPADE, 0, -10, 165, INK))}</svg>`,
  B: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">${felt}
    ${card(420, 540, 470, 650, -13, (w, h) => corner(w, h, 'A', HEART, RED) + suit(HEART, 0, 0, 120, RED))}
    ${card(612, 500, 470, 650, 10, (w, h) => corner(w, h, 'A', SPADE, INK) + suit(SPADE, 0, -10, 135, INK))}</svg>`,
  C: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">${felt}
    <g filter="url(#sh)"><rect x="232" y="170" width="560" height="700" rx="48" fill="${CREAM}"/></g>
    <rect x="232" y="170" width="560" height="150" rx="48" fill="${CREAM}"/>
    ${suit(SPADE, 512, 248, 58, INK)}
    <line x1="292" y1="330" x2="732" y2="330" stroke="${GREEN}" stroke-width="10"/>
    ${[['+40', GREEN], ['−20', RED], ['+80', GREEN], ['+10', GREEN]].map(([t, c], i) => `
      <text x="712" y="${440 + i * 115}" font-family="Inter" font-weight="800" font-size="92" fill="${c}" text-anchor="end">${t}</text>
      <line x1="292" y1="${468 + i * 115}" x2="732" y2="${468 + i * 115}" stroke="#D9D3C5" stroke-width="5"/>`).join('')}
    ${[0, 1, 2, 3].map((i) => `<rect x="300" y="${380 + i * 115}" width="120" height="58" rx="12" fill="${['#1F5C3F', '#B3261E', '#1F5C3F', '#1F5C3F'][i]}" opacity="0.14"/>`).join('')}
    </svg>`,
};
module.exports = { designs, SPADE, HEART, GREEN, GREEN_D, CREAM, INK, RED, suit, card, corner, felt };
