import { REDES } from "@/lib/social";
import { whatsappHref } from "@/lib/whatsapp";

// Link fijo de WhatsApp en bio de redes (/wa/<canal>): a diferencia de
// /whatsapp/[codigo] y /ir/[token] (contacto directo por-conversación, con
// fila pendiente y TTL 48h), acá no hay identificador previo que resolver —
// cada visita real (dentro de la ventana de 24h de abajo) rota un asesor y
// crea un lead en el momento, vía la Edge Function bio-whatsapp-click
// (server-side, con secreto compartido).
//
// v2 (reparto inteligente, 2026-09-28): una sola cookie `wa_bio`, Path=/, 180
// días, con {asesor,url,ts} -- antes eran 3 cookies por canal con Path
// scopeado a su propia ruta, lo que hacía que un cliente que volvía por OTRA
// red nunca se reconociera (el problema real que motivó este cambio). Con
// Path=/ la misma cookie se lee sin importar por cuál de los 4 links entre.
//   - <24h desde el último clic: redirige directo con la URL ya resuelta
//     (mismo asesor), sin tocar la Edge Function ni la base -- evita que un
//     doble-tap/refresh cree un lead nuevo y rote otro asesor.
//   - 24h-180 días: SÍ crea un lead nuevo (persona real, nueva conversación),
//     pero manda el asesor de la cookie como "preferido" -- si ese asesor
//     sigue activo y en turno en ese momento, el reparto (elegir_asesor_bio)
//     se lo vuelve a asignar a él en vez de rotar a otro.
//   - >180 días o sin cookie: en blanco, rota como cualquier visitante nuevo.

const CANALES = ["instagram", "facebook", "tiktok", "whatsapp"] as const;
export type CanalBio = (typeof CANALES)[number];

export function esCanalBio(v: string): v is CanalBio {
  return (CANALES as readonly string[]).includes(v);
}

const ORIGENES = ["post", "story", "reel", "live", "bio", "jefa"] as const;
type OrigenBio = (typeof ORIGENES)[number];

function origenDesdeQuery(request: Request, canal: CanalBio): OrigenBio {
  if (canal === "whatsapp") return "jefa"; // /asesor: desvío del WhatsApp de la jefa, no una bio
  const o = new URL(request.url).searchParams.get("o");
  return (ORIGENES as readonly string[]).includes(o ?? "") ? (o as OrigenBio) : "bio";
}

const COOKIE_NOMBRE = "wa_bio";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 180; // 180 días -- ventana de "cliente que vuelve"
const REPLAY_MS = 24 * 60 * 60 * 1000; // <24h desde el último clic = mismo click, no nuevo lead

type CookieBio = { asesor: string | null; url: string; ts: number };

function leerCookieBio(request: Request): CookieBio | null {
  const raw = request.headers.get("cookie") ?? "";
  for (const parte of raw.split(";")) {
    const i = parte.indexOf("=");
    if (i === -1) continue;
    if (parte.slice(0, i).trim() !== COOKIE_NOMBRE) continue;
    try {
      const data = JSON.parse(decodeURIComponent(parte.slice(i + 1).trim()));
      if (typeof data?.url === "string" && typeof data?.ts === "number") {
        return { asesor: typeof data.asesor === "string" ? data.asesor : null, url: data.url, ts: data.ts };
      }
    } catch {
      return null;
    }
    return null;
  }
  return null;
}

function setCookieBio(valor: CookieBio): string {
  const json = encodeURIComponent(JSON.stringify(valor));
  return `${COOKIE_NOMBRE}=${json}; Max-Age=${COOKIE_MAX_AGE}; Path=/; HttpOnly; Secure; SameSite=Lax`;
}

function redirect(location: string, setCookie?: string): Response {
  const headers: Record<string, string> = {
    Location: location,
    "Cache-Control": "no-store",
  };
  if (setCookie) headers["Set-Cookie"] = setCookie;
  return new Response(null, { status: 302, headers });
}

// El chat abre vacío, sin saludo prellenado: es como funcionaba y es lo que
// el dueño quiere. La Edge Function sigue armando la URL con ?text= (la usan
// otros caminos), así que el recorte se hace acá.
function sinTexto(url: string): string {
  const corte = url.indexOf("?");
  return corte === -1 ? url : url.slice(0, corte);
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

  const cookie = leerCookieBio(request);
  if (cookie && Date.now() - cookie.ts < REPLAY_MS) {
    return redirect(sinTexto(cookie.url));
  }

  const url = process.env.BIO_WHATSAPP_CLICK_URL;
  const key = process.env.CONTACTO_DIRECTO_API_KEY;
  if (!url || !key) return paginaHumana();

  const h = request.headers;
  const origen = origenDesdeQuery(request, canal);
  let data: Record<string, unknown> | null = null;
  try {
    const upstream = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-contacto-directo-key": key },
      body: JSON.stringify({
        canal,
        origen,
        asesor_previo: cookie?.asesor ?? null,
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
    return redirect(sinTexto(data.whatsapp_url));
  }

  const destino = sinTexto(data.whatsapp_url);
  const asesor = typeof data.asesor === "string" && data.asesor ? data.asesor : null;
  const setCookie = setCookieBio({ asesor, url: destino, ts: Date.now() });
  return redirect(destino, setCookie);
}
