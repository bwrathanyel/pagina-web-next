import { fotosDe } from "@/lib/supabase/fotos";
import { REDES } from "@/lib/social";
import type { Producto } from "@/types/supabase";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://destinoyeventoslotus360.com";

export function jsonLdScript(data: object) {
  return { __html: JSON.stringify(data) };
}

export function buildTravelAgencyJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    name: "Destino y Eventos Lotus 360",
    description:
      "Agencia de viajes especializada en hospedaje, boletería aérea, full days y eventos corporativos en Venezuela.",
    url: `${SITE_URL}/`,
    logo: `${SITE_URL}/logo-lotus360.png`,
    image: `${SITE_URL}/logo-lotus360.png`,
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
