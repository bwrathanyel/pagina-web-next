import { EQUIPAJES, fechasVuelo, nochesDe, SERVICIOS, textoViajeros, type EstadoViaje } from "@/lib/cotizador/estado";

export interface ResultadoCotizacion {
  destino: string;
  servicio: string;
  personas: string;
  consulta: string;
  mensajeEmoji: string;
  mensajeTexto: string;
}

/** A line is [emoji-prefix, content] so both message variants (emoji for
 * normal browsers, plain "►" for Instagram's in-app browser, which
 * doesn't render emoji reliably) are built from the same data — no
 * regex-stripping of emoji from a single string. `false` skips the
 * line entirely (conditional fields). */
type Linea = [string, string] | false | null | undefined;

export function armarMensajes(titulo: string, lineas: Linea[], cierre?: string): { emoji: string; texto: string } {
  const validas = lineas.filter((l): l is [string, string] => Boolean(l));
  const emoji = [titulo, "", ...validas.map(([e, c]) => `${e} ${c}`), ...(cierre ? ["", cierre] : [])].join("\n");
  const texto = [
    titulo.replace(/[^\x00-\x7F]/gu, "").trim(),
    "",
    ...validas.map(([, c]) => `► ${c}`),
    ...(cierre ? ["", cierre.replace(/[^\x00-\x7F]/gu, "").trim()] : []),
  ].join("\n");
  return { emoji, texto };
}

// ---- Cotizador v2 "Arme su viaje" (/cotizar) ----

export interface ContactoViaje {
  nombre: string;
  telefono: string;
  correo: string;
  notas: string;
}

const FECHA_LARGA = new Intl.DateTimeFormat("es-VE", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const fechaLarga = (iso: string) => FECHA_LARGA.format(new Date(`${iso}T00:00:00Z`));

// Topes de /api/lead (destino 220, personas 160, consulta 3000).
const recortar = (texto: string, max: number) => (texto.length > max ? `${texto.slice(0, max - 3).trimEnd()}...` : texto);

/** Un solo lead por cotización, con todo lo estructurado en `consulta` como
 * texto ordenado (el contrato de /api/lead no cambia). El precio solo viaja
 * como el estimado que vio el cliente (estimarEstadia); sin tarifa aplicable,
 * "a confirmar por el asesor". */
export interface HospedajeElegido {
  habitacion?: string | null;
  plan?: string | null;
  /** Estimado ya formateado ("$1118"), o null si no hubo tarifa aplicable. */
  estimado?: string | null;
}

export function armarCotizacionViaje(
  e: EstadoViaje,
  c: ContactoViaje,
  hotel: { id: number; nombre: string } | null,
  leadId?: number,
  elegido: HospedajeElegido = {},
  /** Nombres de los tours que el cliente agregó (el catálogo vive en el cliente). */
  toursElegidos: string[] = [],
): ResultadoCotizacion {
  const tiene = (s: EstadoViaje["servicios"][number]) => e.servicios.includes(s);
  const hospedaje = tiene("hospedaje");
  const vuelo = tiene("vuelo");
  const tours = tiene("tours");
  const noches = nochesDe(e);
  const servicio = e.servicios.map((s) => SERVICIOS.find((x) => x.id === s)?.etiqueta ?? s).join(" + ");
  const viajeros = textoViajeros(e);
  const edades = e.ninos > 0 ? e.edades.map((a) => `${a} años`).join(", ") : "";
  const fechas = e.desde
    ? e.hasta
      ? `${fechaLarga(e.desde)} al ${fechaLarga(e.hasta)} (${noches} ${noches === 1 ? "noche" : "noches"})`
      : `${fechaLarga(e.desde)} (salida por definir)`
    : "Por definir";
  const fv = fechasVuelo(e);
  const fechasDelVuelo = fv.propias
    ? ` (${fechaLarga(fv.ida)}${fv.vuelta ? ` al ${fechaLarga(fv.vuelta)}` : ""})`
    : "";
  const equipaje = EQUIPAJES.find((q) => q.valor === e.equipaje)?.etiqueta.toLowerCase() ?? "";
  const tramoVuelo = [
    `${e.origen} a ${e.destino}, ${e.vuelo === "ida" ? "solo ida" : "ida y vuelta"}${fechasDelVuelo}`,
    equipaje,
    e.flexible ? "fechas flexibles" : "",
  ]
    .filter(Boolean)
    .join(", ");
  const toursTexto = toursElegidos.length ? toursElegidos.join("; ") : "";
  const hotelTexto = hotel ? `${hotel.nombre} (#${hotel.id})` : "Sin hotel elegido: el asesor propone opciones";
  const habitacion =
    hospedaje && hotel && elegido.habitacion ? [elegido.habitacion, elegido.plan].filter(Boolean).join(", ") : "";
  const estimado = hospedaje && hotel && elegido.estimado ? elegido.estimado : "";
  const precio = estimado
    ? `Estimado web del hospedaje: ${estimado}${vuelo || tours ? " (vuelo y tours aparte)" : ""}, sujeto a disponibilidad`
    : "Precio: a confirmar por el asesor";
  const destino = vuelo && !hospedaje && !tours ? `${e.origen} a ${e.destino}` : e.destino;

  const consulta = [
    "Cotización web: Arme su viaje",
    `Servicios: ${servicio}${hospedaje && vuelo ? " (hospedaje con vuelo)" : ""}`,
    `Destino: ${e.destino}`,
    `Fechas: ${fechas}`,
    `Viajeros: ${viajeros}`,
    edades ? `Edades de niños: ${edades}` : "",
    hospedaje ? `Hotel: ${hotelTexto}` : "",
    habitacion ? `Habitación: ${habitacion}` : "",
    hospedaje && e.tarifa ? `Tarifa de referencia: #${e.tarifa}` : "",
    vuelo ? `Vuelo: ${tramoVuelo}` : "",
    tours ? `Full day y tours: ${toursTexto || "sí"} (grupo mínimo 15 personas)` : "",
    precio,
    c.correo ? `Correo: ${c.correo}` : "",
    c.notas ? `Notas: ${c.notas}` : "",
  ]
    .filter(Boolean)
    .join(" | ");

  const { emoji, texto } = armarMensajes(
    "🧭 *COTIZACIÓN DE VIAJE - DESTINO Y EVENTOS LOTUS 360*",
    [
      leadId ? ["🔖", `*Cotización:* #${leadId}`] : null,
      ["👤", `*Nombre:* ${c.nombre}`],
      ["🧳", `*Servicios:* ${servicio}${hospedaje && vuelo ? " (hospedaje con vuelo)" : ""}`],
      ["📍", `*Destino:* ${e.destino}`],
      ["📅", `*Fechas:* ${fechas}`],
      ["👥", `*Viajeros:* ${viajeros}`],
      edades ? ["👶", `*Edades niños:* ${edades}`] : null,
      hospedaje ? ["🏨", `*Hotel:* ${hotelTexto}`] : null,
      habitacion ? ["🛏️", `*Habitación:* ${habitacion}`] : null,
      estimado ? ["💵", `*Estimado web:* ${estimado} (sujeto a disponibilidad)`] : null,
      vuelo ? ["✈️", `*Vuelo:* ${tramoVuelo}`] : null,
      tours ? ["🌴", `*Full day y tours:* ${toursTexto || "sí"} (grupo mínimo 15 personas)`] : null,
      c.correo ? ["✉️", `*Correo:* ${c.correo}`] : null,
      c.notas ? ["📝", `*Notas:* ${c.notas}`] : null,
    ],
    "✅ *Enviar opciones con precio confirmado. ¡Gracias!*",
  );

  return {
    destino: recortar(destino, 220),
    servicio,
    personas: recortar(edades ? `${viajeros} (niños: ${edades})` : viajeros, 160),
    consulta: recortar(consulta, 3000),
    mensajeEmoji: emoji,
    mensajeTexto: texto,
  };
}
