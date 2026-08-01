import { NextResponse } from "next/server";

/** Proxy hacia registrar-posada. Mismo patrón que /api/lead, pero apunta a otra
 * función a propósito: /api/lead entra por `ingest_lead_v2`, que asigna asesor
 * por rotación y le avisa por Telegram. Una posada que quiere contratar el
 * asistente no es un cliente de viaje y no debe caer en la rueda comercial. */
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
    destino: texto("destino", 220),
    consulta: texto("consulta", 3000),
  };
  if (!datos.nombre || !datos.telefono) {
    return NextResponse.json({ ok: false, error: "datos_invalidos" }, { status: 400 });
  }

  const url = process.env.REGISTRAR_POSADA_URL;
  if (!url) {
    return NextResponse.json({ ok: false, error: "no_configurado" }, { status: 503 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
      signal: AbortSignal.timeout(30_000),
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
