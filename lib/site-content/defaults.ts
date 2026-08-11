import type { SiteContent } from "@/lib/site-content/types";

export const DEFAULT_SITE_CONTENT: SiteContent = {
  brand: {
    name: "Destino y Eventos Lotus 360",
  },
  theme: {
    applyCustom: false,
    sand: "#fbf3e7",
    card: "#fffdf8",
    ink: "#241f1a",
    inkSoft: "#6b5e50",
    coral: "#ff6b4a",
    gold: "#ffb648",
    dusk: "#12262b",
    dusk2: "#1c3238",
    seafoam: "#3e827d",
  },
  navigation: {
    items: [
      { id: "promociones", label: "Promociones", href: "/catalogo/promociones", visible: true },
      { id: "hot-sales", label: "Hot Sales", href: "/catalogo/hot-sales", visible: true },
      { id: "hoteles", label: "Hoteles", href: "/catalogo/hoteles", visible: true },
      { id: "paquetes", label: "Paquetes", href: "/catalogo/paquetes", visible: true },
      { id: "guias", label: "Guías / Tours", href: "/catalogo/guias-tours", visible: true },
      { id: "empleo", label: "Trabaja con nosotros", href: "/trabaja-con-nosotros", visible: true },
      { id: "ia-negocio", label: "IA para tu negocio", href: "/ia-para-tu-negocio", visible: true },
    ],
    quoteLabel: "Cotizar",
    quoteHref: "/cotizador-personalizado",
    whatsappLabel: "WhatsApp",
  },
  home: {
    hero: {
      eyebrow: "Agencia de viajes · Venezuela",
      title: "Viajes soñados",
      accent: "hechos realidad.",
      description: "Tu próxima historia empieza aquí. Descubre hospedajes, escapadas y experiencias con un asesor real acompañándote en cada paso.",
      primaryLabel: "Explorar promociones",
      primaryHref: "/catalogo/promociones",
      secondaryLabel: "Hablar con un asesor",
      secondaryHref: "whatsapp",
      image: "",
      badgeTopLabel: "Atención",
      badgeTopValue: "Asesores reales",
      badgeBottomLabel: "Desde Venezuela",
      badgeBottomValue: "Hacia el mundo",
    },
    services: {
      eyebrow: "Todo para tu viaje",
      title: "Elige cómo quieres volver a sentirte.",
      description: "Explora opciones listas para disfrutar o cuéntanos tu idea y la construimos contigo.",
      ctaLabel: "Diseñar mi viaje",
      ctaHref: "/cotizador-personalizado",
      cards: [
        { label: "Escapadas", title: "Un día puede cambiarte la semana.", description: "Full days y experiencias para salir de la rutina.", href: "/catalogo/paquetes", image: "/images/editorial/escapada-caribe.png" },
        { label: "Hospedajes", title: "Descansa donde realmente quieres estar.", description: "Hoteles, posadas y opciones seleccionadas para cada plan.", href: "/catalogo/hoteles", image: "" },
        { label: "Boletería", title: "Del aeropuerto a tu próxima historia.", description: "Rutas nacionales e internacionales pensadas contigo.", href: "/cotizar/boleteria", image: "/images/editorial/vuelo-a-tu-medida.png" },
        { label: "Guías y tours", title: "Descubre más que un destino.", description: "Experiencias acompañadas para mirar cada lugar de otra manera.", href: "/catalogo/guias-tours", image: "/images/editorial/tour-tropical.png" },
      ],
    },
    trust: {
      headline: "Viajar bien comienza con sentirte acompañado.",
      stats: [
        { title: "Asesoría", detail: "humana" },
        { title: "Atención", detail: "personalizada" },
        { title: "Destinos", detail: "sin fronteras" },
      ],
    },
    promotions: { eyebrow: "Oportunidades para escapar", title: "Tu próxima aventura puede empezar hoy." },
    hotSales: { eyebrow: "🔥 Ofertas imperdibles", title: "Las mejores promociones, en un solo lugar." },
    corporate: {
      eyebrow: "Viajes y eventos corporativos",
      title: "Grandes experiencias para grandes equipos.",
      description: "Organizamos eventos, fiestas temáticas, paquetes vacacionales y actividades de integración institucional con atención cercana de principio a fin.",
      primaryLabel: "Planificar una experiencia",
      primaryHref: "whatsapp",
      secondaryLabel: "Contacto corporativo",
      secondaryHref: "email",
      image: "/images/editorial/experiencia-corporativa.png",
      imageTitle: "Un plan que se siente propio.",
      imageDescription: "Diseñado alrededor de tu equipo y tus objetivos.",
    },
  },
  catalog: {
    eyebrow: "Catálogo Destino y Eventos Lotus 360",
    descriptions: {
      promociones: "Opciones destacadas para aprovechar cuando encuentres el plan indicado.",
      hoteles: "Hospedajes para descansar, celebrar o descubrir un destino a tu manera.",
      paquetes: "Experiencias organizadas para que disfrutes más y coordines menos.",
      "guias-tours": "Recorridos y actividades para conocer cada lugar con más contexto.",
    },
  },
  footer: {
    eyebrow: "Tu próximo viaje",
    headline: "Empieza con una buena conversación.",
    ctaLabel: "Hablar con un asesor",
    description: "Agencia de viajes en Valencia, Venezuela — hospedaje, boletería y full days.",
    copyright: "Destino y Eventos Lotus 360. Todos los derechos reservados.",
  },
};

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return Boolean(valor) && typeof valor === "object" && !Array.isArray(valor);
}

export function combinarContenido<T>(base: T, cambios: unknown): T {
  if (Array.isArray(base)) return (Array.isArray(cambios) ? cambios : base) as T;
  if (!esObjeto(base) || !esObjeto(cambios)) return (cambios ?? base) as T;
  const resultado: Record<string, unknown> = { ...base };
  for (const [clave, valor] of Object.entries(cambios)) {
    if (!(clave in resultado)) continue;
    resultado[clave] = combinarContenido(resultado[clave], valor);
  }
  return resultado as T;
}
