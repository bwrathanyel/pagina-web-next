import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

/** Recibe los eventos del embudo del navegador (sendBeacon) y los guarda en
 * `web_eventos`. La RLS de la tabla ya acota qué tipos entran y los largos;
 * acá sólo se recorta y se descarta lo obviamente inválido. Siempre 204:
 * es analítica, no debe generar ruido ni reintentos en el cliente. */

const TIPOS = new Set([
  "pageview", "ver_producto", "abrir_cotizador",
  "cotizacion_generada", "click_whatsapp", "abrir_pago", "pago_declarado",
]);

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const tipo = typeof body?.tipo === "string" ? body.tipo : "";
  if (!body || !TIPOS.has(tipo)) {
    return new NextResponse(null, { status: 204 });
  }

  const texto = (v: unknown, max: number) =>
    typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;

  const fila = {
    tipo,
    ruta: texto(body.ruta, 300),
    producto_slug: texto(body.producto_slug, 200),
    destino: texto(body.destino, 200),
    procedencia: texto(request.headers.get("referer"), 120),
    session_id: texto(body.session_id, 64),
    meta: body.meta && typeof body.meta === "object" && !Array.isArray(body.meta) ? body.meta : null,
  };

  try {
    await supabaseServer().from("web_eventos").insert(fila);
  } catch {
    // fire-and-forget
  }
  return new NextResponse(null, { status: 204 });
}
