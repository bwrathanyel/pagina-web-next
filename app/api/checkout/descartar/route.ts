import { NextResponse } from "next/server";
import { clientKey } from "../../_shared/client-key";

/** «Descartar» del aviso de reserva abierta en /reservar: suelta la reserva web que quedó esperando pago y
 * libera el cupo. La única llave es el token del link de pago (64 hex) que guardó este navegador; la base
 * se niega si ya hay un pago declarado o verificado (`pago_en_curso`). */

function destino(): { url: string; apiKey: string } | null {
  const apiKey = process.env.WEB_CHAT_API_KEY;
  const url = process.env.CHECKOUT_WEB_URL
    ?? process.env.PAGO_PUBLICO_URL?.replace(/\/pago-publico\/?$/, "/checkout-web");
  return url && apiKey && /\/checkout-web\/?$/.test(url) ? { url, apiKey } : null;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const token = typeof body?.token === "string" ? body.token : "";
  if (!/^[0-9a-f]{64}$/.test(token)) return NextResponse.json({ ok: false, error: "token_invalido" }, { status: 400 });
  const cfg = destino();
  if (!cfg) return NextResponse.json({ ok: false, error: "no_configurado" }, { status: 503 });
  try {
    const res = await fetch(cfg.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "descartar", token, client_key: clientKey(request), p_secret: cfg.apiKey }),
      signal: AbortSignal.timeout(30_000),
    });
    const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    if (data?.ok === true) return NextResponse.json({ ok: true });
    const error = typeof data?.error === "string" ? data.error : "servicio_no_disponible";
    return NextResponse.json({ ok: false, error }, { status: res.status >= 400 ? res.status : 502 });
  } catch {
    return NextResponse.json({ ok: false, error: "servicio_no_disponible" }, { status: 502 });
  }
}
