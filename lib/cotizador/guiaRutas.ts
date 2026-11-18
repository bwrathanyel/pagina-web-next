// Guía orientativa de rutas aéreas: qué aerolíneas suelen volar cada ruta y qué días.
// Fuente: vista `web_rutas_aereas` (boletería la mantiene en el CRM; la carga inicial
// cita su fuente pública por fila). Nada de horarios: cambian por día y temporada.

export type RutaAerea = {
  origen_iata: string;
  origen_nombre: string;
  destino_iata: string;
  destino_nombre: string;
  aerolinea: string;
  /** Texto libre del CRM ("lunes", "mar", "diario"…). Vacío = días a confirmar. */
  dias_operacion: string[];
  verificado_en: string | null;
  nota: string | null;
};

/** Índice = Date#getUTCDay (0 = domingo). */
const NOMBRES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"] as const;
const PLURAL = ["domingos", "lunes", "martes", "miércoles", "jueves", "viernes", "sábados"] as const;
/** Semana de lunes a domingo. */
const ORDEN = [1, 2, 3, 4, 5, 6, 0];
const PREFIJOS: readonly [string, number][] = [
  ["lu", 1],
  ["ma", 2],
  ["mi", 3],
  ["ju", 4],
  ["vi", 5],
  ["sa", 6],
  ["do", 0],
];
const TODOS = /^(diario|todos|todos los dias|todos los días|a diario)$/;

const sinAcentos = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

function diaDeTexto(t: string): number | null {
  const s = sinAcentos(t).toLowerCase().replace(/\./g, "").trim();
  if (s.length < 2) return null;
  return PREFIJOS.find(([p]) => s.startsWith(p))?.[1] ?? null;
}

/** Lee los días del CRM: nombres, abreviaturas, «diario» y rangos («mar-dom», «martes a domingo»). */
export function leerDias(crudos: readonly string[]): { dias: number[]; otros: string[] } {
  const set = new Set<number>();
  const otros: string[] = [];
  for (const crudo of crudos) {
    const t = crudo.trim();
    if (!t) continue;
    if (TODOS.test(sinAcentos(t).toLowerCase())) {
      ORDEN.forEach((d) => set.add(d));
      continue;
    }
    const rango = sinAcentos(t).toLowerCase().split(/\s*(?:-|–| a )\s*/);
    if (rango.length === 2) {
      const a = diaDeTexto(rango[0]);
      const b = diaDeTexto(rango[1]);
      if (a !== null && b !== null) {
        const i = ORDEN.indexOf(a);
        const j = ORDEN.indexOf(b);
        for (let k = i; k !== (j + 1) % 7; k = (k + 1) % 7) set.add(ORDEN[k]);
        set.add(b);
        continue;
      }
    }
    const d = diaDeTexto(t);
    if (d === null) otros.push(t);
    else set.add(d);
  }
  return { dias: ORDEN.filter((d) => set.has(d)), otros };
}

export function listaNatural(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;
}

const mayuscula = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/** «Todos los días», «Martes a domingo» o «Lunes, martes, jueves y domingo». */
export function textoDias(dias: readonly number[]): string {
  if (!dias.length) return "";
  if (dias.length === 7) return "Todos los días";
  const pos = dias.map((d) => ORDEN.indexOf(d)).sort((a, b) => a - b);
  const seguidos = pos.every((p, i) => i === 0 || p === pos[i - 1] + 1);
  if (seguidos && pos.length >= 3) return `${mayuscula(NOMBRES[ORDEN[pos[0]]])} a ${NOMBRES[ORDEN[pos[pos.length - 1]]]}`;
  return mayuscula(listaNatural(pos.map((p) => NOMBRES[ORDEN[p]])));
}

/** Texto de días de una fila: lo leído, lo que no se entendió tal cual, o «Días a confirmar». */
export function textoDiasFila(r: RutaAerea): string {
  const { dias, otros } = leerDias(r.dias_operacion);
  const partes = [textoDias(dias), ...otros].filter(Boolean);
  return partes.length ? partes.join(", ") : "Días a confirmar";
}

export type GrupoOrigen = { origenIata: string; origenNombre: string; filas: RutaAerea[] };

/** Rutas hacia un destino agrupadas por origen; el origen elegido va primero. Las filas con días van antes. */
export function rutasHacia(rutas: readonly RutaAerea[], destinoIata: string, origenPrimero?: string): GrupoOrigen[] {
  const grupos = new Map<string, GrupoOrigen>();
  for (const r of rutas) {
    if (r.destino_iata !== destinoIata) continue;
    const g = grupos.get(r.origen_iata) ?? { origenIata: r.origen_iata, origenNombre: r.origen_nombre, filas: [] };
    g.filas.push(r);
    grupos.set(r.origen_iata, g);
  }
  const conDias = (r: RutaAerea) => (leerDias(r.dias_operacion).dias.length ? 0 : 1);
  return [...grupos.values()]
    .map((g) => ({ ...g, filas: [...g.filas].sort((a, b) => conDias(a) - conDias(b) || a.aerolinea.localeCompare(b.aerolinea, "es")) }))
    .sort((a, b) => (a.origenIata === origenPrimero ? -1 : b.origenIata === origenPrimero ? 1 : a.origenNombre.localeCompare(b.origenNombre, "es")));
}

/** Fecha de verificación más reciente, como «noviembre de 2026». */
export function textoActualizado(rutas: readonly RutaAerea[]): string | null {
  const ultima = rutas.map((r) => r.verificado_en).filter((f): f is string => !!f).sort().pop();
  if (!ultima) return null;
  const [anio, mes] = ultima.split("-").map(Number);
  const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  return meses[mes - 1] ? `${meses[mes - 1]} de ${anio}` : null;
}

export function diaSemana(iso: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const t = Date.parse(`${iso}T00:00:00Z`);
  return Number.isNaN(t) ? null : new Date(t).getUTCDay();
}

export type Recomendacion =
  | { tipo: "hay"; dia: number; aerolineas: string[]; origenNombre: string; destinoNombre: string }
  | { tipo: "no"; dia: number; habituales: number[]; parcial: boolean; origenNombre: string; destinoNombre: string };

/** Cruza la fecha del vuelo con los días conocidos de la ruta. null = sin datos para decir algo. */
export function recomendacionDia(
  rutas: readonly RutaAerea[],
  origenIata: string | undefined,
  destinoIata: string | undefined,
  fecha: string | null | undefined,
): Recomendacion | null {
  if (!origenIata || !destinoIata || !fecha) return null;
  const dia = diaSemana(fecha);
  if (dia === null) return null;
  const filas = rutas.filter((r) => r.origen_iata === origenIata && r.destino_iata === destinoIata);
  const conocidas = filas.map((r) => ({ r, dias: leerDias(r.dias_operacion).dias })).filter((x) => x.dias.length);
  if (!conocidas.length) return null;
  const { origen_nombre: origenNombre, destino_nombre: destinoNombre } = filas[0];
  const vuelan = conocidas.filter((x) => x.dias.includes(dia)).map((x) => x.r.aerolinea);
  if (vuelan.length) return { tipo: "hay", dia, aerolineas: vuelan, origenNombre, destinoNombre };
  const habituales = ORDEN.filter((d) => conocidas.some((x) => x.dias.includes(d)));
  return { tipo: "no", dia, habituales, parcial: conocidas.length < filas.length, origenNombre, destinoNombre };
}

export const nombreDia = (d: number) => NOMBRES[d];
export const pluralDia = (d: number) => PLURAL[d];

/** Frase para el cliente. `tramo` = «la ida» / «la vuelta» cuando se muestran las dos. */
export function textoRecomendacion(r: Recomendacion, tramo?: string): string {
  const pre = tramo ? `Para ${tramo}: ` : "";
  return mayuscula(cuerpoRecomendacion(r, pre));
}

function cuerpoRecomendacion(r: Recomendacion, pre: string): string {
  if (r.tipo === "hay") {
    return `${pre}los ${pluralDia(r.dia)} suelen volar ${listaNatural(r.aerolineas)} de ${r.origenNombre} a ${r.destinoNombre}.`;
  }
  const entre = r.parcial ? " entre las aerolíneas con días publicados" : "";
  return (
    `${pre}los ${pluralDia(r.dia)} no suelen salir vuelos de ${r.origenNombre} a ${r.destinoNombre}${entre}. ` +
    `Suelen salir: ${textoDias(r.habituales).toLowerCase()}. Si puede, mueva la fecha del vuelo; el asesor de boletería lo confirma.`
  );
}
