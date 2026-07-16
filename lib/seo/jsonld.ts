import { fotosDe } from "@/lib/supabase/fotos";
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

export function buildTravelAgencyJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    name: "Destino y Eventos Lotus 360",
    description:
      "Agencia de viajes especializada en hospedaje, boletería aérea, full days y eventos corporativos en Venezuela.",
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
  };
}

export function buildProductJsonLd(producto: Producto) {
  const tarifa = producto.tarifas.find((t) => t.vigente);
  const fotos = fotosDe(producto.producto_fotos);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: producto.nombre,
    description:
      producto.descripcion ??
      `${producto.nombre}${producto.destino ? ` en ${producto.destino}` : ""}.`,
    image: fotos.length > 0 ? fotos : undefined,
    url: `${SITE_URL}/producto/${producto.id}`,
    offers: tarifa
      ? {
          "@type": "Offer",
          priceCurrency: "USD",
          price: tarifa.precio_desde_usd ?? undefined,
          availability: "https://schema.org/InStock",
          url: `${SITE_URL}/producto/${producto.id}`,
        }
      : undefined,
  };
}
