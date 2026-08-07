import { NextResponse } from "next/server";
import { clientKey } from "../_shared/client-key";

/** Server-side proxy a la Edge Function postular-empleo del CRM -- mismo
 * patrón que /api/lead: el navegador nunca llama a Supabase directo, este
 * route reenvía server-to-server (sin problema de CORS/preview URL). */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || Array.isArray(body)) {
    return NextResponse.json({ ok: false, error: "body_invalido" }, { status: 400 });
  }

  const texto = (campo: string, maximo: number) =>
    typeof body[campo] === "string" ? (body[campo] as string).trim().slice(0, maximo) : "";
  const modalidad = texto("modalidad", 20);
  const datos = {
    nombre: texto("nombre", 160),
    telefono: texto("telefono", 40),
    email: texto("email", 160) || undefined,
    modalidad,
    rol_interes: texto("rol_interes", 160) || undefined,
    mensaje: texto("mensaje", 2000) || undefined,
    cv_base64: typeof body.cv_base64 === "string" ? body.cv_base64 : undefined,
    cv_mime: typeof body.cv_mime === "string" ? body.cv_mime : undefined,
  };
  if (!datos.nombre || !datos.telefono || (modalidad !== "presencial" && modalidad !== "freelance")) {
    return NextResponse.json({ ok: false, error: "datos_invalidos" }, { status: 400 });
  }

  const url = process.env.POSTULAR_EMPLEO_URL;
  const apiKey = process.env.WEB_CHAT_API_KEY;
  if (!url || !apiKey) {
    return NextResponse.json({ ok: false, error: "no_configurado" }, { status: 503 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...datos, p_secret: apiKey, client_key: clientKey(request) }),
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
