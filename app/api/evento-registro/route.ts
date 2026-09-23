import { NextResponse } from "next/server";

/** Proxy server-side a la Edge Function registrar-cliente-evento (registro por QR en
 * activaciones de eventos) -- mismo patrón que /api/postular-empleo. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || Array.isArray(body)) {
    return NextResponse.json({ ok: false, error: "body_invalido" }, { status: 400 });
  }

  const texto = (campo: string, maximo: number) =>
    typeof body[campo] === "string" ? (body[campo] as string).trim().slice(0, maximo) : "";
  // Honeypot: campo invisible que solo llenan los bots.
  if (texto("empresa", 80)) return NextResponse.json({ ok: false, error: "datos_invalidos" }, { status: 400 });

  const datos = {
    evento: texto("evento", 60),
    nombre: texto("nombre", 160),
    telefono: texto("telefono", 40),
    instagram: texto("instagram", 60) || undefined,
    interes: texto("interes", 20) || undefined,
    acepta_promos: body.acepta_promos === true,
  };
  if (!datos.evento || !datos.nombre || !datos.telefono || body.acepta_bases !== true) {
    return NextResponse.json({ ok: false, error: "datos_invalidos" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const url = process.env.REGISTRAR_CLIENTE_EVENTO_URL
    ?? (supabaseUrl ? `${supabaseUrl}/functions/v1/registrar-cliente-evento` : undefined);
  const apiKey = process.env.WEB_CHAT_API_KEY;
  if (!url || !apiKey) {
    return NextResponse.json({ ok: false, error: "no_configurado" }, { status: 503 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...datos, p_secret: apiKey }),
      signal: AbortSignal.timeout(20_000),
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
