import { esCanalBio } from "@/lib/bio-whatsapp";
import { COOKIE_SESION_BIO } from "@/lib/bio-sesion";

// Enlace de bio de redes que lleva al cotizador IA (/<red>/cotizador).
// Hermano de lib/bio-whatsapp.ts y con el mismo criterio de deduplicación
// (cookie de 24h para que un doble-tap / refresh / reabrir no cree otro lead
// ni rote otro asesor), pero con dos diferencias:
//
//  - lo que se recuerda en la cookie es el session_id del asistente, no una
//    URL de WhatsApp, y la cookie NO es HttpOnly a propósito: el navegador
//    tiene que poder leerla para adoptar esa sesión en su localStorage
//    (ver components/layout/ContactoFab.tsx). No es un secreto -- el
//    session_id del chat ya vive en el localStorage de cualquier visitante.
//  - la cookie es una sola para las tres redes (Path=/). Si la misma persona
//    toca el enlace de TikTok y después el de Instagram dentro de las 24h,
//    sigue siendo la misma persona en el mismo navegador: reusar su lead es
//    lo correcto, crear uno nuevo sería un duplicado.
//
// El lead ya nace en el clic (RPC crear_lead_bio_cotizador), con la sesión
// sembrada del lado del servidor: cuando el visitante escribe, el chat
// continúa sobre ese lead en vez de crear otro.

const COOKIE_MAX_AGE = 60 * 60 * 24; // 24h, mismo criterio que lib/bio-whatsapp.ts

// La home, con la señal para que ContactoFab abra el chat solo. Se limpia del
// URL con replaceState apenas abre.
const DESTINO = "/?ia=1";

function leerCookie(request: Request, nombre: string): string | null {
  const raw = request.headers.get("cookie") ?? "";
  for (const parte of raw.split(";")) {
    const i = parte.indexOf("=");
    if (i === -1) continue;
    if (parte.slice(0, i).trim() === nombre) {
      const valor = parte.slice(i + 1).trim();
      return /^[0-9a-f-]{36}$/i.test(valor) ? valor : null;
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

export async function resolverBioCotizador(
  request: Request,
  canal: string,
): Promise<Response> {
  // Cualquier salida que no sea "sesión nueva sembrada" manda a la home sin
  // abrir el chat: mejor que aterrice en la web que dejarlo en una pantalla
  // de error. El botón flotante de Lotus IA sigue estando ahí.
  if (!esCanalBio(canal)) return redirect("/");

  const cacheado = leerCookie(request, COOKIE_SESION_BIO);
  if (cacheado) return redirect(DESTINO);

  const url = process.env.BIO_COTIZADOR_CLICK_URL;
  const key = process.env.CONTACTO_DIRECTO_API_KEY;
  if (!url || !key) return redirect("/");

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

  // Descarte de crawler (o fallo): no se creó lead ni sesión, así que no hay
  // nada que recordar -- sin cookie, para que el próximo visitante real sí
  // rote asesor.
  if (data?.ok !== true || typeof data.session_id !== "string") {
    return redirect("/");
  }

  const cookie = `${COOKIE_SESION_BIO}=${data.session_id}; ` +
    `Max-Age=${COOKIE_MAX_AGE}; Path=/; Secure; SameSite=Lax`;
  return redirect(DESTINO, cookie);
}
