import { REDES } from "@/lib/social";
import { whatsappHref } from "@/lib/whatsapp";

// Link fijo de WhatsApp en bio de redes (/wa/<canal>): a diferencia de
// /whatsapp/[codigo] y /ir/[token] (contacto directo por-conversación, con
// fila pendiente y TTL 48h), acá no hay identificador previo que resolver —
// cada visita real rota un asesor y crea un lead en el momento, vía la Edge
// Function bio-whatsapp-click (server-side, con secreto compartido).
//
// Para que un doble-tap / refresh / reabrir el link no cree un lead nuevo y
// rote otro asesor cada vez, la primera visita real deja una cookie de 24h
// con la URL de WhatsApp ya resuelta (mismo asesor). Mientras dure, se
// redirige directo desde la cookie sin tocar la Edge Function ni la base.

const CANALES = ["instagram", "facebook", "tiktok"] as const;
export type CanalBio = (typeof CANALES)[number];

export function esCanalBio(v: string): v is CanalBio {
  return (CANALES as readonly string[]).includes(v);
}

// Ruta pública por canal (/ig/whatsapp, /fb/whatsapp, /tiktok/whatsapp) --
// más legible en una bio que /wa/<canal>. El Path de la cookie debe calzar
// exacto con la ruta real o el navegador nunca la manda de vuelta.
const RUTA_BIO: Record<CanalBio, string> = {
  instagram: "/ig/whatsapp",
  facebook: "/fb/whatsapp",
  tiktok: "/tiktok/whatsapp",
};

const COOKIE_MAX_AGE = 60 * 60 * 24; // 24h, mismo criterio de "replay" que reclamar_contacto_directo

function nombreCookie(canal: CanalBio): string {
  return `wa_bio_${canal}`;
}

function leerCookie(request: Request, nombre: string): string | null {
  const raw = request.headers.get("cookie") ?? "";
  for (const parte of raw.split(";")) {
    const i = parte.indexOf("=");
    if (i === -1) continue;
    if (parte.slice(0, i).trim() === nombre) {
      try {
        return decodeURIComponent(parte.slice(i + 1).trim());
      } catch {
        return null;
      }
    }
  }
  return null;
}

function redirect(location: string, setCookie?: string): Response {
  const headers: Record<string, string> = {
    Location: location,
    "Cache-Control": "no-store",
  };
  if (setCookie) headers["Set-Cookie"] = setCookie;
  return new Response(null, { status: 302, headers });
}

function paginaHumana(): Response {
  const wa = whatsappHref("Hola, quiero que me conecten con un asesor 🙂");
  const html =
    `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Destino y Eventos Lotus 360</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0d1620;color:#f5f7fa;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}.c{max-width:520px;margin:24px;padding:32px;border:1px solid #26394a;border-radius:22px;background:#142330;box-shadow:0 24px 70px #0008}h1{font-size:22px;margin:0 0 12px;color:#ffad42}p{line-height:1.6;margin:0 0 20px}a.btn{display:inline-block;background:#25d366;color:#04210f;font-weight:700;text-decoration:none;padding:12px 20px;border-radius:12px;margin-right:10px}a.ig{color:#ffad42}</style><div class="c"><h1>No pudimos abrir este enlace</h1><p>Escríbenos por acá y te atendemos enseguida.</p><p><a class="btn" href="${wa}">Escribir por WhatsApp</a><a class="ig" href="${REDES.instagram}">o por Instagram</a></p></div></html>`;
  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

// El modal que pedía nombre+destino antes de abrir WhatsApp se retiró el
// 12-sep (decisión del dueño): el botón de la bio volvió al clic directo, con
// el saludo que arma prefillContactoDirecto sin nombre ni destino. La Edge
// Function bio-whatsapp-click sigue aceptando esos dos campos opcionales por
// si alguna vez vuelve el formulario -- no hay que tocarla para esto.
export async function resolverBioWhatsapp(
  request: Request,
  canal: string,
): Promise<Response> {
  if (!esCanalBio(canal)) return paginaHumana();

  const cookieNombre = nombreCookie(canal);
  const cacheado = leerCookie(request, cookieNombre);
  if (cacheado) return redirect(cacheado);

  const url = process.env.BIO_WHATSAPP_CLICK_URL;
  const key = process.env.CONTACTO_DIRECTO_API_KEY;
  if (!url || !key) return paginaHumana();

  const h = request.headers;
  let data: Record<string, unknown> | null = null;
  try {
    const upstream = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-contacto-directo-key": key },
      body: JSON.stringify({
        canal,
        user_agent: h.get("user-agent") ?? "",
        purpose: h.get("purpose") ?? "",
        sec_purpose: h.get("sec-purpose") ?? "",
        x_purpose: h.get("x-purpose") ?? "",
        client_method: request.method,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    data = (await upstream.json().catch(() => null)) as Record<string, unknown> | null;
  } catch {
    data = null;
  }

  if (typeof data?.whatsapp_url !== "string") return paginaHumana();

  // Un descarte de crawler no crea lead ni asesor -- no hay nada que
  // recordar, así que no se pone cookie (el próximo visitante real sí debe
  // rotar).
  if (data.motivo === "crawler" || data.ok !== true) {
    return redirect(data.whatsapp_url);
  }

  const cookie = `${cookieNombre}=${encodeURIComponent(data.whatsapp_url)}; ` +
    `Max-Age=${COOKIE_MAX_AGE}; Path=${RUTA_BIO[canal]}; HttpOnly; Secure; SameSite=Lax`;
  return redirect(data.whatsapp_url, cookie);
}
