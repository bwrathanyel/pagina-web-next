import { NextResponse } from "next/server";
import { clientKey } from "../_shared/client-key";

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
  // cv_base64/cv_mime son opcionales -- el candidato puede adjuntar su CV con
  // el botón de clip del chat. La validación de formato/tamaño la hace la
  // Edge Function (_shared/cv.ts, mismo límite que usa postular-empleo); acá
  // solo se reenvía tal cual, igual que con ese otro route.
  const cvBase64 = typeof body.cv_base64 === "string" ? body.cv_base64 : undefined;
  const cvMime = typeof body.cv_mime === "string" ? body.cv_mime : undefined;
  if (!sessionId || (!mensaje && !(cvBase64 && cvMime))) {
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
      body: JSON.stringify({ p_secret: apiKey, session_id: sessionId, mensaje, cv_base64: cvBase64, cv_mime: cvMime, client_key: clientKey(request) }),
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
