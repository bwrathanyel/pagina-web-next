/** Fotos propias de cada DESTINO (el lugar, no el hotel). Las usan el hero de
 * la home y el selector de destino de /cotizar. Son de Pexels: licencia de uso
 * comercial sin atribución, y ninguna con personas reconocibles (regla del
 * dueño). Viven en `public/destinos/<archivo>-<ancho>.jpg` (ver `imageLoader`)
 * porque a pantalla completa piden 2560 px y el Worker de fotos no pasa de 2048.
 * El comentario de cada una es su id de Pexels, para rehacer los derivados;
 * las verticales se recortaron a 4:3 para no mandarle 2560x3840 al escritorio.
 *
 * Varias por destino (pedido del dueño, 2026-09-25): en cada vuelta de la
 * rotación del hero el destino entra con la siguiente. Canaima tiene una sola
 * porque Pexels no tiene otra del parque, y Los Roques tres por lo mismo: el
 * resto se le pide a marketing en 2500 px o más. Morrocoy, Catatumbo y Colonia
 * Tovar no tienen ninguna todavía. Coche, La Tortuga y Delta Amacuro tuvieron
 * una foto del bucket (commit 30351a6) y salieron: medían 1000-1300 px y se
 * veían blandas.
 * Clave: el destino normalizado con `claveDestino`. Sin imports a propósito:
 * lo carga un componente cliente. */
export const FOTOS_DESTINO: Record<string, { archivo: string; alt: string }[]> = {
  canaima: [
    { archivo: "canaima", alt: "Cascada y tepuy en el Parque Nacional Canaima" }, // 7360544
  ],
  "los roques": [
    { archivo: "los-roques", alt: "Aguas turquesa frente a un cayo de Los Roques" }, // 30587633
    { archivo: "los-roques-orilla", alt: "Orilla de arena blanca y agua turquesa en Los Roques" }, // 31871910
    { archivo: "los-roques-gran-roque", alt: "El Gran Roque visto desde el mar" }, // 16230240
  ],
  margarita: [
    { archivo: "margarita", alt: "Bahía de Pampatar, Isla de Margarita" }, // 26241556
    { archivo: "margarita-laguna", alt: "Laguna y montañas de la Isla de Margarita" }, // 32690921
    { archivo: "margarita-playa", alt: "Playa larga entre el mar y la laguna en Margarita" }, // 32699741
    { archivo: "margarita-pescadores", alt: "Peñeros en una bahía de Margarita" }, // 26241551
    { archivo: "margarita-costa", alt: "Playa de aguas tranquilas en Nueva Esparta" }, // 32699665
  ],
  merida: [
    { archivo: "merida", alt: "Valle entre montañas en Mérida" }, // 19199162
    { archivo: "merida-valle", alt: "Pueblos en el valle andino de Mérida" }, // 19199169
    { archivo: "merida-iglesia", alt: "Torre neogótica de una iglesia en Mérida" }, // 14055474
    { archivo: "merida-campanario", alt: "Campanario colonial en Mérida" }, // 14094180
  ],
  caracas: [
    { archivo: "caracas", alt: "Caracas con El Ávila al fondo" }, // 38556235
    { archivo: "caracas-noche", alt: "Caracas de noche al pie de El Ávila" }, // 4148187
    { archivo: "caracas-torres", alt: "Torres de Parque Central de noche en Caracas" }, // 39648321
    { archivo: "caracas-panorama", alt: "Valle de Caracas con El Ávila entre nubes" }, // 20733321
    { archivo: "caracas-atardecer", alt: "Caracas al atardecer frente a El Ávila" }, // 14377784
  ],
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
