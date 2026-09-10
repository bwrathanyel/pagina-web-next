import { NextResponse } from "next/server";

/** Server-side proxy to the Sheet Monkey form the business still keeps as a
 * parallel report. The browser never sees the form URL: it lives only in
 * SHEET_MONKEY_URL here. Fire-and-forget from the client's point of view —
 * a failure here must never affect the lead flow or the WhatsApp handoff. */
const ORIGEN_OK = "https://destinoyeventoslotus360.com";

export async function POST(request: Request) {
  // Relay same-origin: sólo lo llama el navegador desde el propio sitio.
  // Un Origin ajeno (o ausente, que el navegador siempre manda en un POST
  // cross-site) es tráfico que no debería llegar acá.
  const origen = request.headers.get("origin");
  if (origen && origen !== ORIGEN_OK) {
    return NextResponse.json({ ok: false, error: "origen_no_permitido" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || Array.isArray(body)) {
    return NextResponse.json({ ok: false, error: "body_invalido" }, { status: 400 });
  }

  const texto = (campo: string, maximo: number) =>
    typeof body[campo] === "string" ? (body[campo] as string).trim().slice(0, maximo) : "";

  const url = process.env.SHEET_MONKEY_URL;
  if (!url) {
    return NextResponse.json({ ok: false, error: "no_configurado" }, { status: 503 });
  }

  const formData = new FormData();
  formData.append("Nombres", texto("nombre", 160) || "No especificado");
  formData.append("Fecha", new Date().toLocaleString("es-VE"));
  formData.append("Destino", texto("destino", 220));
  formData.append("Pagina", texto("pagina", 80));
  formData.append("Servicio", texto("servicio", 220));
  formData.append("Procedencia", texto("procedencia", 120) || "No detectada");
  formData.append("Telefono", texto("telefono", 40) || "No especificado");
  formData.append("Asesor", texto("asesor", 40) || "No asignado");

  try {
    const upstream = await fetch(url, {
      method: "POST",
      // Sheet Monkey está detrás de CloudFront y rechaza con 403 cualquier
      // request sin User-Agent. El fetch del runtime de Workers no manda uno
      // por defecto, así que lo ponemos explícito. No fijar Content-Type:
      // FormData necesita setear su propio boundary.
      headers: { "User-Agent": "LotusWeb/1.0 (+https://destinoyeventoslotus360.com)" },
      body: formData,
      signal: AbortSignal.timeout(15_000),
    });
    if (!upstream.ok) {
      console.error(JSON.stringify({ evento: "sheet_monkey_fallo", status: upstream.status, nombre: texto("nombre", 160) }));
      return NextResponse.json({ ok: false, error: "upstream_error" }, { status: 502 });
    }
  } catch (fetchError) {
    console.error(JSON.stringify({
      evento: "sheet_monkey_fallo",
      motivo: fetchError instanceof Error ? fetchError.name : "desconocido",
      nombre: texto("nombre", 160),
    }));
    return NextResponse.json({ ok: false, error: "servicio_no_disponible" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
