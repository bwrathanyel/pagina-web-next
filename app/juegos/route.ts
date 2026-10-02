import { HTML } from "./html.generated";

/** /juegos: minijuegos + ruleta (versión web de la ruleta del stand). Responde
 * 200 directo con el HTML de public/juegos-app, sin redirecciones: el WebView
 * de TikTok/Instagram pierde la sesión del juego al seguirlas. El HTML y los
 * assets de public/juegos-app los genera ruleta-evento/web/build.mjs. */
export function GET() {
  return new Response(HTML, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
