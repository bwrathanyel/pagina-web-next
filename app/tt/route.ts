import { paginaAbrirWhatsapp, redirectWaMe, WEBVIEW_TIKTOK } from "@/lib/whatsapp-empresa";

// Link corto para la bio de TikTok: abre el WhatsApp de la empresa sin mostrar
// el número, que se ve largo para venezolanos. A diferencia de /tiktok/whatsapp
// (rota a un asesor y crea lead), acá no hay asesor ni cookie. Ver
// lib/whatsapp-empresa.ts para el porqué de la página en el webview.
const PREFILL = "Hola, vengo del TikTok de Lotus360";

export function GET(request: Request): Response {
  const ua = request.headers.get("user-agent") ?? "";
  if (WEBVIEW_TIKTOK.test(ua)) {
    return paginaAbrirWhatsapp(
      PREFILL,
      "¿No abre? Toca los tres puntos <b>(⋯)</b> arriba a la derecha, elige <b>Abrir en el navegador</b> y toca de nuevo el botón.",
    );
  }
  return redirectWaMe(PREFILL);
}
