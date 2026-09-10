// Cara pública del link de pago del asesor (Fase 1). El navegador habla con
// `/api/pago/[token]` (mismo origen), que verifica Turnstile y reenvía a la
// Edge Function `pago-publico` server-to-server. El cliente nunca toca
// Supabase directo ni conoce el `p_secret`.

export type RielPago =
  | "pago_movil" | "c2p" | "zelle" | "binance"
  | "tarjeta" | "efectivo" | "transferencia";

export type EstadoPago =
  | "emitido" | "pendiente_verificacion" | "verificado"
  | "rechazado" | "vencido" | "reembolsado";

export interface PagoPublico {
  ok: true;
  estado: EstadoPago;
  tipo: "abono" | "total";
  riel: RielPago;
  monto_centavos: number;
  moneda: "USD" | "VES" | "USDT";
  tasa_usd_ves: number | null;
  expira_en: string;
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

const INSTRUCTIVOS: Record<RielPago, InstructivoRiel> = {
  zelle: {
    titulo: "Pago por Zelle",
    pasos: [
      "Envía el monto exacto indicado arriba desde tu app bancaria por Zelle.",
      "Copia el número de confirmación de Zelle.",
      "Pégalo abajo en “Referencia” y adjunta la captura del comprobante.",
    ],
    datos: [
      { etiqueta: "Correo Zelle", valor: "CONFIGURAR correo Zelle" },
      { etiqueta: "Nombre del titular", valor: "CONFIGURAR titular" },
    ],
  },
  pago_movil: {
    titulo: "Pago Móvil (Bs)",
    pasos: [
      "Haz un Pago Móvil por el monto exacto en bolívares indicado arriba.",
      "Guarda el número de referencia que te da el banco.",
      "Escríbelo abajo en “Referencia” y adjunta la captura.",
    ],
    datos: [
      { etiqueta: "Teléfono", valor: "CONFIGURAR teléfono Pago Móvil" },
      { etiqueta: "Cédula / RIF", valor: "CONFIGURAR cédula/RIF" },
      { etiqueta: "Banco", valor: "CONFIGURAR banco" },
    ],
  },
  c2p: {
    titulo: "Pago Móvil C2P (Bs)",
    pasos: [
      "Haz un Pago Móvil por el monto exacto en bolívares indicado arriba.",
      "Guarda el número de referencia del banco.",
      "Escríbelo abajo en “Referencia” y adjunta la captura.",
    ],
    datos: [
      { etiqueta: "Teléfono", valor: "CONFIGURAR teléfono Pago Móvil" },
      { etiqueta: "Cédula / RIF", valor: "CONFIGURAR cédula/RIF" },
      { etiqueta: "Banco", valor: "CONFIGURAR banco" },
    ],
  },
  binance: {
    titulo: "Pago con USDT (Binance)",
    pasos: [
      "Envía el monto exacto en USDT a la cuenta indicada.",
      "Copia el ID de la transacción (TxID) o el número de orden de Binance Pay.",
      "Pégalo abajo en “Referencia” y adjunta la captura.",
    ],
    datos: [
      { etiqueta: "Binance Pay ID / correo", valor: "CONFIGURAR Binance Pay ID" },
      { etiqueta: "Red (si es transferencia on-chain)", valor: "USDT · CONFIGURAR red" },
    ],
  },
  transferencia: {
    titulo: "Transferencia bancaria",
    pasos: [
      "Transfiere el monto exacto a la cuenta indicada.",
      "Guarda el número de referencia de la transferencia.",
      "Escríbelo abajo en “Referencia” y adjunta el comprobante.",
    ],
    datos: [
      { etiqueta: "Banco", valor: "CONFIGURAR banco" },
      { etiqueta: "Nro. de cuenta", valor: "CONFIGURAR cuenta" },
      { etiqueta: "Titular / RIF", valor: "CONFIGURAR titular y RIF" },
    ],
  },
  tarjeta: {
    titulo: "Pago con tarjeta",
    pasos: ["Este link no procesa tarjetas todavía. Escríbele a tu asesor para coordinar el pago."],
    datos: [],
  },
  efectivo: {
    titulo: "Pago en efectivo",
    pasos: ["El pago en efectivo se hace en la oficina. Coordina con tu asesor la entrega y trae este link."],
    datos: [],
  },
};

export function instructivoDe(riel: RielPago): InstructivoRiel {
  return INSTRUCTIVOS[riel] ?? INSTRUCTIVOS.transferencia;
}

// ------------------------------------------------------------
//  Formato de monto. El servidor manda enteros de la unidad menor de la
//  moneda (centavos de USD/USDT, céntimos de Bs). Nunca se hace aritmética
//  de dinero acá: solo se parte en la coma para mostrar.
// ------------------------------------------------------------
export function formatearMonto(centavos: number, moneda: PagoPublico["moneda"]): string {
  const entero = Math.trunc(Math.abs(centavos) / 100);
  const resto = String(Math.abs(centavos) % 100).padStart(2, "0");
  const miles = entero.toLocaleString("es-VE");
  if (moneda === "VES") return `Bs ${miles},${resto}`;
  if (moneda === "USDT") return `${miles}.${resto} USDT`;
  return `$${miles}.${resto}`;
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
export async function consultarEstado(token: string): Promise<RespuestaEstado> {
  const res = await fetch(`/api/pago/${token}`, { method: "GET", cache: "no-store" });
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
  const res = await fetch(`/api/pago/${args.token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      referencia: args.referencia,
      turnstile_token: args.turnstileToken,
      comprobante_base64: args.comprobanteBase64,
      comprobante_mime: args.comprobanteMime,
    }),
  });
  const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string; estado?: string } | null;
  return { ok: Boolean(res.ok && data?.ok), error: data?.error, estado: data?.estado };
}
