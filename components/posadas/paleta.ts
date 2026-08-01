/* La página se viste con los colores que la IA ve en el perfil del cliente.
 *
 * El color que llega NO se usa tal cual. Una marca puede tener un amarillo
 * clarísimo o un azul casi negro, y cualquiera de los dos, puesto de texto
 * sobre el fondo de la página, quedaría ilegible. Acá se le respeta el tono
 * (que es lo que la hace reconocible) y se le ajusta la luminosidad al rango
 * que cada tema necesita para leerse.
 *
 * Es también la frontera de confianza: el hexadecimal viene de un modelo, o
 * sea de texto no confiable, y termina dentro de una custom property de CSS.
 * Todo lo que no calce exacto con #RRGGBB se descarta acá y la página se queda
 * con su paleta de siempre. */

export interface ColoresMarca {
  principal: string | null;
  secundario: string | null;
}

const HEX = /^#[0-9a-f]{6}$/i;

type Hsl = { h: number; s: number; l: number };

function aHsl(hex: string): Hsl {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l: l * 100 };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h = h * 60;
  if (h < 0) h += 360;
  return { h, s: s * 100, l: l * 100 };
}

function aHex({ h, s, l }: Hsl): string {
  const sn = Math.min(100, Math.max(0, s)) / 100;
  const ln = Math.min(100, Math.max(0, l)) / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;
  const [r, g, b] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x]
      : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  const dos = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${dos(r)}${dos(g)}${dos(b)}`;
}

/** Un gris de marca no es un acento: sin algo de saturación el color no se
 *  distingue del texto y la página parecería rota en vez de personalizada.
 *  El techo importa igual que el piso -- sin él, un verde agua terminaba en
 *  pantalla como un verde radioactivo. */
const conVida = (c: Hsl, minS: number): Hsl =>
  ({ ...c, s: Math.min(78, Math.max(c.s, minS)) });

/* --------------------------------------------------------------------------
   Los colores se MIDEN de la imagen, no se le preguntan al modelo.

   Pedirle a un modelo de visión que nombre un hexadecimal es pedirle que
   adivine: con el perfil de una posada de marca verde agua devolvió un verde
   radioactivo. La captura ya está en el navegador para achicarla, así que se
   leen los píxeles y se cuenta cuál domina. Es exacto, gratis e instantáneo.

   Se descarta el gris (el cromo de Instagram: fondos, textos, iconos) y se
   pondera cada píxel por lo saturado que sea, para que el logo pese más que
   una pared blanca que ocupa media foto. */

const BINS = 24;                 // cubos de 15 grados de tono
const S_MINIMA = 18;             // menos que esto es gris, no color de marca
const L_MINIMA = 12, L_MAXIMA = 92;

export function extraerColores(lienzo: HTMLCanvasElement): ColoresMarca | null {
  const ctx = lienzo.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  let datos: Uint8ClampedArray;
  try {
    datos = ctx.getImageData(0, 0, lienzo.width, lienzo.height).data;
  } catch {
    return null;
  }

  const peso = new Array(BINS).fill(0);
  const sumaS = new Array(BINS).fill(0);
  const sumaL = new Array(BINS).fill(0);
  const sumaSen = new Array(BINS).fill(0);
  const sumaCos = new Array(BINS).fill(0);

  // Un paso de 4 píxeles alcanza y sobra: en una imagen de 1024 de lado son
  // decenas de miles de muestras.
  for (let i = 0; i < datos.length; i += 16) {
    if (datos[i + 3] < 200) continue;
    const { h, s, l } = rgbAHsl(datos[i], datos[i + 1], datos[i + 2]);
    if (s < S_MINIMA || l < L_MINIMA || l > L_MAXIMA) continue;
    const bin = Math.floor(h / (360 / BINS)) % BINS;
    const w = s / 100;
    peso[bin] += w;
    sumaS[bin] += s * w;
    sumaL[bin] += l * w;
    // El tono es circular: promediarlo como número suelto haría que 350 y 10
    // dieran 180 (un cian) en vez de 0 (un rojo).
    const rad = (h * Math.PI) / 180;
    sumaSen[bin] += Math.sin(rad) * w;
    sumaCos[bin] += Math.cos(rad) * w;
  }

  const total = peso.reduce((a, b) => a + b, 0);
  if (total < 40) return null;   // casi todo gris: no hay marca que leer

  const promedio = (bin: number): Hsl => {
    let h = (Math.atan2(sumaSen[bin], sumaCos[bin]) * 180) / Math.PI;
    if (h < 0) h += 360;
    return { h, s: sumaS[bin] / peso[bin], l: sumaL[bin] / peso[bin] };
  };

  const orden = peso.map((w, bin) => ({ w, bin })).sort((a, b) => b.w - a.w);
  const principal = promedio(orden[0].bin);
  // El segundo color tiene que estar lejos en el círculo: dos cubos vecinos
  // son el mismo color y la página quedaría monocromática.
  const lejano = orden.slice(1).find(({ bin, w }) => {
    const d = Math.abs(bin - orden[0].bin);
    return w > total * 0.06 && Math.min(d, BINS - d) >= 3;
  });

  return {
    principal: aHex(principal),
    secundario: lejano ? aHex(promedio(lejano.bin)) : null,
  };
}

function rgbAHsl(r8: number, g8: number, b8: number): Hsl {
  const r = r8 / 255, g = g8 / 255, b = b8 / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l: l * 100 };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return { h, s: s * 100, l: l * 100 };
}

const enRango = (c: Hsl, min: number, max: number): Hsl => ({
  ...c,
  l: Math.min(max, Math.max(min, c.l)),
});

export interface PaletaCss {
  claro: Record<string, string>;
  oscuro: Record<string, string>;
}

/** Devuelve las variables listas para cada tema, o null si no hay con qué. */
export function construirPaleta(colores: ColoresMarca | null | undefined): PaletaCss | null {
  const principal = colores?.principal && HEX.test(colores.principal) ? colores.principal : null;
  if (!principal) return null;
  const secundarioCrudo = colores?.secundario && HEX.test(colores.secundario) ? colores.secundario : null;

  const p = conVida(aHsl(principal), 30);
  // Sin segundo color se deriva uno girando el tono: mejor un acompañante
  // coherente que repetir el mismo color dos veces y perder el contraste
  // entre el acento y el secundario.
  const s = secundarioCrudo
    ? conVida(aHsl(secundarioCrudo), 30)
    : { ...p, h: (p.h + 38) % 360 };

  return {
    claro: {
      "--color-acento": aHex(enRango(p, 28, 42)),
      "--color-acento-suave": aHex({ ...p, s: Math.min(p.s, 40), l: 93 }),
      "--color-ambar": aHex(enRango(s, 28, 42)),
      "--color-ambar-suave": aHex({ ...s, s: Math.min(s.s, 40), l: 93 }),
      // El acento claro quedó oscuro (L 28-42): encima va blanco.
      "--color-sobre-acento": "#ffffff",
    },
    oscuro: {
      // Banda estrecha y saturación con techo: empujar la luminosidad hasta 74
      // convertía un verde agua en un verde de rotulador.
      "--color-acento": aHex(enRango({ ...p, s: Math.min(p.s, 62) }, 54, 66)),
      "--color-acento-suave": aHex({ ...p, s: Math.min(p.s, 34), l: 15 }),
      "--color-ambar": aHex(enRango({ ...s, s: Math.min(s.s, 62) }, 54, 68)),
      "--color-ambar-suave": aHex({ ...s, s: Math.min(s.s, 34), l: 15 }),
      // Acá el acento es claro (L 54-66) y el blanco encima no se leería.
      "--color-sobre-acento": aHex({ ...p, s: 30, l: 8 }),
    },
  };
}

const bloque = (vars: Record<string, string>) =>
  Object.entries(vars).map(([k, v]) => `${k}:${v}`).join(";");

/** El CSS que se inyecta. Se emiten los dos temas de una vez y deja que la
 *  cascada elija: así el cambio de tema sigue funcionando sin recalcular nada
 *  ni tener que observar el atributo del <html>. */
export function cssPaleta(paleta: PaletaCss, marca: string): string {
  return `[data-paleta="${marca}"]{${bloque(paleta.claro)}}`
    + `:root[data-theme="dark"] [data-paleta="${marca}"]{${bloque(paleta.oscuro)}}`;
}
