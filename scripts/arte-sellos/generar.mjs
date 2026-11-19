// Sellos de destino dibujados a mano (los otros 8 salieron del generador de imágenes,
// ver scripts/arte/manifiesto.json). Escribe <slug>.svg acá y los WebP de 192/384 en
// public/arte/sellos/. Tinta única sobre transparente: SelloDestino.tsx los usa como
// máscara, así que solo cuenta el alfa.
//   node scripts/arte-sellos/generar.mjs [slug...]
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const AQUI = dirname(fileURLToPath(import.meta.url));
const SALIDA = join(AQUI, "../../public/arte/sellos");
const TINTA = "#12262b";
const r = (n) => Math.round(n * 10) / 10;

// Marco común: óvalo de pasaporte (anillo grueso + punteado) y dos estrellas.
const ESTRELLAS = [[50, 192], [334, 192]];
const estrella = (x, y, R = 11, ri = 4.6) =>
  `<path d="M${Array.from({ length: 10 }, (_, i) => {
    const a = ((-90 + i * 36) * Math.PI) / 180, k = i % 2 ? ri : R;
    return `${r(x + k * Math.cos(a))},${r(y + k * Math.sin(a))}`;
  }).join(" L")} Z"/>`;

const svg = (defs, cuerpo) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 384" width="384" height="384">
<defs>
<clipPath id="dentro"><ellipse cx="192" cy="192" rx="150" ry="114"/></clipPath>
<mask id="sin-estrellas" maskUnits="userSpaceOnUse" x="0" y="0" width="384" height="384">
<rect width="384" height="384" fill="#fff"/>${ESTRELLAS.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="21" fill="#000"/>`).join("")}
</mask>
${defs}
</defs>
<g fill="${TINTA}" stroke="none">
<ellipse cx="192" cy="192" rx="179" ry="143" fill="none" stroke="${TINTA}" stroke-width="10"/>
<ellipse cx="192" cy="192" rx="164" ry="128" fill="none" stroke="${TINTA}" stroke-width="3.5" stroke-dasharray="8 6"/>
${ESTRELLAS.map(([x, y]) => estrella(x, y)).join("\n")}
<g clip-path="url(#dentro)"><g mask="url(#sin-estrellas)">
${cuerpo}
</g></g>
</g>
</svg>
`;

// ---------- piezas ----------
// Hoja de palma: curva de (0,0) a la punta, abombada hacia arriba.
function hoja(ang, L, caida, w = 20) {
  const a = (ang * Math.PI) / 180;
  const tx = L * Math.cos(a), ty = L * Math.sin(a) + caida;
  const cx = 0.55 * L * Math.cos(a), cy = 0.55 * L * Math.sin(a) - caida * 0.25;
  const n = Math.hypot(tx, ty);
  let nx = ty / n, ny = -tx / n;
  if (ny > 0) {
    nx = -nx;
    ny = -ny;
  }
  return `M0,0 Q${r(cx + nx * w)},${r(cy + ny * w)} ${r(tx)},${r(ty)} Q${r(cx - nx * w * 0.3)},${r(cy - ny * w * 0.3)} 0,4 Z`;
}
const COPA = [
  [0, 60, 24], [180, 58, 26], [-28, 56, 8], [-152, 56, 8],
  [-68, 44, 0], [-112, 44, 0], [28, 42, 20], [152, 42, 20],
].map(([a, L, c]) => hoja(a, L, c)).join(" ");

function palmera({ base: [bx, by], copa: [cx, cy], ctrl: [kx, ky], esc = 1, anchoBase = 15 }) {
  const wb = anchoBase * esc, wt = 7 * esc;
  const tronco = `<path d="M${r(bx - wb / 2)},${by} Q${r(kx - wb / 3)},${ky} ${r(cx - wt / 2)},${cy} L${r(cx + wt / 2)},${cy} Q${r(kx + wb / 3)},${ky} ${r(bx + wb / 2)},${by} Z"/>`;
  const cocos = [[-5, 7], [3, 9], [9, 4]].map(([x, y]) => `<circle cx="${r(cx + x * esc)}" cy="${r(cy + y * esc)}" r="${r(4.2 * esc)}"/>`).join("");
  return `${tronco}<path transform="translate(${cx},${cy}) scale(${esc})" d="${COPA}"/>${cocos}`;
}

// Fila de olas (festón) de x0 a x1 a la altura y.
function olas(y, x0 = 20, x1 = 370, paso = 26, alto = 9) {
  let d = `M${x0},${y}`;
  for (let x = x0; x < x1; x += paso) d += ` q${paso / 2},${-alto} ${paso},0`;
  return d;
}

// ---------- Isla de Coche ----------
// Isla baja con palmeras a la izquierda, sol arriba, y un kiter con su cometa a la derecha.
function coche() {
  const sol = [94, 134];
  const rayos = Array.from({ length: 8 }, (_, i) => {
    const a = ((i * 45 + 22.5) * Math.PI) / 180;
    return `M${r(sol[0] + 19 * Math.cos(a))},${r(sol[1] + 19 * Math.sin(a))} L${r(sol[0] + 26 * Math.cos(a))},${r(sol[1] + 26 * Math.sin(a))}`;
  }).join(" ");
  const kite = `M246,142 Q278,80 316,128 L311,135 Q279,102 253,147 Z`;
  const [hx, hy] = [278, 226];
  const kiter = [
    `<circle cx="${hx}" cy="${hy}" r="6"/>`,
    `<path d="M${hx - 6},${hy + 7} L${hx + 5},${hy + 7} L${hx + 2},${hy + 26} L${hx + 10},${hy + 36} L${hx + 4},${hy + 39} L${hx - 3},${hy + 29} L${hx - 10},${hy + 39} L${hx - 16},${hy + 36} Z"/>`,
    `<path d="M${hx - 26},${hy + 42} Q${hx - 4},${hy + 37} ${hx + 20},${hy + 35} L${hx + 19},${hy + 42} Q${hx - 4},${hy + 45} ${hx - 27},${hy + 48} Z"/>`,
    `<path d="M${hx + 3},${hy + 10} L${hx + 11},${hy + 3}" stroke="${TINTA}" stroke-width="4" stroke-linecap="round" fill="none"/>`,
  ].join("");
  const lineas = `<path d="M250,145 L${hx + 12},${hy + 2} M313,132 L${hx + 12},${hy + 2}" stroke="${TINTA}" stroke-width="2" fill="none"/>`;
  const defs = `<mask id="sin-kiter" maskUnits="userSpaceOnUse" x="0" y="0" width="384" height="384">
<rect width="384" height="384" fill="#fff"/><g fill="#000" stroke="#000" stroke-width="10">${kiter}</g></mask>`;
  const agua = `<g mask="url(#sin-kiter)" fill="none" stroke="${TINTA}" stroke-linecap="round">
<path d="M30,250 L354,250" stroke-width="4"/>
<path d="${olas(270, 18)}" stroke-width="5"/>
<path d="${olas(290, 5)}" stroke-width="5"/>
<path d="${olas(310, 18)}" stroke-width="5"/>
</g>`;
  const isla = `<path d="M62,252 C80,237 112,230 148,229 C186,228 214,235 232,252 Z"/>`;
  const palmas = [
    palmera({ base: [160, 238], copa: [146, 132], ctrl: [166, 184], esc: 0.84 }),
    palmera({ base: [178, 238], copa: [204, 164], ctrl: [180, 202], esc: 0.72 }),
    palmera({ base: [126, 240], copa: [104, 198], ctrl: [124, 220], esc: 0.54 }),
  ].join("\n");
  return svg(defs, [
    `<circle cx="${sol[0]}" cy="${sol[1]}" r="13"/>`,
    `<path d="${rayos}" stroke="${TINTA}" stroke-width="5" stroke-linecap="round" fill="none"/>`,
    `<path d="${kite}"/>`, lineas, agua, isla, palmas, kiter,
  ].join("\n"));
}

// ---------- Caracas ----------
// El Ávila al fondo (lomo largo al oeste, la Silla con sus dos picos al este), las torres de
// Parque Central al frente, una guacamaya y la autopista abajo.
function caracas() {
  const avila = `M30,214 L48,196 L66,184 L84,170 L100,160 L118,150 L136,142 L154,136 L172,128 L190,124 L206,116 L218,108 L228,104 L240,110 L252,116 L262,116 L272,108 L282,104 L294,110 L306,122 L318,136 L330,152 L344,172 L358,196 L360,262 L30,262 Z`;
  const quebradas = `M228,108 L220,132 L226,156 M282,108 L276,134 L284,160 M257,119 L253,142 M190,128 L184,152 M136,146 L132,168 M318,140 L312,164 M84,174 L82,192 M240,112 L236,130 M300,114 L295,136 L299,152 M206,118 L200,140 L204,160 M330,154 L324,176 M264,118 L268,138 L264,158 M168,132 L164,150 M344,174 L340,190`;
  const torres = [[108, 104, 26], [140, 112, 26]];
  const resto = [
    [62, 214, 20], [84, 198, 20], [170, 206, 22], [194, 222, 18],
    [214, 196, 24], [240, 212, 20], [262, 200, 22], [286, 216, 20], [308, 228, 16],
  ];
  const piso = 262;
  const rect = ([x, y, w]) => `M${x},${y} H${x + w} V${piso} H${x} Z`;
  const edificios = [...torres, ...resto].map(rect).join(" ");
  const ventanas = resto.map(([x, y, w]) => {
    let d = "";
    for (let yy = y + 8; yy < piso - 14; yy += 10)
      for (let xx = x + 4; xx + 3 <= x + w - 4; xx += 7) d += `M${xx},${yy} h3 v5 h-3 Z `;
    return d;
  }).join("");
  // Ranura vertical central y franjas de piso, como las fachadas de las torres.
  const ranuras = torres.map(([x, y, w]) => {
    const m = w / 2 - 7;
    let d = `M${x + w / 2 - 2},${y + 8} h4 V${piso - 10} h-4 Z `;
    for (let yy = y + 14; yy < piso - 16; yy += 14) d += `M${x + 4},${yy} h${m} v3 h-${m} Z M${x + w / 2 + 3},${yy} h${m} v3 h-${m} Z `;
    return d;
  }).join("");
  const remates = torres.map(([x, y, w]) => `M${x + 5},${y} V${y - 5} H${x + w - 5} V${y} Z M${x + w / 2 - 1.5},${y - 5} V${y - 11} h3 V${y - 5} Z`).join(" ");
  const guacamaya = `<g transform="translate(198,104) rotate(-8) scale(0.62)">
<ellipse cx="6" cy="0" rx="15" ry="6"/><circle cx="22" cy="-3" r="6"/>
<path d="M25,-8 Q34,-8 33,1 L28,-2 Z"/>
<path d="M-6,0 L-46,16 L-42,10 L-6,-5 Z"/>
<path d="M2,-3 Q-6,-26 -24,-36 Q-6,-34 12,-4 Z"/>
<path d="M10,-3 Q22,-24 12,-42 Q28,-28 18,-2 Z"/>
</g>`;
  const defs = `<mask id="avila-recorte" maskUnits="userSpaceOnUse" x="0" y="0" width="384" height="384">
<rect width="384" height="384" fill="#fff"/>
<path d="${edificios} ${remates}" fill="#000" stroke="#000" stroke-width="12" stroke-linejoin="round"/>
<g fill="#000" stroke="#000" stroke-width="10">${guacamaya}</g>
<path d="${quebradas}" fill="none" stroke="#000" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
</mask>
<mask id="ventanas" maskUnits="userSpaceOnUse" x="0" y="0" width="384" height="384">
<rect width="384" height="384" fill="#fff"/><path d="${ventanas} ${ranuras}" fill="#000"/>
</mask>`;
  // Arboleda continua al pie de los edificios.
  const arboles = Array.from({ length: 26 }, (_, i) => 40 + i * 12)
    .map((x, i) => `<circle cx="${x}" cy="${piso - 1}" r="${[9, 11, 8, 10][i % 4]}"/>`).join("");
  const autopista = `<path d="M20,${piso + 18} H364" stroke="${TINTA}" stroke-width="5" fill="none"/>
<path d="M20,${piso + 34} H364" stroke="${TINTA}" stroke-width="4" stroke-dasharray="14 9" fill="none"/>`;
  return svg(defs, [
    `<path mask="url(#avila-recorte)" d="${avila}"/>`,
    `<path mask="url(#ventanas)" d="${edificios} ${remates}"/>`,
    guacamaya,
    `<rect x="20" y="${piso}" width="344" height="7"/>`,
    arboles, autopista,
  ].join("\n"));
}

const SELLOS = { coche, caracas };
const pedidos = process.argv.slice(2);
for (const slug of pedidos.length ? pedidos : Object.keys(SELLOS)) {
  const fuente = SELLOS[slug]();
  writeFileSync(join(AQUI, `${slug}.svg`), fuente);
  const base = sharp(Buffer.from(fuente), { density: 288 }); // 384 → 1536 y se reduce
  for (const ancho of [192, 384])
    await base.clone().resize(ancho, ancho, { kernel: "lanczos3" })
      .webp({ quality: 92, alphaQuality: 100, effort: 6 })
      .toFile(join(SALIDA, `${slug}-${ancho}.webp`));
  console.log("ok", slug);
}
