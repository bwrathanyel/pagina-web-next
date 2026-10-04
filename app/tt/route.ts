// Link corto para la bio de TikTok: abre el WhatsApp de la empresa (cuenta
// Zernio, atendida por el bot de ventas) sin mostrar el número, que se ve largo
// para venezolanos. A diferencia de /tiktok/whatsapp (rota a un asesor y crea
// lead), acá no hay asesor ni cookie: es un redirect fijo al número de la
// empresa. El prefill identifica el origen para el cerebro y el asesor.
const NUMERO_EMPRESA_WA = "13467713647";
const PREFILL = "Hola, vengo del TikTok de Lotus360";

export function GET(): Response {
  return new Response(null, {
    status: 302,
    headers: {
      Location: `https://wa.me/${NUMERO_EMPRESA_WA}?text=${encodeURIComponent(PREFILL)}`,
      "Cache-Control": "public, max-age=300",
    },
  });
}
