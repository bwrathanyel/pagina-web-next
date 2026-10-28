import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://destinoyeventoslotus360.com";
const DOMINIO_PUBLICO = "destinoyeventoslotus360.com";

// Se indexa solo si la build se declara servida desde el dominio de marca.
// Antes esto miraba VERCEL_ENV/CONTEXT: variables del proveedor, que en
// Cloudflare no existen -- ES_PRODUCCION habria dado false y robots.txt habria
// devuelto "Disallow: /" para todo el sitio. SITE_URL es la misma fuente que ya
// alimenta canonical/og:url/sitemap/JSON-LD: si el canonical dice que somos el
// dominio de marca, robots.txt no puede decir lo contrario.
const ES_PRODUCCION =
  process.env.NEXT_PUBLIC_NOINDEX !== "1" && new URL(SITE_URL).hostname === DOMINIO_PUBLICO;

export default function robots(): MetadataRoute.Robots {
  if (!ES_PRODUCCION) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: "/api/" },
      // Bots de buscadores con IA (Gemini, ChatGPT, Perplexity, Claude, Apple).
      // Ya entraban por "*"; nombrarlos deja explícito que queremos que nos lean
      // para recomendarnos. Si dejan de aparecer, revisar Cloudflare → AI Crawl
      // Control: puede bloquearlos aunque robots.txt los permita.
      {
        userAgent: [
          "Googlebot",
          "Google-Extended",
          "GPTBot",
          "OAI-SearchBot",
          "ChatGPT-User",
          "PerplexityBot",
          "ClaudeBot",
          "Claude-SearchBot",
          "Applebot-Extended",
          "Bingbot",
        ],
        allow: "/",
        disallow: "/api/",
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
