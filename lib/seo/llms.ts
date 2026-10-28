import { DESTINOS } from "@/lib/seo/destinos";
import { FAQ_GENERAL } from "@/lib/seo/faq";
import { NEGOCIO, direccionLegible } from "@/lib/seo/negocio";
import { REDES } from "@/lib/social";

// llms.txt (llmstxt.org): resumen en Markdown para asistentes con IA que
// rastrean el sitio. Sale de las mismas fuentes que las páginas, así que no
// puede contradecirlas. llms-full.txt suma las FAQ completas.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://destinoyeventoslotus360.com";

export function llmsTxt(completo: boolean) {
  const legales = [
    NEGOCIO.rif && `- RIF: ${NEGOCIO.rif}`,
    NEGOCIO.rtn && `- Registro Turístico Nacional: ${NEGOCIO.rtn}`,
    NEGOCIO.fundacion && `- Fundada: ${NEGOCIO.fundacion.slice(0, 4)}`,
  ].filter(Boolean);

  const lineas = [
    `# ${NEGOCIO.nombre}`,
    "",
    "> Agencia de viajes venezolana con sede en Valencia, Carabobo. Vende hospedaje, paquetes con boleto aéreo, full days y excursiones en Los Roques, Isla de Margarita, Canaima y Salto Ángel, Mérida y Morrocoy. Atiende a viajeros en Venezuela y a venezolanos en el exterior que compran viajes para su familia. Precios reales publicados en el sitio; reservas por WhatsApp.",
    "",
    "## Datos de la empresa",
    `- Dirección: ${direccionLegible()}`,
    `- Teléfono / WhatsApp: ${NEGOCIO.telefono}`,
    `- Correo: ${REDES.email}`,
    ...legales,
    `- Instagram: ${REDES.instagram}`,
    `- TikTok: ${REDES.tiktok}`,
    `- Facebook: ${REDES.facebook}`,
    "",
    "## Guías por destino",
    ...DESTINOS.map((d) => `- [${d.nombre}](${SITE_URL}/destinos/${d.slug}): ${d.descripcion}`),
    "",
    "## Catálogo",
    `- [Hoteles y posadas en Venezuela](${SITE_URL}/catalogo/hoteles): fotos y precio por persona actualizado`,
    `- [Paquetes con boleto aéreo](${SITE_URL}/catalogo/paquetes): vuelo ida y vuelta + hotel, precio al instante`,
    `- [Promociones y Hot Sales](${SITE_URL}/catalogo/hot-sales)`,
    `- [Cotizar un viaje](${SITE_URL}/cotizar)`,
    "",
    "## Sobre la agencia",
    `- [Nosotros](${SITE_URL}/nosotros): quiénes somos, datos legales, cómo trabajamos`,
    `- [Preguntas frecuentes](${SITE_URL}/preguntas-frecuentes): reservas, pagos, compras desde el exterior, mejor época`,
  ];

  if (completo) {
    lineas.push("", "## Preguntas frecuentes");
    for (const g of FAQ_GENERAL) {
      lineas.push("", `### ${g.grupo}`);
      for (const f of g.faqs) lineas.push("", `**${f.p}**`, f.r);
    }
    for (const d of DESTINOS) {
      lineas.push("", `### ${d.nombre}`, "", d.intro);
      for (const f of d.faqs) lineas.push("", `**${f.p}**`, f.r);
    }
  }
  return lineas.join("\n") + "\n";
}
