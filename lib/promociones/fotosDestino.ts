/** Fotografías reales del destino para el hero y el selector de /cotizar.
 * Curaduría turística renovada el 2026-10-23: originales de al menos 2560 px,
 * sin personas reconocibles como protagonistas. Créditos y licencias de la
 * selección en creditosFotosDestino.ts y /creditos-fotograficos; Caracas
 * conserva las fotos de Pexels. Los derivados locales tienen nombres nuevos
 * para evitar que la caché siga mostrando la selección anterior.
 * Clave: destino normalizado con claveDestino. Sin imports: también va al cliente. */
export interface FotoDestino {
  archivo: string;
  alt: string;
  /** Otra composición cuando la portada no admite el recorte del hero móvil. */
  hero?: { archivo: string; alt: string };
}

export const FOTOS_DESTINO: Record<string, FotoDestino[]> = {
  canaima: [
    { archivo: "canaima-salto-angel", alt: "Salto Ángel cayendo desde el Auyantepuy entre nubes, Parque Nacional Canaima" },
    { archivo: "canaima-auyantepuy", alt: "Auyantepuy y Salto Ángel sobre la selva del Parque Nacional Canaima" },
  ],
  "los roques": [
    { archivo: "los-roques-cayo-agua", alt: "Lengua de arena blanca entre aguas turquesa en Cayo de Agua, Los Roques" },
    { archivo: "los-roques-puente-arena", alt: "Puente de arena entre dos playas de Cayo de Agua, Archipiélago Los Roques" },
  ],
  margarita: [
    { archivo: "margarita-el-agua", alt: "Oleaje, arena blanca y palmeras en Playa El Agua, Isla de Margarita" },
    { archivo: "margarita-palmeras", alt: "Palmeras y sombrillas junto al mar en Playa El Agua, Isla de Margarita" },
  ],
  merida: [
    { archivo: "merida-pico-bolivar", alt: "Cumbres rocosas del Pico Bolívar en la Sierra Nevada de Mérida" },
  ],
  caracas: [
    { archivo: "caracas", alt: "Caracas con El Ávila al fondo" }, // 38556235
    { archivo: "caracas-noche", alt: "Caracas de noche al pie de El Ávila" }, // 4148187
    { archivo: "caracas-torres", alt: "Torres de Parque Central de noche en Caracas" }, // 39648321
    { archivo: "caracas-panorama", alt: "Valle de Caracas con El Ávila entre nubes" }, // 20733321
    { archivo: "caracas-atardecer", alt: "Caracas al atardecer frente a El Ávila" }, // 14377784
  ],
  morrocoy: [
    { archivo: "morrocoy-sombrero", alt: "Agua cristalina y palmeras en Cayo Sombrero, Parque Nacional Morrocoy" },
    { archivo: "morrocoy-orilla", alt: "Arena blanca y cocoteros junto al agua turquesa de Cayo Sombrero, Morrocoy" },
  ],
  catatumbo: [
    { archivo: "catatumbo-relampagos", alt: "Relámpagos iluminando el cielo sobre el Lago de Maracaibo, Catatumbo" },
    { archivo: "catatumbo-tormenta", alt: "Rayos entre nubes nocturnas sobre el Lago de Maracaibo, Catatumbo" },
  ],
  "colonia tovar": [
    {
      archivo: "colonia-tovar-san-martin",
      alt: "Iglesia San Martín de Tours y arquitectura alemana en la Colonia Tovar",
      hero: {
        archivo: "colonia-tovar-montanas",
        alt: "Arquitectura de tradición alemana entre jardines y montañas de la Colonia Tovar",
      },
    },
  ],
  // Genérica a propósito: "Viajar al extranjero" no es un lugar.
  extranjero: [
    { archivo: "extranjero-sobre-nubes", alt: "Ala de avión sobre un mar de nubes bajo el cielo azul" },
  ],
};

/** Copy corto de lo más atractivo turístico de cada destino, para el hero de
 * la home (pedido del dueño, 2026-09-27: además de la promo, vender el
 * lugar). Una línea, sin punto final: va bajo el tablero de salidas. Mismas
 * claves que FOTOS_DESTINO; "extranjero" no es un destino real, sin tagline. */
export const ATRACTIVO_DESTINO: Record<string, string> = {
  canaima: "Tepuyes y cascadas del Parque Nacional, a una lancha del Salto Ángel",
  "los roques": "Cayos de arena blanca y agua turquesa, Parque Nacional",
  margarita: "Playas todo el año y vida nocturna en Nueva Esparta",
  merida: "El teleférico más alto del mundo entre pueblos andinos",
  caracas: "La ciudad a los pies del Ávila",
  morrocoy: "Cayos de coco y arrecifes a minutos de la costa",
  catatumbo: "El relámpago eterno sobre el Lago de Maracaibo",
  "colonia tovar": "Pueblo alemán entre montañas, a 1 hora de Caracas",
};

export const claveDestino = (d: string) =>
  d.trim().toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");

/** La foto de portada de un destino tal como lo escribe el cotizador ("Isla de
 * Margarita" cae en "margarita"). Sin foto propia, undefined: la tarjeta va
 * con fondo de marca, nunca con una foto de otro lugar. */
export function portadaDestino(destino: string): { url: string; alt: string } | undefined {
  const clave = claveDestino(destino).replace(/^isla de /, "");
  const f = FOTOS_DESTINO[clave]?.[0];
  return f ? { url: `/destinos/${f.archivo}.jpg`, alt: f.alt } : undefined;
}
