// Link corto para la bio de TikTok: abre el WhatsApp de la empresa (cuenta
// Zernio, atendida por el bot de ventas) sin mostrar el número, que se ve largo
// para venezolanos. A diferencia de /tiktok/whatsapp (rota a un asesor y crea
// lead), acá no hay asesor ni cookie: es un redirect fijo al número de la
// empresa. El prefill identifica el origen para el cerebro y el asesor.
//
// El navegador interno de TikTok no logra lanzar la app desde la pantalla de
// wa.me ("Abrir aplicación" cae a "Descargar WhatsApp"); Chrome sí. Por eso, si
// el UA es el de TikTok, se sirve una página con el deep link directo
// (whatsapp://send; el intent:// lo bloquea el webview: "La acción no se pudo
// completar") y la salida manual "Abrir en el navegador", que es la que siempre
// funciona. Fuera de TikTok: 302 a wa.me.
const NUMERO_EMPRESA_WA = "13467713647";
const PREFILL = "Hola, vengo del TikTok de Lotus360";

const TEXTO = encodeURIComponent(PREFILL);
const WA_ME = `https://wa.me/${NUMERO_EMPRESA_WA}?text=${TEXTO}`;
const DEEP_LINK = `whatsapp://send?phone=${NUMERO_EMPRESA_WA}&amp;text=${TEXTO}`;

const WEBVIEW_TIKTOK = /musical_ly|bytedancewebview|tiktok|trill|ttwebview/i;

function paginaTikTok(): Response {
  const html =
    `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Escríbenos por WhatsApp</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0d1620;color:#f5f7fa;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}.c{max-width:520px;margin:24px;padding:32px;border:1px solid #26394a;border-radius:22px;background:#142330;box-shadow:0 24px 70px #0008;text-align:center}h1{font-size:22px;margin:0 0 12px;color:#ffad42}p{line-height:1.6;margin:0 0 20px}a.btn{display:block;background:#25d366;color:#04210f;font-weight:700;text-decoration:none;padding:14px 20px;border-radius:12px;font-size:18px}small{display:block;color:#cfdbe6;line-height:1.6;border-top:1px solid #26394a;padding-top:16px}</style><div class="c"><h1>Destino y Eventos Lotus 360</h1><p>Toca el botón para escribirnos por WhatsApp.</p><p><a class="btn" href="${DEEP_LINK}">Abrir WhatsApp</a></p><small>¿No abre? Toca los tres puntos <b>(⋯)</b> arriba a la derecha, elige <b>Abrir en el navegador</b> y toca de nuevo el botón.</small></div></html>`;
  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export function GET(request: Request): Response {
  const ua = request.headers.get("user-agent") ?? "";
  if (WEBVIEW_TIKTOK.test(ua)) return paginaTikTok();
  return new Response(null, {
    status: 302,
    headers: { Location: WA_ME, "Cache-Control": "no-store" },
  });
}
