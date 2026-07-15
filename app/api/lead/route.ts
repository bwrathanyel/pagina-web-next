import { NextResponse } from "next/server";

/** Server-side proxy to the CRM's ingest-web-lead Edge Function. The
 * browser never calls that function directly: its CORS is hardcoded to
 * the production domain, so a Vercel preview URL would be rejected.
 * This route is same-origin from the browser's point of view, then
 * forwards server-to-server where CORS doesn't apply. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || Array.isArray(body)) {
    return NextResponse.json({ ok: false, error: "body_invalido" }, { status: 400 });
  }

  const texto = (campo: string, maximo: number) =>
    typeof body[campo] === "string" ? body[campo].trim().slice(0, maximo) : "";
  const datos = {
    nombre: texto("nombre", 160),
    telefono: texto("telefono", 40),
    destino: texto("destino", 220) || ".",
    personas: texto("personas", 160),
    consulta: texto("consulta", 3000),
  };
  if (!datos.nombre || !datos.telefono) {
    return NextResponse.json({ ok: false, error: "datos_invalidos" }, { status: 400 });
  }

  const url = process.env.INGEST_LEAD_URL;
  if (!url) {
    return NextResponse.json({ ok: false, error: "no_configurado" }, { status: 503 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    return NextResponse.json({ ok: false, error: "crm_no_disponible" }, { status: 502 });
  }

  const data = await upstream.json().catch(() => ({ ok: upstream.ok }));
  return NextResponse.json(data, { status: upstream.status });
}
