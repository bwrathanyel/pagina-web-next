import { NextResponse } from "next/server";

/** Proxy server-to-server hacia leer-perfil-instagram, mismo patrón que
 * /api/chat: el navegador nunca llama a la Edge Function directo porque su
 * CORS apunta a producción y una preview de Vercel sería rechazada.
 *
 * El límite de uso vive en la Edge Function (por IP y por hora), no acá: es
 * la que gasta los tokens y la que tiene que defenderse aunque alguien la
 * llame sin pasar por esta ruta. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || Array.isArray(body)) {
    return NextResponse.json({ ok: false, error: "body_invalido" }, { status: 400 });
  }

  const imagen = typeof body.imagen_base64 === "string" ? body.imagen_base64 : "";
  const mime = typeof body.mime_type === "string" ? body.mime_type : "";
  if (!imagen || !mime) {
    return NextResponse.json({ ok: false, error: "datos_invalidos" }, { status: 400 });
  }

  const url = process.env.PERFIL_IG_URL;
  if (!url) {
    return NextResponse.json({ ok: false, error: "no_configurado" }, { status: 503 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Se reenvía la IP real del visitante: sin esto, la Edge Function vería
        // siempre la del servidor y el límite por IP sería un límite global.
        "x-forwarded-for": request.headers.get("x-forwarded-for") ?? "",
      },
      body: JSON.stringify({ imagen_base64: imagen, mime_type: mime }),
      signal: AbortSignal.timeout(70_000),
    });
  } catch (fetchError) {
    const timeout = fetchError instanceof Error
      && (fetchError.name === "TimeoutError" || fetchError.name === "AbortError");
    return NextResponse.json(
      { ok: false, error: timeout ? "tiempo_agotado" : "servicio_no_disponible" },
      { status: timeout ? 504 : 502 },
    );
  }

  const data = await upstream.json().catch(() => null);
  return NextResponse.json(data ?? { ok: false, error: "respuesta_invalida" }, {
    status: upstream.ok ? 200 : upstream.status,
  });
}
