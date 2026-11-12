// Estimado de una estadía para /cotizar y el precio de los paquetes.
//
// Función pura, sin alias de rutas: la prueban `node --test` y los componentes
// de cliente por igual. Nunca un número inventado: si algo no se puede calcular
// con lo que publica el tarifario, el resultado es `ok: false` con el motivo y
// la web muestra "Precio a confirmar por el asesor".
//
// Desde 2026-11-12 el precio del hotel sale del MISMO motor que la sección
// Cotizaciones del CRM (`motor-crm.generado.js`, copiado de lotus-crm-preview/app.js
// por scripts/sync-cotizador-servidor.mjs del repo CRM), igual que el bot de ventas
// y cotizador-chat: unidad persona/habitación, temporadas noche por noche, mínimo de
// noches, reparto en varias habitaciones y desempate por día de semana. Acá solo se
// traducen las edades a lo que el asesor cargaría (adultos, niños, infantes) y se
// cobran los niños.
import type { Tarifa, TarifarioBloque } from "@/types/supabase";
import { motorCotizacionWeb } from "./motor-crm.generado.js";

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

type Fallo = Extract<Estimado, { ok: false }>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const m: any = motorCotizacionWeb();

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

/** Claves de niño de la fila: `chd_5_10`, `2do_chd_5_10`, `1er_chd_5_10`
 * (ordinal 0 = sin orden). Si la fila solo trae `chd`, el rango sale del bloque. */
interface ClaveNino {
  ordinal: number;
  desde: number;
  hasta: number;
  precio: number | null;
}
function clavesNinos(t: Tarifa): ClaveNino[] {
  const p = t.precios ?? {};
  const out: ClaveNino[] = [];
  for (const [clave, valor] of Object.entries(p)) {
    const r = /^(?:(\d+)(?:er|do|to)_)?chd_(\d{1,2})_(\d{1,2})$/.exec(clave);
    if (r) out.push({ ordinal: Number(r[1]) || 0, desde: Number(r[2]), hasta: Number(r[3]), precio: numero(valor) });
  }
  const n = bloqueDe(t)?.ninos;
  if (!out.length && numero(p["chd"]) !== null && n?.chd_desde != null && n?.chd_hasta != null) {
    out.push({ ordinal: 0, desde: n.chd_desde, hasta: n.chd_hasta, precio: numero(p["chd"]) });
  }
  return out;
}

/** Edad hasta la que el hotel no cobra al infante (`ninos.gratis_hasta` del
 * bloque, inclusive). Solo se cree entre 0 y 5: más arriba el parser mezcló una
 * promoción de temporada baja ("niños de 0 a 10 sin costo") o meses ("0 a 23
 * meses"), y tratarlo como edad regalaría el precio de niños. */
function infantesGratisHasta(t: Tarifa): number | null {
  const g = numero(bloqueDe(t)?.ninos?.gratis_hasta);
  return g !== null && g >= 0 && g <= 5 ? g : null;
}

/** Lo que el asesor cargaría en Cotizaciones: el niño por encima del rango de
 * la tarifa va como adulto y el que está debajo (o dentro de la política de
 * infantes del hotel) como infante, que no paga. */
function pasajeros(t: Tarifa, e: Estadia): { adultos: number; ninos: number[] } | Fallo {
  const gratisHasta = infantesGratisHasta(t);
  if (e.bebes > 0 && gratisHasta !== null && gratisHasta < 1) {
    return { ok: false, motivo: "ninos", texto: "Esta tarifa cobra a los bebés: el asesor lo confirma." };
  }
  const claves = clavesNinos(t);
  const minimo = claves.length ? Math.min(...claves.map((c) => c.desde)) : null;
  const maximo = claves.length ? Math.max(...claves.map((c) => c.hasta)) : null;
  let adultos = e.adultos;
  const ninos: number[] = [];
  for (const edad of e.edades) {
    if (gratisHasta !== null && edad <= gratisHasta) continue;
    if (maximo !== null && edad > maximo) adultos += 1;
    else if (minimo !== null && edad < minimo) continue;
    else ninos.push(edad);
  }
  return { adultos, ninos };
}

/** Precio por noche de cada niño con esta fila, en el orden de la lista; null = a confirmar.
 * Sin claves 1ER/2DO: precio único del motor del CRM (cbTarPrecioNino) y, si no lo hay,
 * precio por rango de edad. Con 1ER/2DO: precio por orden, como el bot de ventas (el
 * `chd_` sin orden es el primero y vacío = FREE, regla del dueño para Margarita
 * Village; del 3ro en adelante, el 2do), solo con una habitación o un solo niño porque
 * con más no se sabe con quién va cada niño. */
function preciosNinos(t: Tarifa, edades: number[], habitaciones: number): number[] | null {
  if (!edades.length) return [];
  const claves = clavesNinos(t);
  const unico = m.cbTarPrecioNino(t, edades.length).precio as number | null;
  // Con 1ER/2DO el precio único del motor ignora el primero vacío (FREE) y cobraría
  // el 2do a todos: Margarita Village Navidad 2A+2N daba 1792 y el dueño fijó 1492.
  const conOrden = claves.some((c) => c.ordinal >= 2);
  if (unico !== null && !conOrden) return edades.map(() => unico);
  const enRango = (c: ClaveNino, edad: number) => edad >= c.desde && edad <= c.hasta;
  // Un solo niño es el 1ro de su habitación aunque haya varias (5A+1N fin de año = 3799).
  if ((habitaciones === 1 || edades.length === 1) && conOrden) {
    // El 3er niño en adelante paga el último orden publicado (el 2do).
    const porOrden = edades.map((edad, i) => {
      const delOrden = (o: number) => claves.filter((c) => enRango(c, edad) && (o === 1 ? c.ordinal <= 1 : c.ordinal === o));
      let orden = i + 1;
      let aplican = delOrden(orden);
      while (!aplican.length && orden > 2) aplican = delOrden(--orden);
      const valores = aplican.map((c) => (c.precio === null && orden === 1 ? 0 : c.precio));
      return valores.length && valores.every((v) => v !== null && v === valores[0]) ? valores[0] : null;
    });
    if (porOrden.every((p) => p !== null)) return porOrden as number[];
  }
  const porEdad = edades.map((edad) => {
    const aplican = claves.filter((c) => c.ordinal === 0 && enRango(c, edad) && c.precio !== null);
    return aplican.length && aplican.every((c) => c.precio === aplican[0].precio) ? aplican[0].precio : null;
  });
  return porEdad.every((p) => p !== null) ? (porEdad as number[]) : null;
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

const firmaVentanas = (t: Tarifa) =>
  ventanas(t)
    .map(([a, b]) => `${a}-${b}`)
    .join(",");

/**
 * Una tarjeta por habitación en un plan. Las filas de una habitación con
 * fechas distintas son temporadas de la misma oferta y van en una sola tarjeta
 * (se muestra la que cubre la entrada; si ninguna, la primera del orden del
 * tarifario). Dos filas con las MISMAS fechas son dos tablas distintas del PDF:
 * se muestra solo la primera.
 */
export function tarjetasPorHabitacion(tarifas: Tarifa[], desde: string): { tarifa: Tarifa; filas: Tarifa[] }[] {
  const grupos = new Map<string, Tarifa[][]>();
  for (const t of tarifas) {
    const k = normalizar(t.habitacion) || `#${t.id}`;
    const series = grupos.get(k) ?? [];
    // Misma habitación y mismas fechas = otra tabla del PDF (en Venetur, la de
    // solo desayuno detrás de la de todo incluido). El dueño pidió una sola
    // tarjeta por habitación para no confundir: queda la primera del tarifario.
    if (series.some((s) => s.some((x) => firmaVentanas(x) === firmaVentanas(t)))) continue;
    const serie = series[0];
    if (serie) serie.push(t);
    else series.push([t]);
    grupos.set(k, series);
  }
  const entrada = desde ? aFecha(desde) : NaN;
  return [...grupos.values()].flat().map((filas) => {
    if (Number.isNaN(entrada)) return { tarifa: filas[0], filas };
    let mejor: Tarifa | null = null;
    let ancho = Infinity;
    for (const t of filas) {
      const a = amplitud(t, entrada);
      if (a !== null && (mejor === null || a < ancho)) [mejor, ancho] = [t, a];
    }
    return { tarifa: mejor ?? filas[0], filas };
  });
}

// Los textos del motor le hablan al asesor («Sube Habitaciones», «escribe la tarifa
// manual»): el cliente ve el motivo con sus palabras.
function falloDelMotor(texto: string): Fallo {
  const t = normalizar(texto);
  const minimo = /minimo (\d+) noches/.exec(t);
  if (minimo) return { ok: false, motivo: "minimo", minimo: Number(minimo[1]), texto: `En esas fechas el hotel pide un mínimo de ${minimo[1]} noches.` };
  if (t.includes("minimo de noches")) return { ok: false, motivo: "minimo", texto: "En esas fechas el hotel pide un mínimo de noches: el asesor lo confirma." };
  if (t.includes("precios distintos")) {
    return { ok: false, motivo: "sin-tarifa", texto: "El tarifario tiene dos precios para esas noches: el asesor confirma cuál aplica." };
  }
  if (/adulto|ocupacion|variante|habitaciones/.test(t)) {
    return { ok: false, motivo: "ocupacion", texto: "Esta habitación no publica tarifa para esa ocupación: el asesor arma la combinación." };
  }
  return { ok: false, motivo: "sin-tarifa", texto: "El tarifario no publica precio para todas sus noches." };
}

const SIN_HABITACION = "Habitación";

// Lo mismo que armarHotel (supabase/functions/_shared/hotel-cotizacion.ts) y que hace
// el asesor al elegir el hotel en Cotizaciones sin tocar nada.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function armar(elegida: Tarifa, filas: Tarifa[], desde: string, hasta: string, adultos: number): { ok: true; it: any; filas: Tarifa[] } | Fallo {
  const hoy = m.cbHoy();
  const copias = filas.map((t) => ({ ...t, vigente: t.vigente ?? true, habitacion: t.habitacion?.trim() ? t.habitacion : SIN_HABITACION }));
  if (!copias.some((t) => t.id === elegida.id)) {
    copias.push({ ...elegida, vigente: elegida.vigente ?? true, habitacion: elegida.habitacion?.trim() ? elegida.habitacion : SIN_HABITACION });
  }
  m.cbMarcarPreventas(copias, hoy);
  const utiles = copias.filter((t) => m.cbTarUtil(t, hoy));
  const propia = copias.find((t) => t.id === elegida.id)!;
  const hab = propia.habitacion as string;
  // El plan de la fila que eligió el cliente, aunque esté vacío: con otro plan el motor
  // descarta justo esa fila (H2otel, temporada media sin régimen cargado).
  const plan = m.cbTarPlan(propia) || "";
  m.cbTarAnotarUnidades(utiles);
  const it = {
    tipo: "hotel", ida: desde, vuelta: hasta, adultos, ninos: 0, infantes: 0, unidad: "persona_noche", habitaciones: 1,
    infantes_gratis: true, tarifa_nino_auto: true, plan, hab, tarifa_variante: "",
  };
  m.cbHotelUnidad(it, utiles);
  if (it.vuelta !== hasta) {
    const n = nochesDeEstadia(desde, it.vuelta).length;
    return { ok: false, motivo: "sin-tarifa", texto: `Este paquete es de ${n} ${n === 1 ? "noche" : "noches"}: el asesor ajusta la salida.` };
  }
  const s = m.cbTarSugerir(it, utiles, hoy, m.TAR_OCUPACION);
  if (!s.ok) return falloDelMotor(String(s.texto ?? ""));
  return { ok: true, it: { ...it, tramos: s.tramos }, filas: utiles };
}

/**
 * @param elegida la fila que eligió el cliente (habitación y plan).
 * @param filas todas las filas del hotel; el motor toma las de la misma
 *   habitación y plan para cada noche.
 */
export function estimarEstadia(elegida: Tarifa, filas: Tarifa[], e: Estadia): Estimado {
  const noches = nochesDeEstadia(e.desde, e.hasta);
  if (!noches.length) return { ok: false, motivo: "fechas", texto: "Elija la fecha de entrada y de salida." };
  if (e.adultos < 1) return { ok: false, motivo: "ocupacion", texto: "Indique al menos un adulto." };

  const pax = pasajeros(elegida, e);
  if ("ok" in pax) return pax;
  // El checkout cobra toda la estadía a una sola tasa (EUR = bolívares a tasa euro):
  // solo entran las temporadas de la moneda de la fila elegida.
  filas = filas.filter((t) => monedaDe(t) === monedaDe(elegida));

  let r = armar(elegida, filas, e.desde, e.hasta, pax.adultos);
  // Dos filas de la misma habitación que se pisan y el motor no sabe separar (Venetur
  // por persona y por habitación; Hesperia preventa y temporada baja): en Cotizaciones
  // el asesor elige una a mano; acá ya la eligió el cliente en la tarjeta.
  if (!r.ok && r.motivo === "sin-tarifa") {
    const propias = ventanas(elegida);
    const otraTabla = (t: Tarifa) =>
      t.id !== elegida.id &&
      normalizar(t.habitacion) === normalizar(elegida.habitacion) &&
      ventanas(t).some(([a, b]) => propias.some(([c, d]) => a <= d && c <= b));
    if (filas.some(otraTabla)) {
      const solo = armar(elegida, filas.filter((t) => !otraTabla(t)), e.desde, e.hasta, pax.adultos);
      if (solo.ok) r = solo;
    }
  }
  if (!r.ok) return r;

  const { it } = r;
  const habitaciones = Number(m.cbHabitaciones(it)) || 1;
  const gratis = e.ninosGratis ?? 0;
  const ninosGratisDe = (precios: number[]) => precios.map((p, i) => (i < gratis ? 0 : p));
  const usadas: Tarifa[] = [];
  const lineas: { texto: string; monto: number; titulo: string | null }[] = [];
  for (const tr of it.tramos) {
    const t = r.filas.find((x) => x.id === tr.tarifa_id)!;
    usadas.push(t);
    const adultos = m.cbTotalItems([{ ...it, tramos: [tr] }]) as number;
    const precios = preciosNinos(t, pax.ninos, habitaciones);
    if (!precios) return { ok: false, motivo: "ninos", texto: "Esta tarifa no publica precio de niños: el asesor lo confirma." };
    const ninos = ninosGratisDe(precios).reduce((s, p) => s + p, 0) * (tr.paquete ? 1 : Number(tr.noches));
    const n = Number(tr.noches);
    lineas.push({ texto: `${n} ${n === 1 ? "noche" : "noches"}`, monto: adultos + ninos, titulo: t.titulo ?? null });
  }

  const avisos = avisosSuplementos(usadas, noches);
  if (habitaciones > 1) avisos.push(`Para ${pax.adultos} adultos se cotizan ${habitaciones} habitaciones.`);
  if (/on request/i.test(String(it.hab))) avisos.push("Habitación sujeta a confirmación del hotel (on request).");
  const igtf = usadas.map((t) => bloqueDe(t)?.impuestos?.igtf_pct).find((x) => x != null);
  if (igtf != null) avisos.push(`Si paga en divisas se suma ${igtf}% de IGTF.`);
  if ((e.ninosGratis ?? 0) > 0 && e.edades.length) {
    avisos.push(
      e.edades.length > e.ninosGratis!
        ? `Promoción de niño gratis: ${e.ninosGratis === 1 ? "el primer niño no paga" : `los primeros ${e.ninosGratis} niños no pagan`}; el resto sí.`
        : "Promoción de niño gratis aplicada: el asesor confirma las edades permitidas.",
    );
  }

  const variasTemporadas = lineas.length > 1;
  return {
    ok: true,
    total: redondear(lineas.reduce((a, l) => a + l.monto, 0)),
    moneda: monedaDe(elegida),
    noches: noches.length,
    lineas: lineas.map((l) => ({
      texto: l.texto + (variasTemporadas && l.titulo ? `, ${l.titulo.toLowerCase()}` : ""),
      monto: redondear(l.monto),
    })),
    avisos,
  };
}
