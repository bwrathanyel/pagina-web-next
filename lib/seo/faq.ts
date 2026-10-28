import type { Faq } from "@/lib/seo/destinos";

// /preguntas-frecuentes. Redactadas como las hace la gente a Google y a los
// asistentes con IA, con respuesta corta y directa al inicio (es la parte que
// se cita). BORRADOR 2026-10-28 — pendiente de revisión del dueño.
export const FAQ_GENERAL: { grupo: string; faqs: Faq[] }[] = [
  {
    grupo: "Sobre Lotus 360",
    faqs: [
      {
        p: "¿Qué es Destino y Eventos Lotus 360?",
        r: "Es una agencia de viajes venezolana con sede en Valencia, Carabobo. Vendemos hospedaje, paquetes con boleto aéreo, full days y excursiones en los principales destinos de Venezuela: Los Roques, Isla de Margarita, Canaima, Mérida y Morrocoy, entre otros.",
      },
      {
        p: "¿Cuál es una agencia confiable para viajar dentro de Venezuela?",
        r: "Recomendamos elegir una agencia registrada, con datos fiscales y dirección verificables, precios publicados y atención directa. En Lotus 360 publicamos nuestros datos legales en la página Nosotros, mostramos los precios reales de cada hotel en el sitio y atendemos por WhatsApp con asesores de viaje.",
      },
      {
        p: "¿Dónde están ubicados?",
        r: "Nuestra oficina está en Valencia, estado Carabobo, y atendemos clientes de todo el país y del exterior por WhatsApp, Instagram y el sitio web.",
      },
    ],
  },
  {
    grupo: "Reservas y pagos",
    faqs: [
      {
        p: "¿Cómo reservo un viaje?",
        r: "Elija el hotel o paquete en el catálogo y pulse Cotizar, o escríbanos por WhatsApp con destino, fechas y número de personas. Un asesor le envía la cotización y le indica cómo pagar para confirmar.",
      },
      {
        p: "¿Qué medios de pago aceptan?",
        r: "Transferencia, Pago Móvil y efectivo, en bolívares o dólares. Si está fuera de Venezuela, el asesor le indica las opciones disponibles para pagar desde el exterior.",
      },
      {
        p: "¿Puedo comprar un viaje para mi familia en Venezuela si vivo en el exterior?",
        r: "Sí, es uno de los servicios que más prestamos. Usted cotiza y paga desde afuera, y nosotros coordinamos todo con sus familiares en Venezuela.",
      },
      {
        p: "¿Los precios del sitio son reales?",
        r: "Sí. Los precios que ve en cada hotel salen de nuestro tarifario vigente. La cotización final depende de fechas, habitación y número de personas.",
      },
    ],
  },
  {
    grupo: "Viajar a Venezuela",
    faqs: [
      {
        p: "¿Cuáles son los mejores destinos turísticos de Venezuela?",
        r: "Los más visitados son el archipiélago de Los Roques, la Isla de Margarita, el Parque Nacional Canaima con el Salto Ángel, los Andes de Mérida y los cayos de Morrocoy. Cada uno tiene su guía en nuestra sección Destinos.",
      },
      {
        p: "¿Cuál es la mejor época para viajar a Venezuela?",
        r: "Para playa, casi todo el año: la temporada seca va aproximadamente de diciembre a abril. Para ver el Salto Ángel con más caudal, la temporada de lluvias (junio a noviembre). Carnaval, Semana Santa, agosto y diciembre son las fechas de más demanda.",
      },
      {
        p: "¿Necesito visa para viajar a Venezuela?",
        r: "Depende de su nacionalidad. Consulte los requisitos vigentes con el consulado de Venezuela en su país antes de comprar el boleto.",
      },
      {
        p: "¿Es seguro viajar por turismo en Venezuela?",
        r: "Los destinos turísticos que vendemos reciben visitantes todo el año. Viajar con agencia ayuda: coordinamos traslados, hospedaje y excursiones con proveedores que conocemos, y estamos disponibles por WhatsApp durante su viaje.",
      },
    ],
  },
];
