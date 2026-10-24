import { NextResponse } from "next/server";
import { clientKey } from "../_shared/client-key";
import { verificarTurnstile } from "../_shared/turnstile";
import { calcularHospedaje, fechaValida, servicioHospedaje, validarContacto, type SolicitudHospedaje } from "@/lib/checkout/calculo";
import { bloqueosDe, hotelParaCobrar } from "@/lib/checkout/datos";
import { POLITICA_CANCELACION } from "@/lib/checkout/politica";

/** Compra directa de hospedaje (Plan 1). El navegador manda QUÉ quiere comprar (hotel, habitación, fechas,
 * viajeros) y quién es; este route verifica Turnstile, RECALCULA el precio desde la base con las mismas
 * funciones puras que usa /reservar y reenvía a la Edge Function `checkout-web` con el secreto del servidor.
 * El total que mande el navegador (`total_mostrado`) nunca se cobra: solo sirve para avisar «el precio cambió».
 *
 * `idempotency_key`: la genera el navegador una vez por intento de compra (un uuid por formulario). El mismo
 * envío repetido por doble clic o reintento de red devuelve la misma reserva en vez de crear otra. */

const KEY_RE = /^[A-Za-z0-9:._-]{8,100}$/;

function destino(): { url: string; apiKey: string } | null {
  const apiKey = process.env.WEB_CHAT_API_KEY;
  // CHECKOUT_WEB_URL si existe; si no, la hermana de PAGO_PUBLICO_URL (misma base de funciones).
  const url = process.env.CHECKOUT_WEB_URL
    ?? process.env.PAGO_PUBLICO_URL?.replace(/\/pago-publico\/?$/, "/checkout-web");
  return url && apiKey && /\/checkout-web\/?$/.test(url) ? { url, apiKey } : null;
}

async function llamar(cfg: { url: string; apiKey: string }, payload: Record<string, unknown>) {
  try {
    const res = await fetch(cfg.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, p_secret: cfg.apiKey }),
      signal: AbortSignal.timeout(60_000),
    });
    const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    return { status: res.status, data: data ?? { ok: false, error: "servicio_no_disponible" } };
  } catch (e) {
    const timeout = e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
    return { status: timeout ? 504 : 502, data: { ok: false, error: timeout ? "tiempo_agotado" : "servicio_no_disponible" } };
  }
}

/** Parámetros públicos del checkout (¿está activo?, fee, retención, topes) para que /reservar los muestre. */
export async function GET() {
  const cfg = destino();
  if (!cfg) return NextResponse.json({ ok: false, error: "no_configurado" }, { status: 503 });
  const { data } = await llamar(cfg, { action: "config" });
  // Lista blanca: lo que la Edge Function agregue mañana no sale al navegador sin pasar por acá.
  if (data.ok !== true || !POLITICA_CANCELACION) {
    return NextResponse.json({ ok: true, activo: false }, { headers: { "Cache-Control": "no-store" } });
  }
  return NextResponse.json(
    { ok: true, activo: data.activo === true, abierto: data.abierto !== false, hora_abre: data.hora_abre, hora_cierra: data.hora_cierra, fee_pct: data.fee_pct, igtf_pct: data.igtf_pct, hold_horas_usd: data.hold_horas_usd, hold_horas_ves: data.hold_horas_ves },
    { headers: { "Cache-Control": "no-store" } },
  );
}

const MAX_ID = 2_000_000_000;
const entero = (v: unknown) =>
  typeof v === "number" && Number.isInteger(v) && Math.abs(v) <= MAX_ID ? v : typeof v === "string" && /^\d{1,9}$/.test(v) ? Number(v) : NaN;

export async function POST(request: Request) {
  // El cliente debe ver la política de cancelación antes de pagar: sin ella redactada no se vende por ninguna vía.
  if (!POLITICA_CANCELACION) return NextResponse.json({ ok: false, error: "checkout_desactivado" }, { status: 503 });
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || Array.isArray(body)) return NextResponse.json({ ok: false, error: "body_invalido" }, { status: 400 });

  if (!(await verificarTurnstile(body.turnstile_token, request))) {
    return NextResponse.json({ ok: false, error: "captcha_invalido" }, { status: 403 });
  }
  if (body.acepta_terminos !== true) return NextResponse.json({ ok: false, error: "terminos_no_aceptados" }, { status: 400 });

  const errContacto = validarContacto({ nombre: body.nombre, telefono: body.telefono, email: body.email, riel: body.riel });
  if (errContacto) return NextResponse.json({ ok: false, error: errContacto }, { status: 400 });
  const key = typeof body.idempotency_key === "string" ? body.idempotency_key : "";
  if (!KEY_RE.test(key)) return NextResponse.json({ ok: false, error: "idempotency_invalida" }, { status: 400 });

  const edades = Array.isArray(body.edades) ? body.edades.map(entero) : [];
  const sel: SolicitudHospedaje = {
    productoId: entero(body.producto_id),
    tarifaId: entero(body.tarifa_id),
    desde: typeof body.desde === "string" ? body.desde : "",
    hasta: typeof body.hasta === "string" ? body.hasta : "",
    adultos: entero(body.adultos),
    edades,
    bebes: body.bebes === undefined ? 0 : entero(body.bebes),
  };
  if (!Number.isInteger(sel.productoId) || !Number.isInteger(sel.tarifaId) || edades.length > 12) {
    return NextResponse.json({ ok: false, error: "datos_invalidos" }, { status: 400 });
  }
  // Antes de tocar la base: una fecha que no existe no debe llegar a un cast de Postgres.
  if (!fechaValida(sel.desde) || !fechaValida(sel.hasta)) {
    return NextResponse.json({ ok: false, error: "fechas_invalidas", texto: "Elija la fecha de entrada y de salida." }, { status: 422 });
  }

  const cfg = destino();
  if (!cfg) return NextResponse.json({ ok: false, error: "no_configurado" }, { status: 503 });

  let hotel, bloqueos;
  try {
    [hotel, bloqueos] = await Promise.all([
      hotelParaCobrar(sel.productoId),
      sel.hasta > sel.desde ? bloqueosDe(sel.productoId, sel.desde, sel.hasta) : Promise.resolve([]),
    ]);
  } catch {
    return NextResponse.json({ ok: false, error: "servicio_no_disponible" }, { status: 502 });
  }
  if (!hotel) return NextResponse.json({ ok: false, error: "hotel_no_disponible" }, { status: 404 });

  const calculo = calcularHospedaje(hotel, sel, bloqueos);
  if (!calculo.ok) {
    return NextResponse.json({ ok: false, error: calculo.error, texto: calculo.texto, minimo: calculo.minimo }, { status: 422 });
  }
  const mostrado = typeof body.total_mostrado === "number" ? body.total_mostrado : NaN;
  if (Number.isFinite(mostrado) && Math.abs(mostrado - calculo.precio) > 0.005) {
    return NextResponse.json({ ok: false, error: "precio_cambio", precio: calculo.precio }, { status: 409 });
  }

  const { status, data } = await llamar(cfg, {
    action: "crear",
    nombre: (body.nombre as string).trim(),
    telefono: (body.telefono as string).trim(),
    email: (body.email as string).trim(),
    riel: body.riel,
    idempotency_key: key,
    client_key: clientKey(request),
    destino: hotel.destino ?? undefined,
    servicios: [servicioHospedaje(hotel, sel, calculo)],
  });

  if (data.ok !== true) {
    return NextResponse.json({ ok: false, error: typeof data.error === "string" ? data.error : "servicio_no_disponible" }, { status: status >= 400 ? status : 502 });
  }
  // Solo lo que necesita /pagar: el token del link de pago y los montos que ya fijó la base.
  return NextResponse.json({
    ok: true,
    token: data.token,
    codigo: data.codigo,
    expira_en: data.expira_en,
    riel: data.riel,
    moneda: data.moneda,
    monto_centavos: data.monto_centavos,
    monto_usd_centavos: data.monto_usd_centavos,
    // Bs por cada USD de la reserva y cuál tasa BCV fue ('USD' | 'EUR' | 'mixta'): «EUR» es tasa, no moneda.
    tasa_ves: data.tasa_ves ?? data.tasa_usd_ves ?? null,
    tasa_tipo: data.tasa_tipo ?? null,
    tasa_usd_ves: data.tasa_usd_ves ?? null,
    reutilizado: data.reutilizado === true,
  });
}
