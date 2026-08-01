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
 *  distingue del texto y la página parecería rota en vez de personalizada. */
const conVida = (c: Hsl, minS: number): Hsl => ({ ...c, s: Math.max(c.s, minS) });

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

  const p = conVida(aHsl(principal), 42);
  // Sin segundo color se deriva uno girando el tono: mejor un acompañante
  // coherente que repetir el mismo color dos veces y perder el contraste
  // entre el acento y el secundario.
  const s = secundarioCrudo
    ? conVida(aHsl(secundarioCrudo), 40)
    : { ...p, h: (p.h + 38) % 360 };

  return {
    claro: {
      "--color-acento": aHex(enRango(p, 26, 44)),
      "--color-acento-suave": aHex({ ...p, s: Math.min(p.s, 46), l: 93 }),
      "--color-ambar": aHex(enRango(s, 26, 44)),
      "--color-ambar-suave": aHex({ ...s, s: Math.min(s.s, 46), l: 93 }),
      // El acento claro quedó oscuro (L 26-44): encima va blanco.
      "--color-sobre-acento": "#ffffff",
    },
    oscuro: {
      "--color-acento": aHex(enRango(p, 58, 74)),
      "--color-acento-suave": aHex({ ...p, s: Math.min(p.s, 40), l: 15 }),
      "--color-ambar": aHex(enRango(s, 58, 76)),
      "--color-ambar-suave": aHex({ ...s, s: Math.min(s.s, 40), l: 15 }),
      // Acá el acento es claro (L 58-74) y el blanco encima no se leería.
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
