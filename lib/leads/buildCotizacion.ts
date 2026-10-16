import { EQUIPAJES, fechasVuelo, nochesDe, SERVICIOS, textoViajeros, type EstadoViaje } from "@/lib/cotizador/estado";
import type { VueloViaje } from "@/lib/cotizador/vuelo";

export interface ResultadoCotizacion {
  destino: string;
  servicio: string;
  personas: string;
  consulta: string;
  mensajeEmoji: string;
  mensajeTexto: string;
}

/** A line is [emoji-prefix, content] so both message variants (emoji for
 * normal browsers, plain "•" for Instagram's in-app browser, which
 * doesn't render emoji reliably) are built from the same data. An empty
 * prefix continues the line above (indented detail). `false` skips the
 * line entirely (conditional fields). */
type Linea = [string, string] | false | null | undefined;

/** Solo saca emoji (y sus modificadores): los acentos y la "ñ" se quedan.
 * Antes se recortaba a ASCII y "COTIZACIÓN" llegaba como "COTIZACIN". */
const sinEmoji = (s: string) =>
  s
    .replace(/[\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}️‍]/gu, "")
    .replace(/ {2,}/g, " ")
    .trim();

const SANGRIA = "      ";

export function armarMensajes(
  titulo: string,
  lineas: Linea[],
  cierre?: string,
  /** Va antes del título, en las dos variantes. */
  saludo?: string,
): { emoji: string; texto: string } {
  const validas = lineas.filter((l): l is [string, string] => Boolean(l));
  const armar = (limpiar: (s: string) => string, linea: (prefijo: string, c: string) => string) =>
    [
      ...(saludo ? [limpiar(saludo), ""] : []),
      limpiar(titulo),
      "",
      ...validas.map(([e, c]) => linea(e, c)),
      ...(cierre ? ["", limpiar(cierre)] : []),
    ].join("\n");
  const emoji = armar(
    (s) => s,
    (e, c) => (e ? `${e} ${c}` : `${SANGRIA}${c}`),
  );
  const texto = armar(sinEmoji, (e, c) => (e ? `• ${sinEmoji(c)}` : `   ${sinEmoji(c)}`));
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
const DIA_MES = new Intl.DateTimeFormat("es-VE", { day: "numeric", month: "long", timeZone: "UTC" });

/** "12 al 15 de noviembre de 2026" en vez de repetir mes y año en las dos puntas. */
function rangoFechas(desde: string, hasta: string): string {
  if (desde.slice(0, 4) !== hasta.slice(0, 4)) return `${fechaLarga(desde)} al ${fechaLarga(hasta)}`;
  const inicio =
    desde.slice(0, 7) === hasta.slice(0, 7)
      ? String(Number(desde.slice(8, 10)))
      : DIA_MES.format(new Date(`${desde}T00:00:00Z`));
  return `${inicio} al ${fechaLarga(hasta)}`;
}

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
  /** Ruta y aproximado del vuelo que vio el cliente (estimarVueloViaje). */
  vueloInfo: VueloViaje | null = null,
  /** Nombre de pila del asesor que recibe el WhatsApp, para el saludo. */
  asesor: string | null = null,
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
      ? `${rangoFechas(e.desde, e.hasta)} (${noches} ${noches === 1 ? "noche" : "noches"})`
      : `${fechaLarga(e.desde)} (salida por definir)`
    : "Por definir";
  const fv = fechasVuelo(e);
  const fechasPropias = fv.propias ? (fv.vuelta ? rangoFechas(fv.ida, fv.vuelta) : fechaLarga(fv.ida)) : "";
  const fechasDelVuelo = fechasPropias ? ` (${fechasPropias})` : "";
  const etiquetaEquipaje = EQUIPAJES.find((q) => q.valor === e.equipaje)?.etiqueta ?? "";
  const equipaje = etiquetaEquipaje.toLowerCase();
  const destinoVuelo = !vueloInfo?.destino
    ? e.destino
    : vueloInfo.destino === "otro"
      ? `otro destino: ${vueloInfo.destinoNombre || "sin indicar"}`
      : `${vueloInfo.destinoNombre} (${vueloInfo.destino})`;
  const origenVuelo = vueloInfo?.origenIata ? `${e.origen} (${vueloInfo.origenIata})` : e.origen;
  const precioVuelo =
    vueloInfo?.porPersona != null
      ? [
          `aprox $${vueloInfo.porPersona} por persona${vueloInfo.total != null ? ` ($${vueloInfo.total} total)` : ""}`,
          vueloInfo.cercano ? "fecha cercana (20 días o menos)" : "",
          vueloInfo.bebesSinCosto ? "bebés sin costo en el aproximado" : "",
        ]
          .filter(Boolean)
          .join(", ")
      : "precio a confirmar";
  const tramoVuelo = [
    `${origenVuelo} a ${destinoVuelo}, ${e.vuelo === "ida" ? "solo ida" : "ida y vuelta"}${fechasDelVuelo}`,
    equipaje,
    e.flexible ? "fechas flexibles" : "",
    precioVuelo,
  ]
    .filter(Boolean)
    .join(", ");
  const toursTexto = toursElegidos.length ? toursElegidos.join("; ") : "";
  const hotelTexto = hotel ? `${hotel.nombre} (#${hotel.id})` : "Sin hotel elegido: el asesor propone opciones";
  const habitacion =
    hospedaje && hotel && elegido.habitacion ? [elegido.habitacion, elegido.plan].filter(Boolean).join(", ") : "";
  const estimado = hospedaje && hotel && elegido.estimado ? elegido.estimado : "";
  const soloVuelo = vuelo && !hospedaje && !tours;
  const vueloConMonto = vuelo && vueloInfo?.porPersona != null;
  const precio = estimado
    ? `Estimado web del hospedaje: ${estimado}${vuelo || tours ? " (vuelo y tours aparte)" : ""}, sujeto a disponibilidad`
    : vueloConMonto
      ? soloVuelo
        ? "Precio: vuelo aproximado (ver arriba), sujeto a disponibilidad"
        : "Precio: vuelo aproximado (ver arriba); el resto a confirmar por el asesor"
      : "Precio: a confirmar por el asesor";
  const destino = soloVuelo ? `${e.origen} a ${vueloInfo?.destino ? destinoVuelo : e.destino}` : e.destino;

  const consulta = [
    "Cotización web: Arme su viaje",
    `Servicios: ${servicio}${hospedaje && vuelo ? " (hospedaje con vuelo)" : ""}`,
    `Destino: ${soloVuelo ? destinoVuelo : e.destino}`,
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

  // Mensaje de WhatsApp: una línea corta por dato y solo emoji de amplio
  // soporte (nada de 🧭/🧳, Unicode 11, ni 🛏️ con selector de variación). El
  // #id del hotel y la tarifa de referencia quedan solo en `consulta` (CRM).
  const aprox =
    vueloInfo?.porPersona != null
      ? [
          `Aprox. $${vueloInfo.porPersona} por persona${vueloInfo.total != null ? ` ($${vueloInfo.total} total)` : ""}`,
          vueloInfo.cercano ? "fecha cercana" : "",
          vueloInfo.bebesSinCosto ? "bebés sin costo" : "",
        ]
          .filter(Boolean)
          .join(", ")
      : "Precio a confirmar";
  const { emoji, texto } = armarMensajes(
    `*COTIZACIÓN DE VIAJE${leadId ? ` #${leadId}` : ""}*\nDestino y Eventos Lotus 360`,
    [
      ["👤", `*Nombre:* ${c.nombre}`],
      ["📋", `*Servicios:* ${servicio}`],
      ["📍", `*Destino:* ${e.destino}`],
      ["📅", `*Fechas:* ${fechas}`],
      ["👥", `*Viajeros:* ${viajeros}`],
      edades ? ["👶", `*Edades de niños:* ${edades}`] : null,
      hospedaje ? ["🏨", `*Hotel:* ${hotel ? hotel.nombre : "sin elegir, que el asesor proponga opciones"}`] : null,
      habitacion ? ["", habitacion] : null,
      estimado ? ["💵", `*Estimado web:* ${estimado} (sujeto a disponibilidad)`] : null,
      vuelo ? ["✈️", `*Vuelo:* ${origenVuelo} a ${destinoVuelo}`] : null,
      vuelo ? ["", `${e.vuelo === "ida" ? "Solo ida" : "Ida y vuelta"}${fechasPropias ? `, ${fechasPropias}` : ""}`] : null,
      vuelo && etiquetaEquipaje ? ["", etiquetaEquipaje] : null,
      vuelo && e.flexible ? ["", "Fechas flexibles"] : null,
      vuelo ? ["", aprox] : null,
      tours ? ["🌴", `*Full day y tours:* ${toursTexto || "sí"} (grupo mínimo 15 personas)`] : null,
      c.correo ? ["✉️", `*Correo:* ${c.correo}`] : null,
      c.notas ? ["📝", `*Notas:* ${c.notas}`] : null,
    ],
    "Quedo a la espera de las opciones con precio confirmado. ¡Gracias!",
    `Hola${asesor ? `, ${asesor}` : ""}. Le escribo por esta cotización de la web:`,
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
