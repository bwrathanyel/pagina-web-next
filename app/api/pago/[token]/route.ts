import { NextResponse } from "next/server";
import { verificarTurnstile } from "../../_shared/turnstile";

/** Proxy server-to-server a la Edge Function `pago-publico` del CRM -- mismo
 * patrón que /api/lead y /api/postular-empleo: el navegador nunca llama a
 * Supabase directo (su CORS está fijado al dominio de producción y no
 * aceptaría una preview URL). Este route es mismo-origen desde el navegador
 * y agrega el `p_secret` + la verificación de Turnstile, que son la frontera
 * de anti-abuso del formulario público. */

const TOKEN_RE = /^[0-9a-f]{64}$/;

function config(): { url: string; apiKey: string } | null {
  const url = process.env.PAGO_PUBLICO_URL;
  const apiKey = process.env.WEB_CHAT_API_KEY;
  return url && apiKey ? { url, apiKey } : null;
}

async function reenviar(cfg: { url: string; apiKey: string }, payload: Record<string, unknown>) {
  let upstream: Response;
  try {
    upstream = await fetch(cfg.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, p_secret: cfg.apiKey }),
      signal: AbortSignal.timeout(60_000),
    });
  } catch (fetchError) {
    const timeout = fetchError instanceof Error && (fetchError.name === "TimeoutError" || fetchError.name === "AbortError");
    return NextResponse.json(
      { ok: false, error: timeout ? "tiempo_agotado" : "servicio_no_disponible" },
      { status: timeout ? 504 : 502 },
    );
  }
  const data = await upstream.json().catch(() => ({ ok: upstream.ok }));
  return NextResponse.json(data, { status: upstream.status });
}

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!TOKEN_RE.test(token)) {
    return NextResponse.json({ ok: false, error: "token_invalido" }, { status: 400 });
  }
  const cfg = config();
  if (!cfg) return NextResponse.json({ ok: false, error: "no_configurado" }, { status: 503 });
  return reenviar(cfg, { action: "estado", p_token: token });
}

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!TOKEN_RE.test(token)) {
    return NextResponse.json({ ok: false, error: "token_invalido" }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || Array.isArray(body)) {
    return NextResponse.json({ ok: false, error: "body_invalido" }, { status: 400 });
  }

  if (!(await verificarTurnstile(body.turnstile_token, request))) {
    return NextResponse.json({ ok: false, error: "captcha_invalido" }, { status: 403 });
  }

  const referencia = typeof body.referencia === "string" ? body.referencia.trim().slice(0, 120) : "";
  if (!referencia) {
    return NextResponse.json({ ok: false, error: "falta_referencia" }, { status: 400 });
  }

  const cfg = config();
  if (!cfg) return NextResponse.json({ ok: false, error: "no_configurado" }, { status: 503 });

  return reenviar(cfg, {
    action: "declarar",
    p_token: token,
    referencia,
    comprobante_base64: typeof body.comprobante_base64 === "string" ? body.comprobante_base64 : undefined,
    comprobante_mime: typeof body.comprobante_mime === "string" ? body.comprobante_mime : undefined,
  });
}
