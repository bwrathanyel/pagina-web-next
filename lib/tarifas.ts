// Fase 5b: el hotel es una carpeta también en la web pública.
//
// Port 1:1 de los helpers del CRM (`lotus-crm-preview/app.js`, Fase 4/5) para
// que el sitio, el CRM y el bot digan lo MISMO del mismo hotel. Son funciones
// puras a propósito: se usan desde componentes de servidor y de cliente.
//
// Una fila de `tarifas` es UNA promoción (una línea del PDF, o un flyer con
// `origen='flyer'`). Los campos estructurados los escribe la carga maestra;
// mientras no corra vienen NULL y todo cae a `precio_texto`/`vigencia_texto`.
import type { Producto, Tarifa, TarifarioBloque, VentanaTarifa } from "@/types/supabase";
import { formatearPrecioCliente } from "@/lib/utils/formatoPrecio";

const ETIQUETA_ORDEN = ["sgl", "dbl", "tpl", "cdp", "qpl", "pax_adic"];

const simbolo = (moneda?: string | null) => (String(moneda || "USD").toUpperCase() === "EUR" ? "€" : "$");

export function montoConMoneda(valor: number, moneda?: string | null): string {
  const n = Number(valor);
  return simbolo(moneda) + (n % 1 === 0 ? String(n) : n.toFixed(2));
}

// chd_5_9 -> "CHD 5-9". El guion bajo ENTRE DÍGITOS es un rango de edad, no un
// separador de palabras -- mismo criterio que precio_texto_desde() en SQL.
// Después pasa por formatearPrecioCliente: el cliente lee "niño 5-9", no "CHD".
const etiquetaCruda = (clave: string) =>
  String(clave).replace(/(\d)_(\d)/g, "$1-$2").replace(/_/g, " ").toUpperCase();

const normalizar = (texto?: string | null) =>
  String(texto || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function numeroDe(valor: unknown): number | null {
  if (valor === null || valor === undefined || valor === "") return null;
  const n = Number(valor);
  return Number.isNaN(n) ? null : n;
}

/** Las etiquetas salen de las CLAVES de `precios`, no de una lista fija: cada
 * hotel del PDF trae sus propias columnas y una lista cerrada las perdería en
 * silencio. Solo se fija el ORDEN de las conocidas; lo demás va detrás. */
export function preciosLista(t: Tarifa): { clave: string; etiqueta: string; monto: string }[] {
  const p = t?.precios;
  if (!p || typeof p !== "object" || Array.isArray(p)) return [];
  const claves = Object.keys(p).filter((k) => k !== "base" && numeroDe(p[k]) !== null);
  claves.sort((a, b) => {
    const ia = ETIQUETA_ORDEN.indexOf(a);
    const ib = ETIQUETA_ORDEN.indexOf(b);
    if (ia < 0 && ib < 0) return a.localeCompare(b, "es");
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  return claves.map((k) => ({
    clave: k,
    etiqueta: formatearPrecioCliente(etiquetaCruda(k)) ?? etiquetaCruda(k),
    monto: montoConMoneda(numeroDe(p[k]) as number, t.moneda),
  }));
}

/** Espejo en JS de precio_por_persona() (migración 20260904160000). La base
 * declarada gana; si no hay, dbl>sgl = por habitación; sin ninguna de las dos
 * señales NO divide (dividir de más es cotizar de menos). CHD y PAX ADIC nunca
 * compiten: son adicionales, no un precio ofrecible por sí solos. */
export function precioPorPersona(t: Tarifa): number | null {
  const p = t?.precios;
  if (!p || typeof p !== "object" || Array.isArray(p)) return null;
  const sgl = numeroDe(p["sgl"]);
  const dbl = numeroDe(p["dbl"]);
  const declarada = p["base"] === "habitacion" || p["base"] === "persona" ? p["base"] : null;
  const base = declarada ?? (dbl !== null && sgl !== null && dbl > sgl ? "habitacion" : null);
  const porHabitacion = base === "habitacion";
  if (dbl !== null) return porHabitacion ? dbl / 2 : dbl;
  if (sgl !== null) return sgl;
  if (!porHabitacion) return null;
  for (const [clave, divisor] of [["tpl", 3], ["cdp", 4], ["qpl", 5]] as const) {
    const v = numeroDe(p[clave]);
    if (v !== null) return v / divisor;
  }
  return null;
}

/** Precio corto de la tarjeta. Con precios estructurados se anuncia el precio
 * POR PERSONA; sin ellos se mantiene el `precio_texto` de siempre -- el
 * `precio_desde_usd` legacy suele ser el precio de CHD (producto 15: 28, con la
 * fila diciendo $210/$130/$127/$65) y anunciarlo como "Desde" sería cotizar de
 * menos. Mismo criterio que tarBadgePrecio() en el CRM. */
export function badgePrecio(t: Tarifa | null | undefined): string | null {
  if (!t) return null;
  const pp = t.precios ? precioPorPersona(t) : null;
  if (pp !== null) return "Desde " + montoConMoneda(Math.round(pp * 100) / 100, t.moneda) + " por persona";
  return formatearPrecioCliente(t.precio_texto) ?? null;
}

/** DBL como precio titular de la tarjeta: así se promociona en redes ("$75 por
 * persona / noche, ocupación doble"). Espejo de tarPrecioDobleHero() del CRM.
 * `dbl/2` si el precio es por habitación (base declarada, o dbl>sgl), `dbl`
 * tal cual si es por persona. Sin clave `dbl` -> null (la tarjeta usa su grilla
 * o su precio_texto de siempre). */
export function precioDobleHero(t: Tarifa | null | undefined): { monto: string; nota: string } | null {
  const p = t?.precios;
  if (!p || typeof p !== "object" || Array.isArray(p)) return null;
  const dbl = numeroDe(p["dbl"]);
  if (dbl === null) return null;
  const sgl = numeroDe(p["sgl"]);
  const porHabitacion =
    p["base"] === "habitacion" ? true : p["base"] === "persona" ? false : sgl !== null && dbl > sgl;
  const monto = porHabitacion ? dbl / 2 : dbl;
  return {
    monto: montoConMoneda(Math.round(monto * 100) / 100, t?.moneda),
    nota: "por persona / noche · ocupación doble",
  };
}

/** Nombre visible de una promoción = "Hotel · Título". Capa de vista: el
 * `titulo` guardado no se toca. Si el título ya nombra al hotel (substring
 * normalizado) no se antepone el prefijo. Espejo de tarNombrePromo() del CRM. */
export function nombrePromo(p: {
  titulo?: string | null;
  producto?: { nombre?: string | null } | null;
}): string {
  const hotel = p.producto?.nombre || "";
  const titulo = p.titulo || "Promoción";
  if (hotel && !normalizar(titulo).includes(normalizar(hotel))) return `${hotel} · ${titulo}`;
  return titulo;
}

/** Todas las ventanas de disfrute, no solo la última. */
export function ventanasDe(t: Tarifa): [string | null, string | null][] {
  const v: VentanaTarifa[] = Array.isArray(t?.ventanas) ? t.ventanas : [];
  const filas = v
    .map((w) => [w?.desde || null, w?.hasta || null] as [string | null, string | null])
    .filter(([a, b]) => a || b);
  if (filas.length) return filas;
  if (t?.disfrute_desde || t?.fecha_fin) return [[t.disfrute_desde || null, t.fecha_fin || null]];
  return [];
}

const FECHA_CORTA = new Intl.DateTimeFormat("es-VE", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
// Las fechas llegan como 'YYYY-MM-DD' (date de Postgres). Interpretarlas en la
// zona local corre un día en Venezuela (UTC-4): se fuerza UTC en los dos lados.
export const fechaCorta = (iso: string) => FECHA_CORTA.format(new Date(`${iso}T00:00:00Z`));

export function rangoFechas([desde, hasta]: [string | null, string | null]): string {
  if (desde && hasta) return `${fechaCorta(desde)} — ${fechaCorta(hasta)}`;
  if (desde) return `desde ${fechaCorta(desde)}`;
  if (hasta) return `hasta ${fechaCorta(hasta)}`;
  return "";
}

/** `fecha_venta_fin` es el puente con las filas viejas (las que todavía no
 * pasaron por la carga maestra): el dato estructurado gana cuando existe. */
export const ventaHasta = (t: Tarifa | null | undefined) => t?.venta_hasta || t?.fecha_venta_fin || null;

/** Vendible hoy = venta abierta y disfrute no vencido. MISMO criterio que
 * tarifa_destacada() en SQL. En la web pública anónima casi todas lo son (la
 * policy `tarifas_select_publico` ya filtra por esas fechas), pero el admin del
 * sitio sí ve las apagadas: se muestran, no se esconden. */
export function vendibleHoy(t: Tarifa | null | undefined): boolean {
  if (!t || t.vigente === false) return false;
  const hoy = new Date().toISOString().slice(0, 10);
  const vh = ventaHasta(t);
  if (vh && vh < hoy) return false;
  if (t.fecha_fin && t.fecha_fin < hoy) return false;
  return true;
}

/** PostgREST devuelve la relación muchos-a-uno como objeto, pero se acepta el
 * array por si el embed llega como lista. */
export function bloqueDe(t: Tarifa | null | undefined): TarifarioBloque | null {
  const b = t?.tarifario_bloques;
  if (!b) return null;
  return Array.isArray(b) ? b[0] ?? null : b;
}

/** Un suplemento aplica a ESTA tarjeta si no nombra temporada (vale para todas)
 * o si su temporada aparece en el título de la promoción. El suplemento de
 * Navidad no se le cuelga a la tarifa REGULAR. */
export function suplementosDe(t: Tarifa) {
  const sups = bloqueDe(t)?.suplementos;
  if (!Array.isArray(sups) || !sups.length) return [];
  const contexto = normalizar([t.titulo, t.habitacion, t.plan].filter(Boolean).join(" "));
  return sups.filter((s) => s && (!s.temporada || contexto.includes(normalizar(s.temporada))));
}

export function suplementoTexto(
  s: NonNullable<TarifarioBloque["suplementos"]>[number],
  moneda?: string | null,
): string {
  const montos = [
    s.adt != null ? "adultos " + montoConMoneda(s.adt, moneda) : null,
    s.chd != null ? "niños " + montoConMoneda(s.chd, moneda) : null,
  ]
    .filter(Boolean)
    .join(" / ");
  return [s.temporada, montos || s.texto].filter(Boolean).join(": ");
}

/** Resumen de condiciones EN LA TARJETA: solo lo que cambia lo que paga el
 * cliente. Lo completo vive plegado en la cabecera de la carpeta. */
export function condicionesResumen(t: Tarifa): { texto: string; fuerte: boolean }[] {
  const b = bloqueDe(t);
  const out: { texto: string; fuerte: boolean }[] = [];
  suplementosDe(t).forEach((s) =>
    out.push({
      texto: (s.obligatorio ? "Suplemento obligatorio — " : "Suplemento — ") + suplementoTexto(s, t.moneda),
      fuerte: !!s.obligatorio,
    }),
  );
  const minimo = t.minimo_noches ?? (b?.minimo_noches && t.habitacion ? b.minimo_noches[t.habitacion] : null);
  if (minimo) out.push({ texto: `Mínimo ${minimo} noche${minimo > 1 ? "s" : ""}`, fuerte: false });
  (b?.ocupacion?.lineas ?? [])
    .filter((l) => t.habitacion && normalizar(l).includes(normalizar(t.habitacion)))
    .forEach((l) => out.push({ texto: l, fuerte: false }));
  if (b?.impuestos?.igtf_pct != null) {
    out.push({ texto: `Adicionar ${b.impuestos.igtf_pct}% IGTF`, fuerte: true });
  }
  return out;
}

/** Cuál de las N filas del hotel representa al hotel. La elige la BASE, no el
 * navegador (`tarifa_destacada_id`); `tarifas[0]` es solo el respaldo para una
 * consulta que no pidió esa columna. */
export function tarifaDestacada(producto: Pick<Producto, "tarifas" | "tarifa_destacada_id"> | null | undefined): Tarifa | null {
  const tarifas = producto?.tarifas ?? [];
  if (!tarifas.length) return null;
  if (producto?.tarifa_destacada_id != null) {
    const destacada = tarifas.find((t) => t.id === producto.tarifa_destacada_id);
    if (destacada) return destacada;
  }
  return tarifas[0];
}

/** Las N filas del hotel agrupadas por plan (Todo Incluido / Solo Desayuno).
 * La destacada va primera; el plan que la contiene, también. */
export function agruparPorPlan(
  tarifas: Tarifa[],
  destacadaId: number | null,
): { plan: string; tarifas: Tarifa[] }[] {
  const grupos = new Map<string, Tarifa[]>();
  tarifas.forEach((t) => {
    const clave = t.plan || "Sin plan indicado";
    if (!grupos.has(clave)) grupos.set(clave, []);
    grupos.get(clave)!.push(t);
  });
  for (const filas of grupos.values()) {
    filas.sort(
      (a, b) =>
        Number(b.id === destacadaId) - Number(a.id === destacadaId) ||
        Number(vendibleHoy(b)) - Number(vendibleHoy(a)) ||
        (a.orden_pdf ?? 0) - (b.orden_pdf ?? 0) ||
        a.id - b.id,
    );
  }
  return [...grupos.keys()]
    .sort(
      (a, b) =>
        Number(grupos.get(b)!.some((t) => t.id === destacadaId)) -
          Number(grupos.get(a)!.some((t) => t.id === destacadaId)) || a.localeCompare(b, "es"),
    )
    .map((plan) => ({ plan, tarifas: grupos.get(plan)! }));
}

/** Un bloque por plan del hotel, sin repetir: todas las tarifas de un plan
 * apuntan al mismo. */
export function bloquesDe(producto: Pick<Producto, "tarifas"> | null | undefined): TarifarioBloque[] {
  const vistos = new Map<number, TarifarioBloque>();
  (producto?.tarifas ?? []).forEach((t) => {
    const b = bloqueDe(t);
    if (b && b.id != null && !vistos.has(b.id)) vistos.set(b.id, b);
  });
  return [...vistos.values()];
}
