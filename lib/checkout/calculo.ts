// Cálculo y validación del checkout de hospedaje (Plan 1 «compra directa», F3).
//
// Función pura, la usan igual el navegador (/reservar, para mostrar el total) y el
// Worker (/api/checkout, que RECALCULA con lo que dice la base y es el único que manda:
// el total que traiga el navegador solo sirve para avisar «el precio cambió»).
//
// Regla del plan: nada inventado y nada ambiguo se cobra solo. Si el tarifario no da un
// número firme (sin tarifa para una noche, mínimo de noches, habitación on request, stop
// sale), el resultado es `ok: false` y la web manda al cliente al asesor en vez de abrir un cobro.
//
// «EUR» en el tarifario NO es otra moneda: es la tasa con que se pasa a bolívares (regla del
// dueño). El precio es el mismo número en dólares (divisa); en Pago Móvil la base lo convierte
// a Bs con la tasa euro del BCV. `tasa` viaja con el servicio para que la base elija la tasa.
import type { Tarifa } from "@/types/supabase";
import { estimarEstadia, nochesDeEstadia } from "@/lib/cotizador/estimado";
import { hoyCaracas } from "@/lib/cotizador/estado";
import { vendibleHoy } from "@/lib/tarifas";

export const RIELES = ["zelle", "pago_movil", "binance"] as const;
export type Riel = (typeof RIELES)[number];

// Mismos topes que checkout_web_crear / checkout-web; la base sigue siendo la autoridad.
export const MAX_NOCHES = 30;
export const MAX_PAX = 12;
export const MAX_BEBES = 4;

export interface SolicitudHospedaje {
  productoId: number;
  tarifaId: number;
  desde: string;
  hasta: string;
  adultos: number;
  /** Edad de cada niño de 2 a 11 años. */
  edades: number[];
  bebes: number;
}

export interface HotelParaCobrar {
  id: number;
  nombre: string;
  tarifas: Tarifa[];
}

export interface BloqueoFecha {
  desde: string;
  hasta: string;
  /** "stop_sale" | "on_request" */
  estado: string;
}

export type ErrorCalculo =
  | "fechas_invalidas"
  | "pasajeros_invalidos"
  | "tarifa_no_disponible"
  | "sin_disponibilidad"
  | "sujeto_a_confirmacion"
  | "precio_a_confirmar";

/** Tasa BCV con que se pasa a bolívares: la de la tarifa elegida. */
export type TasaBcv = "USD" | "EUR";

export type ResultadoHospedaje =
  | {
      ok: true;
      precio: number;
      tasa: TasaBcv;
      noches: number;
      descripcion: string;
      habitacion: string | null;
      regimen: string | null;
      lineas: { texto: string; monto: number }[];
      avisos: string[];
    }
  | { ok: false; error: ErrorCalculo; texto: string; minimo?: number };

const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;
const fallo = (error: ErrorCalculo, texto: string, minimo?: number): ResultadoHospedaje => ({ ok: false, error, texto, minimo });

/** AAAA-MM-DD que existe en el calendario (rechaza 2027-02-31). */
export function fechaValida(s: unknown): s is string {
  if (typeof s !== "string" || !FECHA_RE.test(s)) return false;
  const ms = Date.parse(`${s}T00:00:00Z`);
  return !Number.isNaN(ms) && new Date(ms).toISOString().slice(0, 10) === s;
}

export function calcularHospedaje(
  hotel: HotelParaCobrar,
  sel: SolicitudHospedaje,
  bloqueos: BloqueoFecha[],
  hoy: string = hoyCaracas(),
): ResultadoHospedaje {
  if (!FECHA_RE.test(sel.desde) || !FECHA_RE.test(sel.hasta)) return fallo("fechas_invalidas", "Elige la fecha de entrada y de salida.");
  const noches = nochesDeEstadia(sel.desde, sel.hasta);
  if (!noches.length || sel.desde < hoy) return fallo("fechas_invalidas", "Las fechas no son válidas: la entrada no puede ser pasada y la salida va después.");
  if (noches.length > MAX_NOCHES) return fallo("fechas_invalidas", `La estadía máxima por compra directa es de ${MAX_NOCHES} noches.`);

  const edades = Array.isArray(sel.edades) ? sel.edades : [];
  const enteros = [sel.adultos, sel.bebes, ...edades].every((n) => Number.isInteger(n));
  if (
    !enteros || sel.adultos < 1 || sel.bebes < 0 || sel.bebes > MAX_BEBES ||
    edades.some((e) => e < 2 || e > 11) || sel.adultos + edades.length + sel.bebes > MAX_PAX
  ) {
    return fallo("pasajeros_invalidos", `Indica de 1 a ${MAX_PAX} viajeros, con al menos un adulto.`);
  }

  const vendibles = hotel.tarifas.filter(vendibleHoy);
  const elegida = vendibles.find((t) => t.id === sel.tarifaId);
  if (!elegida) return fallo("tarifa_no_disponible", "Esa habitación ya no está disponible en el tarifario.");

  const enNoches = (b: BloqueoFecha) => noches.some((n) => n >= b.desde && n <= b.hasta);
  if (bloqueos.some((b) => b.estado === "stop_sale" && enNoches(b))) {
    return fallo("sin_disponibilidad", "El hotel no tiene disponibilidad en esas fechas.");
  }
  if (bloqueos.some((b) => b.estado === "on_request" && enNoches(b))) {
    return fallo("sujeto_a_confirmacion", "Esas fechas están sujetas a confirmación del hotel: un asesor te cotiza.");
  }

  const est = estimarEstadia(elegida, vendibles, { desde: sel.desde, hasta: sel.hasta, adultos: sel.adultos, edades, bebes: sel.bebes });
  if (!est.ok) return fallo("precio_a_confirmar", est.texto, est.minimo);
  if (est.avisos.some((a) => /on request/i.test(a))) {
    return fallo("sujeto_a_confirmacion", "Esa habitación está sujeta a confirmación del hotel: un asesor te cotiza.");
  }
  // «No incluye … el asesor lo suma al confirmar» = el total está incompleto (cena obligatoria de Navidad o
  // Fin de Año, suplementos del hotel). En la compra directa no hay asesor que lo sume: no se cobra solo.
  if (est.avisos.some((a) => /^no incluye|el asesor (la|lo) suma/i.test(a))) {
    return fallo("sujeto_a_confirmacion", "Esas fechas llevan un suplemento obligatorio del hotel que suma un asesor: te cotiza.");
  }

  const precio = Math.round(est.total * 100) / 100;
  if (!(precio > 0)) return fallo("precio_a_confirmar", "El precio de esas fechas lo confirma un asesor.");

  const habitacion = elegida.habitacion?.trim() || null;
  const descripcion = `${hotel.nombre}${habitacion ? ` — ${habitacion}` : ""} (${est.noches} ${est.noches === 1 ? "noche" : "noches"})`.slice(0, 300);
  return {
    ok: true,
    precio,
    // Las filas que suma estimarEstadia son de la misma habitación, plan y tasa que la elegida.
    tasa: est.moneda,
    noches: est.noches,
    descripcion,
    habitacion,
    regimen: elegida.plan?.trim() || null,
    lineas: est.lineas,
    avisos: est.avisos,
  };
}

/** El servicio tal como lo espera la Edge Function checkout-web (lista blanca). */
export function servicioHospedaje(hotel: HotelParaCobrar, sel: SolicitudHospedaje, r: Extract<ResultadoHospedaje, { ok: true }>) {
  return {
    tipo: "hospedaje" as const,
    descripcion: r.descripcion,
    fecha_inicio: sel.desde,
    fecha_fin: sel.hasta,
    pax_adultos: sel.adultos,
    pax_ninos: sel.edades.length + sel.bebes,
    precio: r.precio,
    tasa: r.tasa,
    detalle: {
      producto_id: String(hotel.id),
      hotel: hotel.nombre,
      // Las edades fijan la tarifa de cada niño y la ocupación de la habitación: el asesor las necesita.
      ...(sel.edades.length ? { edades_ninos: sel.edades.join(",") } : {}),
      ...(sel.bebes ? { bebes: String(sel.bebes) } : {}),
      ...(r.habitacion ? { habitacion: r.habitacion } : {}),
      ...(r.regimen ? { regimen: r.regimen } : {}),
    },
  };
}

export type ErrorContacto = "nombre_invalido" | "telefono_invalido" | "email_invalido" | "riel_invalido";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function validarContacto(c: { nombre: unknown; telefono: unknown; email: unknown; riel: unknown }): ErrorContacto | null {
  const nombre = typeof c.nombre === "string" ? c.nombre.trim() : "";
  const digitos = typeof c.telefono === "string" ? c.telefono.replace(/\D/g, "") : "";
  const email = typeof c.email === "string" ? c.email.trim() : "";
  if (nombre.length < 2 || nombre.length > 80) return "nombre_invalido";
  if (digitos.length < 7 || digitos.length > 15) return "telefono_invalido";
  if (email.length > 120 || !EMAIL_RE.test(email)) return "email_invalido";
  if (typeof c.riel !== "string" || !(RIELES as readonly string[]).includes(c.riel)) return "riel_invalido";
  return null;
}
