import { fotosDeAncho } from "@/lib/supabase/fotos";
import { REDES } from "@/lib/social";
import type { Producto } from "@/types/supabase";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://destinoyeventoslotus360.com";

const LINE_SEPARATOR = String.fromCharCode(8232);
const PARAGRAPH_SEPARATOR = String.fromCharCode(8233);

export function jsonLdScript(data: object) {
  // JSON.stringify no escapa "<" -- un nombre/descripcion de producto con
  // "</script><script>..." cerraria el tag JSON-LD e inyectaria script real
  // en la pagina (los valores vienen de la tabla productos, editable por
  // admin y por el pipeline de tarifario). LINE_SEPARATOR/PARAGRAPH_SEPARATOR
  // son JSON valido pero rompen el parseo como statement de JS en algunos
  // motores -- se usan por charCode, no como literal, para no depender de
  // que el editor/toolchain preserve el caracter Unicode crudo intacto.
  const json = JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .split(LINE_SEPARATOR).join("\\u2028")
    .split(PARAGRAPH_SEPARATOR).join("\\u2029");
  return { __html: json };
}

// IDs estables para enlazar los nodos del @graph entre sí (la Organización es
// el publisher del WebSite). Google usa estas entidades para el panel de marca.
const ORG_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;

// Variantes con las que la gente busca el negocio — ayuda a que Google conecte
// todas estas consultas con el sitio ("buscar nuestro nombre o similares").
const ALTERNATE_NAMES = [
  "Lotus 360",
  "Lotus360",
  "Destinos y Eventos Lotus 360",
  "Destino y Eventos Lotus360",
];

export function buildTravelAgencyJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TravelAgency",
        "@id": ORG_ID,
        name: "Destino y Eventos Lotus 360",
        alternateName: ALTERNATE_NAMES,
        description:
          "Agencia de viajes en Venezuela especializada en hospedaje, boletería aérea nacional, paquetes todo incluido y full days en Los Roques, Margarita, Canaima, Mérida y Morrocoy. Atendemos también a venezolanos en el exterior que compran viajes para sus familiares.",
        url: `${SITE_URL}/`,
        logo: `${SITE_URL}/logo-lotus360-transparent.png`,
        image: `${SITE_URL}/logo-lotus360-transparent.png`,
        telephone: "+58-424-4634041",
        email: REDES.email,
        address: {
          "@type": "PostalAddress",
          streetAddress: "Valencia",
          addressLocality: "Valencia",
          addressRegion: "Carabobo",
          addressCountry: "VE",
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: 10.182,
          longitude: -68.0034,
        },
        areaServed: { "@type": "Country", name: "Venezuela" },
        // Destinos/servicios sobre los que el negocio tiene oferta real — le da
        // a Google señales de entidad para consultas long-tail tipo "posadas en
        // Los Roques" o "full day Morrocoy" sin depender de autoridad de dominio.
        knowsAbout: [
          "Los Roques",
          "Isla de Margarita",
          "Canaima y Salto Ángel",
          "Mérida",
          "Morrocoy y Chichiriviche",
          "Posadas y hoteles en Venezuela",
          "Paquetes turísticos todo incluido",
          "Boletos aéreos nacionales en Venezuela",
          "Full days y tours en Venezuela",
        ],
        openingHoursSpecification: [
          {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            opens: "08:30",
            closes: "19:00",
          },
          {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: "Sunday",
            opens: "10:00",
            closes: "15:00",
          },
        ],
        priceRange: "$$",
        currenciesAccepted: "VES, USD",
        paymentAccepted: "Transferencia, Efectivo, Pago Móvil",
        sameAs: [REDES.facebook, REDES.instagram, REDES.tiktok],
      },
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        url: `${SITE_URL}/`,
        name: "Destino y Eventos Lotus 360",
        alternateName: ALTERNATE_NAMES,
        inLanguage: "es-VE",
        publisher: { "@id": ORG_ID },
      },
    ],
  };
}

// Migas de pan para el SERP (Inicio › Categoría › Producto). Google las puede
// mostrar como ruta bajo el título del resultado, y refuerza la jerarquía del
// sitio (favorece los sitelinks). `url` acepta ruta relativa o absoluta.
export function buildBreadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${SITE_URL}${item.url}`,
    })),
  };
}

export function buildProductJsonLd(producto: Producto) {
  const tarifa = producto.tarifas.find((t) => t.vigente);
  const fotos = fotosDeAncho(producto.producto_fotos, 1280);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: producto.nombre,
    description:
      producto.descripcion ??
      `${producto.nombre}${producto.destino ? ` en ${producto.destino}` : ""}.`,
    image: fotos.length > 0 ? fotos : undefined,
    url: `${SITE_URL}/producto/${producto.id}`,
    brand: { "@id": ORG_ID },
    offers: tarifa
      ? {
          "@type": "Offer",
          priceCurrency: "USD",
          price: tarifa.precio_desde_usd ?? undefined,
          availability: "https://schema.org/InStock",
          url: `${SITE_URL}/producto/${producto.id}`,
          seller: { "@id": ORG_ID },
        }
      : undefined,
  };
}

// Listado de productos de una página de catálogo. Ayuda a que Google entienda
// la página como una colección navegable (y descubra los /producto/[id] aunque
// el grid se renderice con componentes cliente).
export function buildItemListJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: item.url.startsWith("http") ? item.url : `${SITE_URL}${item.url}`,
    })),
  };
}
