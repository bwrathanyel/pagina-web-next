import { NEGOCIO } from "@/lib/seo/negocio";

// Botón del WhatsApp post-viaje (plantilla resena_post_viaje_v2). El navegador
// interno de WhatsApp en Android no tiene la sesión de Google y el formulario
// de opinión pide login: ahí se manda a Chrome con un intent. Un 302 directo a
// intent:// lo rechazan varios webviews, por eso va una página con intento
// automático + botón (el toque del usuario sí lo dejan pasar).
export const dynamic = "force-dynamic";

const NOINDEX = { "X-Robots-Tag": "noindex, nofollow", "Cache-Control": "no-store" };

function esWebviewAndroid(ua: string): boolean {
  return /Android/i.test(ua) && (/\bwv\b/.test(ua) || /WhatsApp|FBAN|FBAV|Instagram/i.test(ua));
}

function urlIntent(destino: string): string {
  const u = new URL(destino);
  return `intent://${u.host}${u.pathname}${u.search}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(destino)};end`;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

function pagina(destino: string): string {
  const intent = urlIntent(destino);
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Su opinión — ${esc(NEGOCIO.nombre)}</title>
<style>
body{margin:0;font-family:system-ui,-apple-system,sans-serif;background:#fff;color:#1a1a1a;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;text-align:center}
main{max-width:360px}
h1{font-size:1.25rem;margin:0 0 8px}
p{margin:0 0 20px;color:#555;line-height:1.4}
a.b{display:block;padding:14px 18px;border-radius:10px;background:#1a73e8;color:#fff;text-decoration:none;font-weight:600;margin-bottom:12px}
a.s{color:#1a73e8;font-size:.9rem}
</style></head>
<body><main>
<h1>Gracias por viajar con nosotros</h1>
<p>Para dejar su opinión en Google, ábrala en Chrome, donde ya tiene su cuenta iniciada.</p>
<a class="b" href="${esc(intent)}">Abrir en Chrome</a>
<a class="s" href="${esc(destino)}">Continuar aquí</a>
</main>
<script>location.href=${JSON.stringify(intent)}</script>
</body></html>`;
}

export async function GET(request: Request): Promise<Response> {
  const destino = NEGOCIO.googleOpiniones;
  if (!destino) return Response.redirect(new URL("/", request.url), 302);
  const ua = request.headers.get("user-agent") ?? "";
  if (!esWebviewAndroid(ua)) {
    return new Response(null, { status: 302, headers: { Location: destino, ...NOINDEX } });
  }
  return new Response(pagina(destino), {
    headers: { "Content-Type": "text/html; charset=utf-8", ...NOINDEX },
  });
}
