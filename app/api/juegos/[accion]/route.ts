import { NextResponse } from "next/server";
import { clientKey } from "../../_shared/client-key";
import { verificarTurnstile } from "../../_shared/turnstile";

/** Proxy de /juegos hacia la edge function juegos-api. El navegador nunca la
 * llama directo: aquí se verifica Turnstile (solo en las acciones que gastan
 * un giro o crean un lead) y se agregan la IP real y el secreto compartido,
 * que no pueden salir al cliente. Solo pasan los campos que la función usa. */

const ACCIONES = new Set(["iniciar", "nivel", "estado", "girar", "reclamar"]);
const CON_TURNSTILE = new Set(["girar", "reclamar"]);
const CAMPOS = ["token", "juego", "nivel", "ms", "paso", "nombre", "telefono", "acepta_promos"] as const;
const SIN_CACHE = { "Cache-Control": "no-store" };

export async function POST(request: Request, { params }: { params: Promise<{ accion: string }> }) {
  const { accion } = await params;
  if (!ACCIONES.has(accion)) {
    return NextResponse.json({ ok: false, error: "accion_invalida" }, { status: 404, headers: SIN_CACHE });
  }
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || Array.isArray(body)) {
    return NextResponse.json({ ok: false, error: "body_invalido" }, { status: 400, headers: SIN_CACHE });
  }
  if (CON_TURNSTILE.has(accion) && !(await verificarTurnstile(body.turnstile, request))) {
    return NextResponse.json({ ok: false, error: "turnstile" }, { status: 403, headers: SIN_CACHE });
  }

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.WEB_CHAT_API_KEY;
  if (!base || !secret) {
    return NextResponse.json({ ok: false, error: "no_configurado" }, { status: 503, headers: SIN_CACHE });
  }

  const datos: Record<string, unknown> = { accion, ip: clientKey(request), p_secret: secret };
  for (const campo of CAMPOS) if (body[campo] !== undefined) datos[campo] = body[campo];

  let upstream: Response;
  try {
    upstream = await fetch(`${base}/functions/v1/juegos-api`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    return NextResponse.json({ ok: false, error: "servicio_no_disponible" }, { status: 502, headers: SIN_CACHE });
  }
  const data = await upstream.json().catch(() => null) as Record<string, unknown> | null;
  if (!data) {
    return NextResponse.json({ ok: false, error: "servicio_no_disponible" }, { status: 502, headers: SIN_CACHE });
  }
  return NextResponse.json(data, { status: upstream.status, headers: SIN_CACHE });
}
