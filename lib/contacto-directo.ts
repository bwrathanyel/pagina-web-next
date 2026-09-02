import { REDES } from "@/lib/social";
import { whatsappHref } from "@/lib/whatsapp";

// Redirección medida al WhatsApp de un asesor. El identificador opaco (codigo
// corto actual, o el uuid legacy de /ir/) identifica una fila pendiente; el
// asesor y el lead se crean recién acá, del lado de la Edge Function
// contacto-directo-click (server-side, con secreto compartido). El cliente
// solo ve nuestro dominio hasta el 302 final.
//
// El 302 lleva Cache-Control: no-store — sin eso un proxy podría cachear el
// redirect de un cliente y mandar a otro al mismo asesor (mismo criterio que
// atender-redirect).
//
// Compartido por app/whatsapp/[codigo]/route.ts (actual, link corto) y
// app/ir/[token]/route.ts (legacy, uuid -- links ya entregados con TTL 48h).

function redirect(location: string): Response {
  return new Response(null, {
    status: 302,
    headers: { Location: location, "Cache-Control": "no-store" },
  });
}

function paginaHumana(motivo: "expirado" | "invalido"): Response {
  const titulo = motivo === "expirado"
    ? "Este enlace ya venció"
    : "No pudimos abrir este enlace";
  const cuerpo = motivo === "expirado"
    ? "Pasó el tiempo que teníamos guardado para conectarte. Escríbenos y en un momento te pasamos con un asesor."
    : "El enlace no es válido o ya se usó. Escríbenos por acá y te atendemos enseguida.";
  const wa = whatsappHref("Hola, quiero que me conecten con un asesor 🙂");
  const html =
    `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Destino y Eventos Lotus 360</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0d1620;color:#f5f7fa;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}.c{max-width:520px;margin:24px;padding:32px;border:1px solid #26394a;border-radius:22px;background:#142330;box-shadow:0 24px 70px #0008}h1{font-size:22px;margin:0 0 12px;color:#ffad42}p{line-height:1.6;margin:0 0 20px}a.btn{display:inline-block;background:#25d366;color:#04210f;font-weight:700;text-decoration:none;padding:12px 20px;border-radius:12px;margin-right:10px}a.ig{color:#ffad42}</style><div class="c"><h1>${titulo}</h1><p>${cuerpo}</p><p><a class="btn" href="${wa}">Escribir por WhatsApp</a><a class="ig" href="${REDES.instagram}">o por Instagram</a></p></div></html>`;
  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export async function resolverContactoDirecto(
  request: Request,
  id: string,
): Promise<Response> {
  const url = process.env.CONTACTO_DIRECTO_CLICK_URL;
  const key = process.env.CONTACTO_DIRECTO_API_KEY;
  if (!url || !key) return paginaHumana("invalido");

  const h = request.headers;
  let data: Record<string, unknown> | null = null;
  try {
    const upstream = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-contacto-directo-key": key },
      body: JSON.stringify({
        token: id,
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

  if (typeof data?.whatsapp_url === "string" && (data.ok === true || data.motivo === "crawler")) {
    return redirect(data.whatsapp_url);
  }
  return paginaHumana(data?.motivo === "expirado" ? "expirado" : "invalido");
}
