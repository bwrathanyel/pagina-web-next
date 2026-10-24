// Cara pública del link de pago del asesor (Fase 1). El navegador habla con
// `/api/pago/[token]` (mismo origen), que verifica Turnstile y reenvía a la
// Edge Function `pago-publico` server-to-server. El cliente nunca toca
// Supabase directo ni conoce el `p_secret`.
import { montoCentavos } from "@/lib/checkout/formato";

export type RielPago =
  | "pago_movil" | "c2p" | "zelle" | "binance"
  | "tarjeta" | "efectivo" | "transferencia";

export type EstadoPago =
  | "emitido" | "pendiente_verificacion" | "verificado"
  | "rechazado" | "vencido" | "reembolsado";

/** Un servicio de la reserva web (lo que arma pago_web_resumen; sin datos personales). */
export interface ServicioReserva {
  tipo: string;
  descripcion: string | null;
  hotel: string | null;
  habitacion: string | null;
  fecha_inicio: string;
  fecha_fin: string | null;
  pax_adultos: number | null;
  pax_ninos: number | null;
  precio_usd: number;
}

/** Resumen de la reserva detrás de un pago de compra directa en la web. */
export interface ReservaWeb {
  codigo: string;
  total_usd: number;
  servicios: ServicioReserva[];
  /** false = la reserva se liberó (el pago venció y nadie lo tomó). */
  servicios_activos: boolean;
  /** Stop sales del CRM cargados después de crear la reserva. Ausente = la base aún no lo informa. */
  disponibilidad?: "ok" | "on_request" | "sin_cupo";
  declarado_en: string | null;
  verificar_antes_de: string | null;
}

export interface PagoPublico {
  ok: true;
  estado: EstadoPago;
  tipo: "abono" | "total";
  riel: RielPago;
  monto_centavos: number;
  moneda: "USD" | "VES" | "USDT";
  tasa_usd_ves: number | null;
  /** Solo VES: con qué tasa BCV se convirtió. «EUR» es tasa, no moneda: se cobra en Bs. */
  tasa_tipo?: "USD" | "EUR" | "mixta" | null;
  expira_en: string;
  /** Solo en pagos nacidos de la compra directa: "web" + el resumen de la reserva. */
  origen?: "web";
  reserva?: ReservaWeb;
}
export interface PagoError { ok: false; error: string; estado?: EstadoPago }
export type RespuestaEstado = PagoPublico | PagoError;

// ------------------------------------------------------------
//  Instructivo por riel — los datos de la cuenta que ve el cliente.
//
//  OJO: estos valores se muestran tal cual a clientes reales. Antes de
//  poner el flujo en producción hay que reemplazar cada "CONFIGURAR ..."
//  por el dato real de la empresa (o moverlos a variables de entorno si se
//  prefiere no versionarlos). Un valor placeholder acá = el cliente paga a
//  una cuenta que no existe.
// ------------------------------------------------------------
export interface InstructivoRiel {
  titulo: string;
  pasos: string[];
  datos: { etiqueta: string; valor: string }[];
}

// Los pasos no dicen «arriba» ni «abajo»: en el teléfono y en escritorio el orden de la página cambia.
const YA_PAGO = "Escríbalo en «¿Ya pagó?» y toque Ya pagué.";
const PASOS_PAGO_MOVIL = [
  "Haga un Pago Móvil por el monto exacto en bolívares.",
  "Copie el número de referencia que le da su banco.",
  YA_PAGO,
];

const INSTRUCTIVOS: Record<RielPago, InstructivoRiel> = {
  zelle: {
    titulo: "Pague por Zelle",
    pasos: [
      "Envíe el monto exacto por Zelle.",
      "Copie el número de confirmación que le da su banco.",
      YA_PAGO,
    ],
    datos: [
      { etiqueta: "Correo Zelle", valor: "corporativo.lotus360@gmail.com" },
      { etiqueta: "Nombre del titular", valor: "Destino Lotus 360 LLC" },
    ],
  },
  pago_movil: {
    titulo: "Pague por Pago Móvil",
    pasos: PASOS_PAGO_MOVIL,
    datos: [
      { etiqueta: "Teléfono", valor: "0414-0415685" },
      { etiqueta: "Cédula / RIF", valor: "J-41293558-5" },
      { etiqueta: "Banco", valor: "Banco Provincial" },
    ],
  },
  c2p: {
    titulo: "Pague por Pago Móvil C2P",
    pasos: PASOS_PAGO_MOVIL,
    datos: [
      { etiqueta: "Teléfono", valor: "0414-0415685" },
      { etiqueta: "Cédula / RIF", valor: "J-41293558-5" },
      { etiqueta: "Banco", valor: "Banco Provincial" },
    ],
  },
  binance: {
    titulo: "Pague con USDT (Binance)",
    pasos: [
      "Envíe el monto exacto en USDT por Binance Pay.",
      "Copie el ID de la transacción (TxID) o el número de orden.",
      YA_PAGO,
    ],
    datos: [
      { etiqueta: "Binance Pay ID / correo", valor: "andricarevalo@gmail.com" },
    ],
  },
  transferencia: {
    titulo: "Pague por transferencia",
    pasos: [
      "Transfiera el monto exacto a nuestra cuenta.",
      "Copie el número de referencia de la transferencia.",
      YA_PAGO,
    ],
    datos: [
      { etiqueta: "Banco", valor: "CONFIGURAR banco" },
      { etiqueta: "Nro. de cuenta", valor: "CONFIGURAR cuenta" },
      { etiqueta: "Titular / RIF", valor: "CONFIGURAR titular y RIF" },
    ],
  },
  tarjeta: {
    titulo: "Pago con tarjeta",
    pasos: ["Este link no procesa tarjetas todavía. Escríbale a su asesor para coordinar el pago."],
    datos: [],
  },
  efectivo: {
    titulo: "Pago en efectivo",
    pasos: ["El pago en efectivo se hace en la oficina. Coordine con su asesor la entrega y traiga este link."],
    datos: [],
  },
};

export function instructivoDe(riel: RielPago): InstructivoRiel {
  return INSTRUCTIVOS[riel] ?? INSTRUCTIVOS.transferencia;
}

// ------------------------------------------------------------
//  Formato de monto. El servidor manda enteros de la unidad menor de la
//  moneda (centavos de USD/USDT, céntimos de Bs). Nunca se hace aritmética
//  de dinero acá: solo se parte en la coma para mostrar. Antes salía
//  «$1.234.56» (punto de miles y punto decimal): ahora es el mismo formato
//  que /reservar, «US$ 1.234,56».
// ------------------------------------------------------------
export function formatearMonto(centavos: number, moneda: PagoPublico["moneda"]): string {
  return montoCentavos(centavos, moneda);
}

// ------------------------------------------------------------
//  Comprobante — mismo límite y mimes que revalida `pago-publico`.
// ------------------------------------------------------------
export const COMPROBANTE_MIMES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
export const COMPROBANTE_LIMITE_BYTES = 5 * 1024 * 1024;

export function validarComprobante(file: File): "formato" | "tamano" | null {
  if (!COMPROBANTE_MIMES.includes(file.type)) return "formato";
  if (file.size > COMPROBANTE_LIMITE_BYTES) return "tamano";
  return null;
}

/** File -> base64 puro (sin el prefijo "data:...;base64,"). El mime viaja aparte. */
export function archivoABase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result as string;
      resolve(r.includes(",") ? r.slice(r.indexOf(",") + 1) : r);
    };
    reader.onerror = () => reject(reader.error ?? new Error("No se pudo leer el archivo."));
    reader.readAsDataURL(file);
  });
}

// ------------------------------------------------------------
//  Llamadas al route de Next (mismo origen).
// ------------------------------------------------------------
/** Errores que no dicen nada del link (red caída, servicio lento): se ofrece reintentar, no «link no válido». */
export const ERRORES_TRANSITORIOS = ["sin_red", "servicio_no_disponible", "tiempo_agotado", "no_configurado"];

export async function consultarEstado(token: string): Promise<RespuestaEstado> {
  let res: Response;
  try {
    res = await fetch(`/api/pago/${token}`, { method: "GET", cache: "no-store" });
  } catch {
    return { ok: false, error: "sin_red" };
  }
  const data = (await res.json().catch(() => null)) as RespuestaEstado | null;
  return data ?? { ok: false, error: "servicio_no_disponible" };
}

export interface DeclararArgs {
  token: string;
  referencia: string;
  turnstileToken: string;
  comprobanteBase64?: string;
  comprobanteMime?: string;
}

export async function declarar(args: DeclararArgs): Promise<{ ok: boolean; error?: string; estado?: string }> {
  let res: Response;
  try {
    res = await fetch(`/api/pago/${args.token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        referencia: args.referencia,
        turnstile_token: args.turnstileToken,
        comprobante_base64: args.comprobanteBase64,
        comprobante_mime: args.comprobanteMime,
      }),
    });
  } catch {
    return { ok: false, error: "sin_red" };
  }
  const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string; estado?: string } | null;
  return { ok: Boolean(res.ok && data?.ok), error: data?.error, estado: data?.estado };
}
