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
      { id: "guias", label: "Guías y tours", href: "/catalogo/guias-tours", visible: true },
      { id: "empleo", label: "Trabaje con nosotros", href: "/trabaja-con-nosotros", visible: true },
      { id: "ia-negocio", label: "IA para su negocio", href: "/ia-para-tu-negocio", visible: true },
    ],
    quoteLabel: "Cotizar",
    quoteHref: "/cotizar",
    whatsappLabel: "WhatsApp",
  },
  home: {
    hero: {
      eyebrow: "Agencia de viajes",
      title: "Su próximo viaje,",
      accent: "a su medida.",
      description: "Cotice en línea o escríbanos por WhatsApp, y un asesor le prepara la propuesta.",
      primaryLabel: "Cotizar mi viaje",
      primaryHref: "/cotizar",
      secondaryLabel: "Hablar con un asesor",
      secondaryHref: "whatsapp",
      image: "",
      badgeTopLabel: "Servicios",
      badgeTopValue: "Hospedaje, boletería, full days",
      badgeBottomLabel: "Salidas",
      badgeBottomValue: "Desde Venezuela",
    },
    services: {
      eyebrow: "Todo para su viaje",
      title: "Elija cómo quiere viajar.",
      description: "Vea opciones listas o cuéntenos su idea y la armamos con usted.",
      ctaLabel: "Cotizar mi viaje",
      ctaHref: "/cotizar",
      cards: [
        { label: "Escapadas", title: "Un día puede cambiar su semana.", description: "Full days y experiencias para salir de la rutina.", href: "/catalogo/paquetes", image: "/images/editorial/escapada-caribe.png" },
        { label: "Hospedajes", title: "Descanse donde quiere estar.", description: "Hoteles, posadas y opciones seleccionadas para cada plan.", href: "/catalogo/hoteles", image: "" },
        { label: "Boletería", title: "Del aeropuerto a su destino.", description: "Rutas nacionales e internacionales.", href: "/cotizar?servicios=vuelo", image: "/images/editorial/vuelo-a-tu-medida.png" },
        { label: "Guías y tours", title: "Conozca más que un destino.", description: "Recorridos acompañados para ver cada lugar con más contexto.", href: "/catalogo/guias-tours", image: "/images/editorial/tour-tropical.png" },
      ],
    },
    trust: {
      headline: "Un equipo de asesores en Valencia, Venezuela.",
      stats: [
        { title: "Asesores", detail: "reales" },
        { title: "Promos", detail: "vigentes" },
        { title: "Cotizador", detail: "en línea" },
      ],
    },
    promotions: { eyebrow: "Promociones vigentes", title: "Escápese con una promoción." },
    hotSales: { eyebrow: "Ofertas del momento", title: "Hot Sales de Lotus 360" },
    corporate: {
      eyebrow: "Corporativo",
      title: "Viajes y eventos para su equipo.",
      description: "Organizamos eventos, fiestas temáticas, paquetes vacacionales y actividades de integración institucional.",
      primaryLabel: "Planificar mi evento",
      primaryHref: "whatsapp",
      secondaryLabel: "Escribir por correo",
      secondaryHref: "email",
      image: "/images/editorial/experiencia-corporativa.png",
      imageTitle: "Un plan pensado para su equipo.",
      imageDescription: "Se diseña según sus objetivos.",
    },
  },
  catalog: {
    eyebrow: "Catálogo Destino y Eventos Lotus 360",
    descriptions: {
      promociones: "Ofertas vigentes para aprovechar cuando encuentre el plan indicado.",
      hoteles: "Hospedajes para descansar, celebrar o descubrir un destino a su manera.",
      paquetes: "Experiencias organizadas para que disfrute más y coordine menos.",
      "guias-tours": "Recorridos y actividades para conocer cada lugar con más contexto.",
    },
  },
  footer: {
    eyebrow: "Atención por WhatsApp",
    headline: "Empiece con una conversación.",
    ctaLabel: "Hablar con un asesor",
    description: "Agencia de viajes en Valencia, Venezuela: hospedaje, boletería y full days.",
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
