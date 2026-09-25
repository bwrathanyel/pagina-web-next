// Estimado de una estadía para /cotizar (cotizador v2, etapa E2).
//
// Función pura, sin alias de rutas: la prueban `node --test` y los componentes
// de cliente por igual. La regla que manda es la del plan: nunca un número
// inventado. Si algo no se puede calcular con lo que publica el tarifario
// (sin tarifa para una noche, ocupación sin precio, niños sin tarifa, mínimo de
// noches), el resultado es `ok: false` con el motivo y la web muestra "Precio a
// confirmar por el asesor".
//
// Una fila de `tarifas` es una temporada de UNA habitación y UN plan. Una
// estadía puede cruzar temporadas (del 23 al 28 de diciembre son noches de
// Navidad y de Fin de Año), así que cada noche se cobra con la fila más
// específica de la misma habitación y plan que la cubre. La fila que eligió el
// cliente solo desempata: una fila sin fechas no le gana a la de Navidad.
import type { Tarifa, TarifarioBloque } from "@/types/supabase";

export interface Estadia {
  desde: string;
  hasta: string;
  adultos: number;
  /** Edad de cada niño (2 a 11). Los bebés van aparte y no pagan. */
  edades: number[];
  bebes: number;
  /** Promo de niños gratis: cuántos niños (dentro del rango de la tarifa) no
   * pagan. Son los primeros de la lista; del siguiente en adelante pagan. */
  ninosGratis?: number;
}

export type MotivoSinEstimado = "fechas" | "sin-tarifa" | "ocupacion" | "ninos" | "minimo";

export interface LineaEstimado {
  /** "4 noches, Navidad" */
  texto: string;
  monto: number;
}

export type Estimado =
  | {
      ok: true;
      total: number;
      moneda: "USD" | "EUR";
      noches: number;
      lineas: LineaEstimado[];
      /** Lo que el número no incluye o lo que el asesor debe confirmar. */
      avisos: string[];
    }
  | { ok: false; motivo: MotivoSinEstimado; texto: string; minimo?: number };

const DIA = 86_400_000;
const aFecha = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
const aIso = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** Las noches que se duermen: de la entrada al día anterior a la salida. */
export function nochesDeEstadia(desde: string, hasta: string): string[] {
  const a = aFecha(desde);
  const b = aFecha(hasta);
  if (Number.isNaN(a) || Number.isNaN(b) || b <= a) return [];
  const out: string[] = [];
  for (let t = a; t < b && out.length < 366; t += DIA) out.push(aIso(t));
  return out;
}

const normalizar = (s?: string | null) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

function numero(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

const bloqueDe = (t: Tarifa): TarifarioBloque | null => {
  const b = t.tarifario_bloques;
  if (!b) return null;
  return Array.isArray(b) ? (b[0] ?? null) : b;
};

const monedaDe = (t: Tarifa): "USD" | "EUR" => (String(t.moneda || "USD").toUpperCase() === "EUR" ? "EUR" : "USD");

/** Ventanas de disfrute con el `hasta` como última noche incluida ("20/12 al
 * 26/12" de Navidad y "27/12" de Fin de Año no se pisan). Sin fechas = abierta. */
function ventanas(t: Tarifa): [number, number][] {
  const filas = (Array.isArray(t.ventanas) ? t.ventanas : [])
    .map((w) => [w?.desde || null, w?.hasta || null] as const)
    .filter(([a, b]) => a || b);
  const crudas = filas.length ? filas : t.disfrute_desde || t.fecha_fin ? [[t.disfrute_desde || null, t.fecha_fin || null] as const] : [];
  if (!crudas.length) return [[-Infinity, Infinity]];
  return crudas.map(([a, b]) => [a ? aFecha(a) : -Infinity, b ? aFecha(b) : Infinity]);
}

/** Cuánto abarca la ventana que cubre la noche: la más corta es la más específica. */
function amplitud(t: Tarifa, noche: number): number | null {
  let mejor: number | null = null;
  for (const [a, b] of ventanas(t)) {
    if (noche >= a && noche <= b) {
      const ancho = b - a;
      if (mejor === null || ancho < mejor) mejor = ancho;
    }
  }
  return mejor;
}

/** Misma habitación, mismo plan y misma moneda: las temporadas de una misma oferta. */
const grupo = (t: Tarifa) => `${normalizar(t.habitacion)}|${normalizar(t.plan)}|${monedaDe(t)}`;

function porHabitacion(t: Tarifa): boolean {
  const p = t.precios ?? {};
  const declarada = p["base"] ?? bloqueDe(t)?.base_precio ?? null;
  if (declarada === "habitacion") return true;
  if (declarada === "persona") return false;
  // Mismo criterio que precioPorPersona()/montoDoble() en lib/tarifas.ts.
  const sgl = numero(p["sgl"]);
  const dbl = numero(p["dbl"]);
  return sgl !== null && dbl !== null && dbl > sgl;
}

const CLAVES_OCUPACION: Record<number, string[]> = {
  1: ["sgl"],
  2: ["dbl"],
  3: ["tpl"],
  4: ["cdp", "cpl"],
  5: ["qpl"],
};
const NOMBRE_OCUPACION: Record<number, string> = { 1: "sencilla", 2: "doble", 3: "triple", 4: "cuádruple", 5: "quíntuple" };

interface RangoNino {
  clave: string;
  desde: number;
  hasta: number;
}

/** Rangos de edad con precio propio: salen de las claves (`chd_4_10`), que son
 * las de cada tabla del PDF; si la fila solo trae `chd`, del bloque. */
function rangosNinos(t: Tarifa): RangoNino[] {
  const p = t.precios ?? {};
  const out: RangoNino[] = [];
  for (const clave of Object.keys(p)) {
    const m = /^chd_(\d{1,2})_(\d{1,2})$/.exec(clave);
    if (m && numero(p[clave]) !== null) out.push({ clave, desde: Number(m[1]), hasta: Number(m[2]) });
  }
  const n = bloqueDe(t)?.ninos;
  if (!out.length && numero(p["chd"]) !== null && n?.chd_desde != null && n?.chd_hasta != null) {
    out.push({ clave: "chd", desde: n.chd_desde, hasta: n.chd_hasta });
  }
  return out.sort((a, b) => a.desde - b.desde);
}

type Noche = { ok: true; monto: number; adultos: number } | { ok: false; motivo: MotivoSinEstimado; texto: string };

/** Precio de UNA noche con esta fila. Los niños por encima del rango pagan como
 * adultos (y cuentan para la ocupación); por debajo, no pagan, que es lo que
 * dicen todas las políticas cargadas ("infantes de 0 a 3 años sin costo"). */
function precioNoche(t: Tarifa, e: Estadia): Noche {
  const p = t.precios ?? {};
  const rangos = rangosNinos(t);
  let adultos = e.adultos;
  let ninos = 0;
  let gratis = e.ninosGratis ?? 0;
  for (const edad of e.edades) {
    if (!rangos.length) {
      return { ok: false, motivo: "ninos", texto: "Esta tarifa no publica precio de niños: el asesor lo confirma." };
    }
    const r = rangos.find((x) => edad >= x.desde && edad <= x.hasta);
    if (r) {
      if (gratis > 0) gratis -= 1;
      else ninos += numero(p[r.clave]) as number;
    }
    else if (edad > rangos[rangos.length - 1].hasta) adultos += 1;
    else if (edad >= rangos[0].desde) {
      return { ok: false, motivo: "ninos", texto: `La tarifa no publica precio para un niño de ${edad} años.` };
    }
  }
  const clave = (CLAVES_OCUPACION[adultos] ?? []).find((k) => numero(p[k]) !== null);
  if (!clave) {
    return {
      ok: false,
      motivo: "ocupacion",
      texto:
        adultos > 5
          ? `Para ${adultos} adultos hacen falta varias habitaciones: el asesor arma la combinación.`
          : `Esta habitación no publica tarifa ${NOMBRE_OCUPACION[adultos] ?? ""} (${adultos} adultos).`,
    };
  }
  const v = numero(p[clave]) as number;
  return { ok: true, monto: (porHabitacion(t) ? v : v * adultos) + ninos, adultos };
}

function minimoDe(t: Tarifa): number | null {
  if (t.minimo_noches) return t.minimo_noches;
  const tabla = bloqueDe(t)?.minimo_noches;
  const m = tabla && t.habitacion ? tabla[t.habitacion] : null;
  return m && m > 0 ? m : null;
}

/** Los suplementos obligatorios vienen como texto del PDF (fechas y montos
 * mezclados), así que NO se suman: se avisa cuáles tocan la estadía. */
function avisosSuplementos(usadas: Tarifa[], noches: string[]): string[] {
  const conNavidad = noches.some((n) => n.endsWith("-12-24"));
  const conFinDeAno = noches.some((n) => n.endsWith("-12-31"));
  const avisos = new Set<string>();
  const vistos = new Set<TarifarioBloque>();
  for (const t of usadas) {
    const b = bloqueDe(t);
    if (!b || vistos.has(b)) continue;
    vistos.add(b);
    for (const s of b.suplementos ?? []) {
      if (!s?.obligatorio) continue;
      const txt = normalizar(`${s.temporada ?? ""} ${s.texto ?? ""}`);
      const navidad = txt.includes("navidad");
      const finDeAno = /fin de ano|ano nuevo/.test(txt);
      if (navidad && conNavidad) avisos.add("No incluye la cena de Navidad obligatoria: el asesor la suma al confirmar.");
      if (finDeAno && conFinDeAno) avisos.add("No incluye la cena de Fin de Año obligatoria: el asesor la suma al confirmar.");
      if (!navidad && !finDeAno) avisos.add("No incluye un suplemento obligatorio del hotel: el asesor lo suma al confirmar.");
    }
  }
  return [...avisos];
}

const redondear = (n: number) => Math.round(n * 100) / 100;

/**
 * @param elegida la fila que eligió el cliente (habitación y plan).
 * @param filas todas las filas del hotel; se usan las de la misma habitación,
 *   plan y moneda para las noches que la elegida no cubre.
 */
export function estimarEstadia(elegida: Tarifa, filas: Tarifa[], e: Estadia): Estimado {
  const noches = nochesDeEstadia(e.desde, e.hasta);
  if (!noches.length) return { ok: false, motivo: "fechas", texto: "Elija la fecha de entrada y de salida." };
  if (e.adultos < 1) return { ok: false, motivo: "ocupacion", texto: "Indique al menos un adulto." };

  const clave = grupo(elegida);
  const hermanas = [elegida, ...filas.filter((t) => t.id !== elegida.id && grupo(t) === clave)];

  const segmentos: { tarifa: Tarifa; noches: number; monto: number }[] = [];
  for (const noche of noches) {
    const ms = aFecha(noche);
    const cubren = hermanas
      .map((t) => ({ t, ancho: amplitud(t, ms) }))
      .filter((x): x is { t: Tarifa; ancho: number } => x.ancho !== null);
    if (!cubren.length) {
      return { ok: false, motivo: "sin-tarifa", texto: "El tarifario no publica precio para todas sus noches." };
    }
    const menor = Math.min(...cubren.map((x) => x.ancho));
    const empatadas = cubren.filter((x) => x.ancho === menor).map((x) => x.t);
    const tarifa = empatadas.find((t) => t.id === elegida.id) ?? empatadas[0];
    const precio = precioNoche(tarifa, e);
    if (!precio.ok) return precio;
    // Dos filas igual de específicas con precios distintos y ninguna elegida:
    // no hay forma de saber cuál aplica.
    if (!empatadas.includes(elegida)) {
      const otros = empatadas.slice(1).map((t) => precioNoche(t, e));
      if (otros.some((o) => !o.ok || o.monto !== precio.monto)) {
        return { ok: false, motivo: "sin-tarifa", texto: "El tarifario tiene dos precios para esas noches: el asesor confirma cuál aplica." };
      }
    }
    const ultimo = segmentos[segmentos.length - 1];
    if (ultimo && ultimo.tarifa.id === tarifa.id) {
      ultimo.noches += 1;
      ultimo.monto += precio.monto;
    } else segmentos.push({ tarifa, noches: 1, monto: precio.monto });
  }

  const usadas = segmentos.map((s) => s.tarifa);
  const minimo = Math.max(0, ...usadas.map((t) => minimoDe(t) ?? 0));
  if (minimo > noches.length) {
    return {
      ok: false,
      motivo: "minimo",
      minimo,
      texto: `En esas fechas el hotel pide un mínimo de ${minimo} noches.`,
    };
  }

  const avisos = avisosSuplementos(usadas, noches);
  if (usadas.some((t) => /on request/.test(normalizar(t.habitacion)))) {
    avisos.push("Habitación sujeta a confirmación del hotel (on request).");
  }
  const igtf = usadas.map((t) => bloqueDe(t)?.impuestos?.igtf_pct).find((x) => x != null);
  if (igtf != null) avisos.push(`Si paga en divisas se suma ${igtf}% de IGTF.`);
  if ((e.ninosGratis ?? 0) > 0 && e.edades.length) {
    avisos.push(
      e.edades.length > e.ninosGratis!
        ? `Promoción de niño gratis: ${e.ninosGratis === 1 ? "el primer niño no paga" : `los primeros ${e.ninosGratis} niños no pagan`}; el resto sí.`
        : "Promoción de niño gratis aplicada: el asesor confirma las edades permitidas.",
    );
  }

  const variasTemporadas = segmentos.length > 1;
  const lineas = segmentos.map((s) => ({
    texto:
      `${s.noches} ${s.noches === 1 ? "noche" : "noches"}` +
      (variasTemporadas && s.tarifa.titulo ? `, ${s.tarifa.titulo.toLowerCase()}` : ""),
    monto: redondear(s.monto),
  }));
  return {
    ok: true,
    total: redondear(segmentos.reduce((a, s) => a + s.monto, 0)),
    moneda: monedaDe(elegida),
    noches: noches.length,
    lineas,
    avisos,
  };
}
