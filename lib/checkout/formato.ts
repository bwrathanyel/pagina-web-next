// Formato y textos de la compra directa (Plan 1, rediseño). Funciones puras: las usan igual
// /reservar, /pagar y sus tests. Montos con separador de miles «.» y decimales «,» armados a
// mano: `toLocaleString("es-…")` no agrupa los números de cuatro cifras (CLDR pide dos dígitos
// de agrupación) y saldría «US$ 1234,56» al lado de «US$ 12.345,67».
import { MAX_PAX } from "@/lib/checkout/calculo";

export type MonedaPago = "USD" | "VES" | "USDT";

const miles = (entero: number) => String(entero).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

/** Centavos (o céntimos de Bs) a texto para el cliente: «US$ 1.234,56», «Bs 8.833,96», «USDT 318,27». */
export function montoCentavos(centavos: number, moneda: MonedaPago): string {
  const abs = Math.abs(Math.round(centavos));
  const cuerpo = `${miles(Math.trunc(abs / 100))},${String(abs % 100).padStart(2, "0")}`;
  const signo = centavos < 0 ? "-" : "";
  const prefijo = moneda === "VES" ? "Bs" : moneda === "USDT" ? "USDT" : "US$";
  return `${signo}${prefijo} ${cuerpo}`;
}

/** Dólares con decimales (lo que calcula /reservar) a «US$ 1.234,56». */
export const usd = (n: number) => montoCentavos(Math.round(n * 100), "USD");

/** Lo que se pega en la app del banco: sin miles ni símbolo. Zelle y Binance usan punto
 * decimal («318.27»); los bancos venezolanos, coma («8833,96»). */
export function montoParaCopiar(centavos: number, moneda: MonedaPago): string {
  const abs = Math.abs(Math.round(centavos));
  const sep = moneda === "VES" ? "," : ".";
  return `${Math.trunc(abs / 100)}${sep}${String(abs % 100).padStart(2, "0")}`;
}

// ------------------------------------------------------------
//  Fechas y horas. Todo en hora de Venezuela: un cliente en EE. UU. debe ver la misma hora
//  límite que el equipo que verifica.
// ------------------------------------------------------------
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

const RELOJ_CARACAS = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Caracas", month: "numeric", day: "numeric", hour: "numeric", minute: "2-digit", hourCycle: "h23",
});

function partesCaracas(iso: string) {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return null;
  const p = Object.fromEntries(RELOJ_CARACAS.formatToParts(ms).map((x) => [x.type, x.value]));
  return { mes: Number(p.month), dia: Number(p.day), hora: Number(p.hour) % 24, minuto: p.minute ?? "00" };
}

const reloj = (hora: number, minuto: string) => `${hora % 12 === 0 ? 12 : hora % 12}:${minuto} ${hora < 12 ? "am" : "pm"}`;

/** «3:45 pm» en hora de Venezuela. */
export function horaVenezuela(iso: string | null | undefined): string {
  const p = iso ? partesCaracas(iso) : null;
  return p ? reloj(p.hora, p.minuto) : "";
}

/** «22 oct, 3:45 pm» en hora de Venezuela. */
export function fechaHoraVenezuela(iso: string | null | undefined): string {
  const p = iso ? partesCaracas(iso) : null;
  return p ? `${p.dia} ${MESES[p.mes - 1]}, ${reloj(p.hora, p.minuto)}` : "";
}

/** «antes de las 3:45 pm» si cae hoy (en Venezuela); si no, «antes del 23 oct a las 9:00 am». */
export function antesDeVenezuela(iso: string | null | undefined, ahora: number = Date.now()): string {
  const p = iso ? partesCaracas(iso) : null;
  const hoy = partesCaracas(new Date(ahora).toISOString());
  if (!p || !hoy) return "";
  const hora = `las ${reloj(p.hora, p.minuto)}`;
  return p.dia === hoy.dia && p.mes === hoy.mes ? `antes de ${hora}` : `antes del ${p.dia} ${MESES[p.mes - 1]} a ${hora}`;
}

/** Hora en punto de la ventana de atención (8 = «8:00 am», 20 = «8:00 pm»). */
export const horaAmPm = (h: number | undefined, def: number) => {
  const n = Number.isFinite(h) ? Number(h) : def;
  return reloj(n % 24, "00");
};

const ymd = (s: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  return m ? { anio: Number(m[1]), mes: Number(m[2]), dia: Number(m[3]) } : null;
};

/** «12 may» desde AAAA-MM-DD (fecha de calendario, sin zona horaria). */
export function fechaCorta(s: string | null | undefined): string {
  const f = s ? ymd(s) : null;
  return f ? `${f.dia} ${MESES[f.mes - 1]}` : "";
}

/** «12 al 15 may» o «28 abr al 2 may». */
export function rangoFechas(desde: string, hasta: string | null | undefined): string {
  const a = ymd(desde);
  const b = hasta ? ymd(hasta) : null;
  if (!a) return "";
  if (!b || hasta === desde) return fechaCorta(desde);
  return a.mes === b.mes && a.anio === b.anio ? `${a.dia} al ${fechaCorta(hasta)}` : `${fechaCorta(desde)} al ${fechaCorta(hasta)}`;
}

/** Tiempo que queda para pagar: «23 h 41 min», «12 min», «menos de 1 min». */
export function plazoRestante(segundos: number): string {
  if (!(segundos > 0)) return "0 min";
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  if (h > 0) return `${h} h ${m} min`;
  return m > 0 ? `${m} min` : "menos de 1 min";
}

// ------------------------------------------------------------
//  Cargos de la reserva. `pago-publico` manda todo como «servicios»: el hospedaje (con hotel) y los
//  cargos (tipo «otro», sin hotel: «Cargo por gestión web (x%)», «IGTF (3%)»). El cliente los ve
//  aparte, con su monto, no como si fueran servicios de 0 adultos.
// ------------------------------------------------------------
export interface ServicioCobrable {
  tipo: string;
  descripcion: string | null;
  hotel: string | null;
}

export function separarCargos<T extends ServicioCobrable>(servicios: T[]): { principales: T[]; cargos: T[] } {
  const esCargo = (s: T) => s.tipo === "otro" && !s.hotel;
  return { principales: servicios.filter((s) => !esCargo(s)), cargos: servicios.filter(esCargo) };
}

/** «IGTF (3%)» a «3» (o null si no hay IGTF en la reserva). */
export function porcentajeIgtf(servicios: ServicioCobrable[]): string | null {
  for (const s of servicios) {
    const m = /^IGTF\s*\((\d+(?:[.,]\d+)?)\s*%\)/i.exec(s.descripcion ?? "");
    if (m) return m[1].replace(",", ".");
  }
  return null;
}

// ------------------------------------------------------------
//  Mensajes por código. `calculo.ts` devuelve algunos textos en tuteo y no se toca: aquí se
//  manda el código, y el texto del cálculo solo se usa cuando ya está en «usted».
// ------------------------------------------------------------
const ERRORES_RESERVA: Record<string, string> = {
  captcha_invalido: "No se completó la verificación de seguridad. Toque Reintentar.",
  terminos_no_aceptados: "Para continuar, acepte los términos y la política de cambios y cancelaciones.",
  nombre_invalido: "Escriba su nombre y apellido.",
  telefono_invalido: "Revise el número: debe tener al menos 7 dígitos.",
  email_invalido: "Revise su correo: ahí le enviaremos el localizador.",
  riel_invalido: "Elija cómo va a pagar.",
  checkout_desactivado: "La compra directa no está disponible por ahora. Escríbanos por WhatsApp y le ayudamos.",
  fuera_de_horario: "La compra directa está abierta de 8:00 am a 8:00 pm (hora de Venezuela). Vuelva en ese horario o escríbanos por WhatsApp.",
  demasiadas_solicitudes: "Hizo muchos intentos seguidos. Espere unos minutos e inténtelo de nuevo.",
  demasiadas_reservas_abiertas: "Ya tiene reservas esperando pago. Pague o espere a que venzan antes de crear otra.",
  contacto_ya_registrado: "Ese teléfono ya está registrado con otro correo. Escríbanos por WhatsApp y le ayudamos.",
  hotel_no_disponible: "Este hotel ya no está disponible para compra directa.",
  tiempo_agotado: "El servicio tardó demasiado en responder. Sus datos siguen aquí: inténtelo de nuevo.",
  servicio_no_disponible: "No pudimos crear la reserva por un problema de conexión. Sus datos siguen aquí: inténtelo de nuevo.",
  pasajeros_invalidos: `Indique de 1 a ${MAX_PAX} viajeros, con al menos un adulto.`,
  tarifa_no_disponible: "Esa habitación ya no está disponible. Elija otra o escríbanos.",
  sin_disponibilidad: "El hotel no tiene cupo en esas fechas. Pruebe otras o escríbanos.",
  sujeto_a_confirmacion: "Esas fechas las confirma el hotel. Un asesor le arma la reserva por WhatsApp.",
};

/** Texto para el cliente de un error del cálculo o de /api/checkout. */
export function mensajeReserva(codigo?: string, texto?: string): string {
  if (codigo === "fechas_invalidas") return texto && !/^Elige/.test(texto) ? texto : "Elija la fecha de entrada y de salida.";
  if (codigo === "sujeto_a_confirmacion" && texto && /suplemento/i.test(texto)) {
    return "Esas fechas llevan un suplemento obligatorio del hotel. Un asesor se lo suma y le arma la reserva por WhatsApp.";
  }
  // `precio_a_confirmar` trae el motivo de estimarEstadia (ya en «usted»: mínimo de noches, niños…).
  if (codigo === "precio_a_confirmar") return texto || "El precio de esas fechas lo confirma un asesor.";
  return (codigo && ERRORES_RESERVA[codigo]) || "No pudimos crear la reserva. Sus datos siguen aquí: inténtelo de nuevo en un momento.";
}

const ERRORES_PAGO: Record<string, string> = {
  falta_referencia: "Escriba el número de referencia del pago.",
  captcha_invalido: "No se completó la verificación de seguridad. Toque Reintentar.",
  comprobante_formato_invalido: "El comprobante debe ser PDF, JPG, PNG o WebP.",
  comprobante_muy_grande: "El comprobante no puede pesar más de 5 MB.",
  comprobante_invalido: "No pudimos procesar el comprobante. Pruebe con otro archivo.",
  estado_no_declarable: "Este pago ya no admite un nuevo aviso.",
  vencido: "Se acabó el tiempo para pagar. Escríbanos con su comprobante y lo revisamos.",
  tiempo_agotado: "El servicio tardó demasiado en responder. Inténtelo de nuevo en un momento.",
  servicio_no_disponible: "No pudimos enviar su aviso por un problema de conexión. Inténtelo de nuevo.",
  sin_red: "No pudimos enviar su aviso por un problema de conexión. Revise su conexión e inténtelo de nuevo.",
};

/** Texto para el cliente de un error al avisar el pago en /pagar. */
export const mensajePago = (codigo?: string) =>
  (codigo && ERRORES_PAGO[codigo]) || "No pudimos registrar su aviso de pago. Inténtelo de nuevo en un momento.";

/** Errores de campo de /reservar: se muestran bajo cada campo y en «Falta: …». */
export const ERROR_CAMPO = {
  fechas: "Elija la fecha de entrada y de salida.",
  riel: "Elija cómo va a pagar.",
  nombre: "Escriba su nombre y apellido.",
  telefono: "Revise el número: debe tener al menos 7 dígitos.",
  email: "Revise su correo: ahí le enviaremos el localizador.",
  acepta: "Acepte la política para continuar.",
} as const;
