// WhatsApp de la empresa (cuenta Zernio, atendida por el bot de ventas). Sin
// asesor ni cookie: redirect fijo al número de la empresa. El prefill
// identifica el origen para el cerebro y el asesor.
//
// Los navegadores internos de las redes no abren la app desde wa.me: TikTok cae
// a "Descargar WhatsApp" y Facebook/Instagram en iPhone se quedan en la página
// "Continuar al chat". Ahí se sirve una página con el deep link directo
// (whatsapp://send; el intent:// lo bloquea el webview de TikTok) y la salida
// manual "Abrir en el navegador", que es la que siempre funciona. Fuera de un
// webview: 302 a wa.me.
export const NUMERO_EMPRESA_WA = "13467713647";

export const WEBVIEW_TIKTOK = /musical_ly|bytedancewebview|tiktok|trill|ttwebview/i;
export const WEBVIEW_META = /FBAN|FBAV|FB_IAB|FBIOS|Instagram/i;

export const urlWaMe = (prefill: string) =>
  `https://wa.me/${NUMERO_EMPRESA_WA}?text=${encodeURIComponent(prefill)}`;
export const deepLinkWhatsapp = (prefill: string) =>
  `whatsapp://send?phone=${NUMERO_EMPRESA_WA}&text=${encodeURIComponent(prefill)}`;

const escAttr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

export function paginaAbrirWhatsapp(prefill: string, ayuda: string, intentarSolo = false): Response {
  const deep = escAttr(deepLinkWhatsapp(prefill));
  const auto = intentarSolo
    ? `<script>setTimeout(function(){location.href=${JSON.stringify(deepLinkWhatsapp(prefill))}},150)</script>`
    : "";
  const html =
    `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Escríbenos por WhatsApp</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0d1620;color:#f5f7fa;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}.c{max-width:520px;margin:24px;padding:32px;border:1px solid #26394a;border-radius:22px;background:#142330;box-shadow:0 24px 70px #0008;text-align:center}h1{font-size:22px;margin:0 0 12px;color:#ffad42}p{line-height:1.6;margin:0 0 20px}a.btn{display:block;background:#25d366;color:#04210f;font-weight:700;text-decoration:none;padding:14px 20px;border-radius:12px;font-size:18px}small{display:block;color:#cfdbe6;line-height:1.6;border-top:1px solid #26394a;padding-top:16px}</style><div class="c"><h1>Destino y Eventos Lotus 360</h1><p>Toca el botón para escribirnos por WhatsApp.</p><p><a class="btn" href="${deep}">Abrir WhatsApp</a></p><small>${ayuda}</small></div>${auto}</html>`;
  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export const redirectWaMe = (prefill: string): Response =>
  new Response(null, { status: 302, headers: { Location: urlWaMe(prefill), "Cache-Control": "no-store" } });

// Link que el bot pone en el DM de Instagram/Facebook (comentarios y chat).
const RED_ORIGEN: Record<string, string> = { ig: "Instagram", fb: "Facebook", tt: "TikTok" };
const MARCA = "Destino y Eventos Lotus 360";
// Sin código no hay conversación previa: los campos guían el primer mensaje
// para que el bot arranque con destino, fecha y personas.
export const PLANTILLA_VIAJE = "\n\n📍 Destino: \n📅 Fecha aproximada: \n👥 Personas: ";
// Con código el bot ya trae destino y datos del DM: repetir la plantilla vacía
// lo haría preguntar de nuevo. El "(ref …)" lo saca el webhook antes del cerebro.
export function prefillRedes(origen: string | null, codigo: string | null = null): string {
  const red = RED_ORIGEN[origen ?? ""];
  if (codigo && CODIGO_PUENTE.test(codigo)) {
    return `¡Hola! 😊 Vengo de escribirles por ${red ?? "redes"} a ${MARCA} y quiero seguir con mi viaje por aquí. (ref ${codigo})`;
  }
  return `¡Hola! 😊 Los vi en ${red ? `el ${red}` : "las redes"} de ${MARCA} y quiero planear un viaje.${PLANTILLA_VIAJE}`;
}
// Código de ia_puente_whatsapp (?c=): viaja en el prefill para que el bot de
// WhatsApp herede la conversación del DM. Mismo alfabeto que
// gen_codigo_contacto_directo; cualquier otra cosa se ignora.
const CODIGO_PUENTE = /^[2-9a-km-np-z]{8}$/;

export function whatsappDesdeRedes(ua: string, origen: string | null, codigo: string | null = null): Response {
  const prefill = prefillRedes(origen, codigo);
  if (!WEBVIEW_META.test(ua) && !WEBVIEW_TIKTOK.test(ua)) return redirectWaMe(prefill);
  return paginaAbrirWhatsapp(
    prefill,
    `¿No abre? Toca los tres puntos <b>(⋯)</b> arriba a la derecha, elige <b>Abrir en el navegador</b> (o <b>Abrir en Safari</b>) y toca de nuevo el botón. También puede agregar el número <b>+1 (346) 771-3647</b> y escribirnos.`,
    true,
  );
}
