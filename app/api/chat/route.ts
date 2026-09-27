import { NextResponse } from "next/server";
import { clientKey } from "../_shared/client-key";

/** Server-side proxy to web-sales-chat-deepseek (mismo patrón que
 * app/api/lead/route.ts): agrega el secret compartido server-side, nunca
 * llega al navegador. También evita el mismo problema de CORS que motiva el
 * proxy de /api/lead. */
// Foto JPEG ≤1600px o nota de voz WAV 16 kHz ≤60 s, en base64 (~2,6 MB).
const MAX_ADJUNTO = 4_000_000;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || Array.isArray(body)) {
    return NextResponse.json({ ok: false, error: "body_invalido" }, { status: 400 });
  }

  const sessionId = typeof body.session_id === "string" ? body.session_id.trim() : "";
  const mensaje = typeof body.mensaje === "string" ? body.mensaje.trim().slice(0, 4000) : "";
  const adj = body.adjunto as { tipo?: unknown; data?: unknown } | undefined;
  const adjunto =
    adj && (adj.tipo === "imagen" || adj.tipo === "audio") && typeof adj.data === "string" && adj.data.length <= MAX_ADJUNTO
      ? { tipo: adj.tipo, data: adj.data }
      : undefined;
  const contexto = typeof body.contexto === "string" ? body.contexto.slice(0, 600) : undefined;
  if (!sessionId || (!mensaje && !adjunto)) {
    return NextResponse.json({ ok: false, error: "datos_invalidos" }, { status: 400 });
  }

  const url = process.env.WEB_CHAT_URL;
  const apiKey = process.env.WEB_CHAT_API_KEY;
  if (!url || !apiKey) {
    return NextResponse.json({ ok: false, error: "no_configurado" }, { status: 503 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        p_secret: apiKey,
        session_id: sessionId,
        mensaje,
        adjunto,
        contexto,
        client_key: clientKey(request),
      }),
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
