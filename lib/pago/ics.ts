// «Agregar al calendario» de la reserva confirmada: un .ics armado en el cliente,
// sin servidor. Evento de día completo de la entrada a la salida (DTEND es
// exclusivo en RFC 5545, así que el día de salida queda fuera: son las noches).

export interface DatosIcs {
  codigo: string;
  hotel: string | null;
  habitacion?: string | null;
  /** YYYY-MM-DD (o ISO: se toma la fecha). */
  entrada: string;
  salida: string | null;
  enlace?: string;
  ahora?: Date;
}

const DOMINIO = "destinoyeventoslotus360.com";

/** «2026-12-20» → «20261220». */
function fechaIcs(f: string): string {
  return f.slice(0, 10).replaceAll("-", "");
}

function diaSiguiente(f: string): string {
  const d = new Date(`${f.slice(0, 10)}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function sello(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Texto de una propiedad: barra, punto y coma, coma y saltos se escapan. */
export function escaparIcs(t: string): string {
  return t.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Líneas de más de 75 octetos se pliegan con CRLF + espacio, sin partir un carácter UTF-8. */
export function plegar(linea: string): string {
  const enc = new TextEncoder();
  const partes: string[] = [];
  let actual = "";
  let bytes = 0;
  for (const ch of linea) {
    const n = enc.encode(ch).length;
    const tope = partes.length ? 74 : 75; // la continuación ya gasta 1 octeto en el espacio
    if (bytes + n > tope) {
      partes.push(actual);
      actual = "";
      bytes = 0;
    }
    actual += ch;
    bytes += n;
  }
  partes.push(actual);
  return partes.join("\r\n ");
}

export function icsReserva(d: DatosIcs): string {
  const entrada = d.entrada.slice(0, 10);
  const salida = d.salida && d.salida.slice(0, 10) > entrada ? d.salida.slice(0, 10) : diaSiguiente(entrada);
  const titulo = d.hotel ? `${d.hotel} · Reserva ${d.codigo}` : `Reserva ${d.codigo}`;
  const detalle = [
    `Localizador: ${d.codigo}`,
    d.habitacion ? `Habitación: ${d.habitacion}` : null,
    "Destino y Eventos Lotus 360",
    d.enlace ? `Su reserva: ${d.enlace}` : null,
  ].filter(Boolean).join("\n");
  const lineas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//Destino y Eventos Lotus 360//Reserva//ES`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${d.codigo}@${DOMINIO}`,
    `DTSTAMP:${sello(d.ahora ?? new Date())}`,
    `DTSTART;VALUE=DATE:${fechaIcs(entrada)}`,
    `DTEND;VALUE=DATE:${fechaIcs(salida)}`,
    `SUMMARY:${escaparIcs(titulo)}`,
    d.hotel ? `LOCATION:${escaparIcs(d.hotel)}` : null,
    `DESCRIPTION:${escaparIcs(detalle)}`,
    d.enlace ? `URL:${d.enlace}` : null,
    "TRANSP:TRANSPARENT",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter((l): l is string => l !== null);
  return lineas.map(plegar).join("\r\n") + "\r\n";
}
