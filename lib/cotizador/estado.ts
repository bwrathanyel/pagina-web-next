// Estado del cotizador "Arme su viaje". Vive en la URL (compartir, recargar,
// volver): este módulo lo lee y lo escribe. Es puro y no importa nada, así se
// prueba con `node --test` (lib/cotizador/estado.test.ts).
//
// La URL la puede escribir cualquiera: todo lo que no sea un valor conocido se
// descarta o se corrige, nunca se confía.

export type Servicio = "hospedaje" | "vuelo" | "tours";
export type TipoVuelo = "ida" | "ida-vuelta";

export const SERVICIOS: readonly { id: Servicio; etiqueta: string }[] = [
  { id: "hospedaje", etiqueta: "Hospedaje" },
  { id: "vuelo", etiqueta: "Vuelo" },
  { id: "tours", etiqueta: "Full day y tours" },
];

export const DESTINOS: readonly string[] = [
  "Isla de Margarita",
  "Morrocoy",
  "Los Roques",
  "Mérida",
  "Canaima",
  "Catatumbo",
  "Colonia Tovar",
  "Extranjero",
];
export const DESTINO_INICIAL = DESTINOS[0];

export const ORIGENES_VUELO: readonly { valor: string; etiqueta: string }[] = [
  { valor: "Valencia", etiqueta: "Valencia (VLN)" },
  { valor: "Caracas", etiqueta: "Caracas (CCS)" },
  { valor: "Maracaibo", etiqueta: "Maracaibo (MAR)" },
  { valor: "Barcelona", etiqueta: "Barcelona (BLA)" },
  { valor: "Isla de Margarita", etiqueta: "Isla de Margarita (PMV)" },
];
export const ORIGEN_INICIAL = ORIGENES_VUELO[0].valor;

export type Equipaje = "mano" | "maleta" | "dos";
export const EQUIPAJES: readonly { valor: Equipaje; etiqueta: string }[] = [
  { valor: "mano", etiqueta: "Solo equipaje de mano" },
  { valor: "maleta", etiqueta: "1 maleta por persona" },
  { valor: "dos", etiqueta: "2 maletas por persona" },
];
export const EQUIPAJE_INICIAL: Equipaje = "maleta";
/** Tours que caben en un viaje: el asesor arma la propuesta, no un catálogo entero. */
export const TOURS_MAX = 6;

export const ADULTOS_MAX = 20;
export const NINOS_MAX = 4;
export const BEBES_MAX = 2;
export const EDAD_NINO_MIN = 2;
export const EDAD_NINO_MAX = 11;
/** Edad que se muestra hasta que el cliente elija la real. */
export const EDAD_NINO_INICIAL = 5;

export interface EstadoViaje {
  servicios: Servicio[];
  destino: string;
  desde: string;
  hasta: string;
  adultos: number;
  ninos: number;
  bebes: number;
  /** Una edad por niño, siempre del mismo largo que `ninos`. */
  edades: number[];
  hotel: number | null;
  tarifa: number | null;
  origen: string;
  vuelo: TipoVuelo;
  /** Fechas propias del vuelo; vacías = las mismas del viaje. */
  vueloDesde: string;
  vueloHasta: string;
  equipaje: Equipaje;
  /** Acepta mover el vuelo unos días para conseguir mejor precio. */
  flexible: boolean;
  /** Ids de productos (full day y tours) agregados al viaje. */
  tours: number[];
}

export type ParamsBusqueda = Record<string, string | string[] | undefined>;

// ---- fechas (UTC para que la zona del navegador no corra un día) ----

/** Hoy en Caracas como "AAAA-MM-DD". */
export const hoyCaracas = (ahora = new Date()) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Caracas" }).format(ahora);

export function sumarDias(iso: string, n: number) {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function contarNoches(entrada: string, salida: string) {
  if (!entrada || !salida || salida <= entrada) return 0;
  return Math.round((Date.parse(`${salida}T00:00:00Z`) - Date.parse(`${entrada}T00:00:00Z`)) / 86_400_000);
}

/** 3 noches -> "4 días · 3 noches". */
export function textoDuracion(noches: number) {
  const dias = noches + 1;
  return `${dias} ${dias === 1 ? "día" : "días"} · ${noches} ${noches === 1 ? "noche" : "noches"}`;
}

const esFechaViaje = (v: string | undefined, hoy: string): v is string =>
  !!v && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) && v >= hoy;

// ---- lectura ----

const uno = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

function entero(v: string | undefined, min: number, max: number): number | null {
  if (v == null || !/^\d+$/.test(v)) return null;
  const n = Number(v);
  return n >= min && n <= max ? n : null;
}

function idPositivo(v: string | undefined): number | null {
  const n = entero(v, 1, 2_147_483_647);
  return n;
}

// Servicios de los enlaces viejos (`servicio=` del cotizador rápido del hero y
// de las rutas /cotizar/[tipo]) traducidos a los combinables de ahora.
const SERVICIO_LEGADO: Record<string, Servicio[]> = {
  hospedaje: ["hospedaje"],
  fullday: ["tours"],
  vuelos: ["vuelo"],
  boleteria: ["vuelo"],
  paquete: ["hospedaje", "vuelo"],
};

function leerServicios(sp: ParamsBusqueda): Servicio[] {
  const ids = SERVICIOS.map((s) => s.id);
  const lista = new Set<Servicio>();
  for (const parte of (uno(sp.servicios) ?? "").split(",")) {
    const id = parte.trim();
    if ((ids as string[]).includes(id)) lista.add(id as Servicio);
  }
  if (lista.size === 0) for (const s of SERVICIO_LEGADO[uno(sp.servicio) ?? ""] ?? []) lista.add(s);
  return ordenarServicios([...lista]);
}

const ordenarServicios = (l: Servicio[]) => SERVICIOS.map((s) => s.id).filter((id) => l.includes(id));

export function ajustarEdades(edades: number[], ninos: number): number[] {
  return Array.from({ length: ninos }, (_, i) => edades[i] ?? EDAD_NINO_INICIAL);
}

export function estadoInicial(): EstadoViaje {
  return {
    servicios: ["hospedaje"],
    destino: DESTINO_INICIAL,
    desde: "",
    hasta: "",
    adultos: 2,
    ninos: 0,
    bebes: 0,
    edades: [],
    hotel: null,
    tarifa: null,
    origen: ORIGEN_INICIAL,
    vuelo: "ida-vuelta",
    vueloDesde: "",
    vueloHasta: "",
    equipaje: EQUIPAJE_INICIAL,
    flexible: false,
    tours: [],
  };
}

/** searchParams -> estado. Sin parámetros válidos devuelve el estado inicial. */
export function parsearEstado(sp: ParamsBusqueda, hoy = hoyCaracas()): EstadoViaje {
  const base = estadoInicial();
  const servicios = leerServicios(sp);
  const destino = DESTINOS.find((d) => d === uno(sp.destino));
  const desde = uno(sp.fecha);
  const hasta = uno(sp.hasta);
  const fechaValida = esFechaViaje(desde, hoy);
  const ninos = entero(uno(sp.ninos), 0, NINOS_MAX) ?? 0;
  const edadesLeidas = (uno(sp.edades) ?? "")
    .split(",")
    .map((e) => entero(e.trim(), EDAD_NINO_MIN, EDAD_NINO_MAX))
    .map((e) => e ?? EDAD_NINO_INICIAL);
  const origen = ORIGENES_VUELO.find((o) => o.valor === uno(sp.origen));
  const vueloDesde = uno(sp.vuelo_ida);
  const vueloDesdeValido = esFechaViaje(vueloDesde, hoy);
  const vueloHasta = uno(sp.vuelo_vuelta);
  const tours = [
    ...new Set(
      (uno(sp.tour) ?? "")
        .split(",")
        .map((t) => idPositivo(t.trim()))
        .filter((t): t is number => t != null),
    ),
  ].slice(0, TOURS_MAX);

  return {
    servicios: servicios.length > 0 ? servicios : base.servicios,
    destino: destino ?? base.destino,
    desde: fechaValida ? desde : "",
    hasta: fechaValida && esFechaViaje(hasta, hoy) && hasta > desde ? hasta : "",
    adultos: entero(uno(sp.adultos), 1, ADULTOS_MAX) ?? base.adultos,
    ninos,
    bebes: entero(uno(sp.bebes), 0, BEBES_MAX) ?? 0,
    edades: ajustarEdades(edadesLeidas, ninos),
    // `producto` es el nombre que usaban los enlaces viejos (/cotizar/x?producto=).
    hotel: idPositivo(uno(sp.hotel) ?? uno(sp.producto)),
    tarifa: idPositivo(uno(sp.tarifa)),
    origen: origen?.valor ?? base.origen,
    vuelo: uno(sp.vuelo) === "ida" ? "ida" : "ida-vuelta",
    vueloDesde: vueloDesdeValido ? vueloDesde : "",
    vueloHasta: vueloDesdeValido && esFechaViaje(vueloHasta, hoy) && vueloHasta > vueloDesde ? vueloHasta : "",
    equipaje: EQUIPAJES.find((q) => q.valor === uno(sp.equipaje))?.valor ?? EQUIPAJE_INICIAL,
    flexible: uno(sp.flex) === "1",
    tours,
  };
}

// ---- escritura ----

/** estado -> query string (sin "?"), solo lo que aporta. */
export function serializarEstado(e: EstadoViaje): string {
  const q = new URLSearchParams();
  q.set("servicios", e.servicios.join(","));
  q.set("destino", e.destino);
  if (e.desde) q.set("fecha", e.desde);
  if (e.hasta) q.set("hasta", e.hasta);
  q.set("adultos", String(e.adultos));
  if (e.ninos) {
    q.set("ninos", String(e.ninos));
    q.set("edades", e.edades.join(","));
  }
  if (e.bebes) q.set("bebes", String(e.bebes));
  if (e.hotel) q.set("hotel", String(e.hotel));
  if (e.tarifa) q.set("tarifa", String(e.tarifa));
  if (e.servicios.includes("vuelo")) {
    q.set("origen", e.origen);
    q.set("vuelo", e.vuelo);
    if (e.vueloDesde) q.set("vuelo_ida", e.vueloDesde);
    if (e.vueloHasta) q.set("vuelo_vuelta", e.vueloHasta);
    if (e.equipaje !== EQUIPAJE_INICIAL) q.set("equipaje", e.equipaje);
    if (e.flexible) q.set("flex", "1");
  }
  if (e.servicios.includes("tours") && e.tours.length) q.set("tour", e.tours.join(","));
  return q.toString();
}

// ---- transformaciones ----

export function alternarServicio(e: EstadoViaje, s: Servicio): EstadoViaje {
  const activo = e.servicios.includes(s);
  // Siempre queda al menos un servicio: sin ninguno no hay nada que cotizar.
  if (activo && e.servicios.length === 1) return e;
  const lista = activo ? e.servicios.filter((x) => x !== s) : [...e.servicios, s];
  return { ...e, servicios: ordenarServicios(lista) };
}

/** Atajo "Paquete completo": hospedaje y vuelo juntos. */
export function marcarPaquete(e: EstadoViaje): EstadoViaje {
  return { ...e, servicios: ordenarServicios([...new Set<Servicio>([...e.servicios, "hospedaje", "vuelo"])]) };
}

export const esPaquete = (e: EstadoViaje) => e.servicios.includes("hospedaje") && e.servicios.includes("vuelo");

/** Nueva entrada: si alcanza a la salida, la salida se corre y conserva las
 * noches que ya tenía (una, si no había). */
export function cambiarDesde(e: EstadoViaje, desde: string): EstadoViaje {
  let hasta = e.hasta;
  if (desde && hasta && hasta <= desde) hasta = sumarDias(desde, Math.max(1, contarNoches(e.desde, e.hasta)));
  return { ...e, desde, hasta };
}

export function cambiarViajeros(e: EstadoViaje, v: { adultos: number; ninos: number; bebes: number }): EstadoViaje {
  return { ...e, ...v, edades: ajustarEdades(e.edades, v.ninos) };
}

export function alternarTour(e: EstadoViaje, id: number): EstadoViaje {
  if (e.tours.includes(id)) return { ...e, tours: e.tours.filter((t) => t !== id) };
  return e.tours.length >= TOURS_MAX ? e : { ...e, tours: [...e.tours, id] };
}

/** Fechas del vuelo: las propias si el cliente las cambió, si no las del viaje.
 * Solo ida no tiene vuelta. */
export function fechasVuelo(e: EstadoViaje): { ida: string; vuelta: string; propias: boolean } {
  const propias = !!e.vueloDesde;
  const ida = propias ? e.vueloDesde : e.desde;
  const vuelta = e.vuelo === "ida" ? "" : propias ? e.vueloHasta : e.hasta;
  return { ida, vuelta, propias };
}

export const nochesDe = (e: EstadoViaje) => contarNoches(e.desde, e.hasta);

export function textoViajeros(e: Pick<EstadoViaje, "adultos" | "ninos" | "bebes">): string {
  const c = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;
  return [
    c(e.adultos, "adulto", "adultos"),
    e.ninos > 0 && c(e.ninos, "niño", "niños"),
    e.bebes > 0 && c(e.bebes, "bebé", "bebés"),
  ]
    .filter(Boolean)
    .join(" · ");
}

// ---- contacto ----

export function telefonoValido(valor: string): boolean {
  if (!/^[+\d\s().-]+$/.test(valor.trim())) return false;
  const digitos = valor.replace(/\D/g, "");
  return digitos.length >= 7 && digitos.length <= 15;
}

export function correoValido(valor: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor.trim());
}

// ---- enlaces hacia /cotizar ----

/** Enlace "Cotizar" de una ficha del catálogo: el hotel llega ya elegido. */
export function enlaceCotizarProducto(p: { id: number; tipo: string; destino?: string | null }): string {
  if (p.tipo === "hotel") return `/cotizar?hotel=${p.id}`;
  const q = new URLSearchParams();
  if (p.tipo === "paquete") q.set("servicio", "paquete");
  if (p.destino && DESTINOS.includes(p.destino)) q.set("destino", p.destino);
  const qs = q.toString();
  return qs ? `/cotizar?${qs}` : "/cotizar";
}

/** Enlace "Cotizar" de una promoción: hotel y tarifa de referencia. */
export function enlaceCotizarPromocion(promo: { id: number; producto?: { id: number } | null }): string {
  return promo.producto ? `/cotizar?hotel=${promo.producto.id}&tarifa=${promo.id}` : "/cotizar";
}
