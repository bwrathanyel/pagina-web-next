import { NextResponse } from "next/server";

/** Proxy server-side a entrevista-empleo-chat (mismo patrón que
 * app/api/chat/route.ts): agrega el secret compartido acá, nunca llega al
 * navegador, y evita el CORS del dominio de funciones de Supabase.
 * Reusa WEB_CHAT_API_KEY -- es el mismo gate de abuso, no hace falta un
 * secreto nuevo para el mismo origen y el mismo tipo de endpoint. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || Array.isArray(body)) {
    return NextResponse.json({ ok: false, error: "body_invalido" }, { status: 400 });
  }

  const sessionId = typeof body.session_id === "string" ? body.session_id.trim() : "";
  const mensaje = typeof body.mensaje === "string" ? body.mensaje.trim().slice(0, 2000) : "";
  if (!sessionId || !mensaje) {
    return NextResponse.json({ ok: false, error: "datos_invalidos" }, { status: 400 });
  }

  const url = process.env.ENTREVISTA_EMPLEO_URL;
  const apiKey = process.env.WEB_CHAT_API_KEY;
  if (!url || !apiKey) {
    return NextResponse.json({ ok: false, error: "no_configurado" }, { status: 503 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ p_secret: apiKey, session_id: sessionId, mensaje }),
      signal: AbortSignal.timeout(60_000),
    });
  } catch (fetchError) {
    const timeout = fetchError instanceof Error && (fetchError.name === "TimeoutError" || fetchError.name === "AbortError");
    return NextResponse.json(
      { ok: false, error: timeout ? "crm_timeout" : "crm_no_disponible" },
      { status: timeout ? 504 : 502 },
    );
  }

  const data = await upstream.json().catch(() => ({ ok: upstream.ok }));
  return NextResponse.json(data, { status: upstream.status });
}
