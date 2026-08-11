import { NextResponse } from "next/server";

/** Proxy server-to-server hacia reescribir-descripcion-negocio, mismo patrón
 * que /api/perfil-instagram: el navegador nunca llama a la Edge Function
 * directo porque su CORS apunta a producción y una preview sería rechazada.
 *
 * El límite de uso vive en la Edge Function (por IP y por hora), no acá. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || Array.isArray(body)) {
    return NextResponse.json({ ok: false, error: "body_invalido" }, { status: 400 });
  }

  const nombre = typeof body.nombre === "string" ? body.nombre : "";
  const tipo = typeof body.tipo === "string" ? body.tipo : "";
  const descripcion = typeof body.descripcion === "string" ? body.descripcion : "";
  if (!descripcion.trim()) {
    return NextResponse.json({ ok: false, error: "datos_invalidos" }, { status: 400 });
  }

  const url = process.env.REESCRIBIR_DESCRIPCION_URL;
  if (!url) {
    return NextResponse.json({ ok: false, error: "no_configurado" }, { status: 503 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": request.headers.get("x-forwarded-for") ?? "",
      },
      body: JSON.stringify({ nombre, tipo, descripcion }),
      signal: AbortSignal.timeout(25_000),
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
