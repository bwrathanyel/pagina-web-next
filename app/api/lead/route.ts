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
  if (!datos.nombre || datos.destino === ".") {
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
      signal: AbortSignal.timeout(60_000),
    });
  } catch (fetchError) {
    const timeout = fetchError instanceof Error && (fetchError.name === "TimeoutError" || fetchError.name === "AbortError");
    await registrarLeadFallido(datos, timeout ? "next_proxy_timeout" : "next_proxy_sin_respuesta");
    return NextResponse.json(
      { ok: false, error: timeout ? "tiempo_agotado" : "servicio_no_disponible" },
      { status: timeout ? 504 : 502 },
    );
  }

  const data = await upstream.json().catch(() => ({ ok: upstream.ok })) as Record<string, unknown>;
  // La edge ya registra en leads_fallidos las fallas que ocurren adentro
  // (incl. telefono_invalido -> 422). El único hueco es que la respuesta
  // llegue con un 5xx sin cuerpo util: ahí el lead no quedó anotado en
  // ningún lado, así que lo registramos desde acá para que el cron
  // recuperar-leads-fallidos lo recupere igual.
  if (upstream.status >= 500 && data?.ok !== true) {
    await registrarLeadFallido(datos, `next_proxy_http_${upstream.status}`);
  }
  return NextResponse.json(data, { status: upstream.status });
}

/** Última red de seguridad: si el lead no llegó al CRM y tampoco quedó en
 * leads_fallidos (la edge nunca respondió bien), lo anotamos vía una edge
 * mínima con service_role. Siempre deja rastro en el log del Worker aunque
 * esa llamada también falle — Cloudflare observability lo captura. */
async function registrarLeadFallido(datos: Record<string, string>, motivo: string): Promise<void> {
  console.error(JSON.stringify({ evento: "lead_web_fallido", motivo, nombre: datos.nombre, telefono: datos.telefono, destino: datos.destino }));
  const url = process.env.REGISTRAR_LEAD_FALLIDO_URL;
  const secret = process.env.WEB_CHAT_API_KEY;
  if (!url || !secret) return;
  try {
    // Timeout corto: la request del usuario ya falló y espera esta llamada.
    // El console.error de arriba es el rastro durable; esto es el mejor esfuerzo.
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...datos, motivo, p_secret: secret }),
      signal: AbortSignal.timeout(4_000),
    });
  } catch {
    // El console.error de arriba ya dejó el rastro; nada más que hacer.
  }
}
