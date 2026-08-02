// Todo lo que la página de posadas afirma, en un solo lugar y con su fuente.
//
// Cada número salió de una consulta sobre nuestra propia operación entre el
// 12 y el 31 de julio de 2026. Si alguno cambia, se cambia acá y no repartido
// por la pantalla: una cifra desactualizada en una propuesta comercial es peor
// que no ponerla.

/** Mensajes recibidos por hora del día, hora de Venezuela. Suma 2.280. */
export const MENSAJES_POR_HORA = [
  53, 34, 11, 11, 11, 17, 40, 76, 117, 144, 128, 136,
  112, 96, 134, 135, 128, 118, 134, 128, 136, 157, 136, 90,
];

/** Se considera horario de oficina de 8 a 17. El resto son las horas sin nadie. */
export const HORA_ABRE = 8;
export const HORA_CIERRA = 17;

export const CIFRAS = {
  conversaciones: 2280,
  mensajes: 10091,
  segundosRespuesta: 6.8,
  fueraDeHorario: 1034,
  porcentajeFuera: 45,
  finDeSemana: 629,
  calificados: 195,
  ultimaSemana: 1170,
  alojamientos: 118,
  fotos: 411,
  horaPico: 21,
  mensajesHoraPico: 157,
};

/* ------------------------------------------------------------------ Planes
   Los precios salieron de un cálculo de costo real, no de una corazonada:

   - ManyChat cobra por CONTACTOS ACTIVOS del mes (se reinicia cada ciclo),
     no por mensajes: ~$15 hasta 500 contactos activos. Ese es el piso duro
     del costo y por eso ningún plan puede bajar de ~$45 sin dejar de ser
     negocio.
   - DeepSeek v4-flash cuesta $0.14 por millón de tokens de entrada. El
     catálogo de UNA posada pesa ~3.000 tokens por mensaje, así que 10.000
     mensajes al mes son ~$5. Los mensajes son, en la práctica, gratis.

   Consecuencia: el costo es plano (~$18/mes por cliente) sin importar el
   tier de mensajes, mientras los contactos activos no pasen de 500. Los
   tiers son empaquetado de valor, no traslado de costo -- por eso el margen
   crece hacia arriba en vez de comprimirse.

   Ganancia por cliente, a repartir 50/50 entre el dueño y la agencia:
     Básico  $59/$69/$79/$89  ->  $41/$51/$61/$71
     Pro     $109/$129        ->  $91/$111
   Referencia de mercado para no perder el piso: Tidio+Lyro cobra $289/mes por
   500 conversaciones e Intercom Fin ~$0.99 por conversación resuelta. */

export interface Tier {
  mensajes: number;
  basico: number | null;
  pro: number | null;
}

/** Un solo lugar para la escalera de precios. `null` = ese tier no existe en
 *  ese plan (Pro arranca en 5.000: por debajo no tiene sentido pagarlo). */
export const TIERS: Tier[] = [
  { mensajes: 500, basico: 59, pro: null },
  { mensajes: 2000, basico: 69, pro: null },
  { mensajes: 5000, basico: 79, pro: 109 },
  { mensajes: 10000, basico: 89, pro: 129 },
];

/** Cobro único de instalación. Incluye el primer mes: quien contrata paga una
 *  sola vez, ve el resultado un mes completo, y recién ahí empieza a correr la
 *  mensualidad. */
export const INSTALACION = 109;

/** Los cuatro canales donde la asistente atiende, en los dos planes. */
export const CANALES = ["Instagram", "Facebook", "WhatsApp", "Telegram"] as const;

/* La condición del WhatsApp va escrita en la página y no se descubre después:
   la API de WhatsApp Business no admite números venezolanos, así que quien
   quiera ese canal tiene que poner un número de otro país. Es un requisito del
   proveedor, no una decisión nuestra, y callarlo hasta la instalación sería
   vender algo que no se puede entregar. */
export const AVISO_WHATSAPP =
  "WhatsApp necesita un número que no sea venezolano — es un requisito de "
  + "WhatsApp, no nuestro. Los otros tres canales funcionan con lo que ya tienes.";

export type IdPlan = "basico" | "pro";

export interface Plan {
  id: IdPlan;
  nombre: string;
  gancho: string;
  incluye: string[];
}

export const PLANES: Plan[] = [
  {
    id: "basico",
    nombre: "Básico",
    gancho: "Lo necesario para que nadie se quede sin respuesta.",
    incluye: [
      "Responde a cualquier hora, todos los días",
      "Cotiza con tus precios exactos",
      "Pide el teléfono y las fechas",
      "Responde qué incluye y los requisitos",
      "Te pasa el cliente listo por WhatsApp",
      "Atiende en Instagram, Facebook, WhatsApp y Telegram",
    ],
  },
  {
    id: "pro",
    nombre: "Pro",
    gancho: "Además, atiende como si fuera alguien de tu equipo.",
    incluye: [
      "Todo lo del Básico, en los cuatro canales",
      "Manda la foto del ambiente que le piden",
      "Habla con el tono de tu negocio",
      "Maneja precios distintos por temporada",
      "Reglas propias: qué ofrecer y qué callar",
      "Soporte prioritario y ajustes cuando quieras",
    ],
  },
];

export interface Opcion {
  id: string;
  texto: string;
  /** Las que solo entran en el plan full. Marcar una sube el precio. */
  full?: boolean;
}

export const HACE: Opcion[] = [
  { id: "responde", texto: "Responder a cualquier hora, todos los días" },
  { id: "cotiza", texto: "Cotizar con mis precios exactos" },
  { id: "datos", texto: "Pedir el teléfono y las fechas" },
  { id: "requisitos", texto: "Responder qué incluye y los requisitos" },
  { id: "fotos", texto: "Mandar la foto que el cliente pide (el baño, la cocina)", full: true },
  { id: "tono", texto: "Hablar con el tono de mi negocio", full: true },
  { id: "temporada", texto: "Manejar precios distintos por temporada", full: true },
];

// "Hablar de otras posadas" salió de la lista: la asistente es exclusiva del
// alojamiento que la contrata y nunca ofrece otro. Ponerlo como opción sembraba
// la duda de que pudiera hacerlo.
export const NO_HACE: Opcion[] = [
  { id: "descuentos", texto: "Dar descuentos por su cuenta" },
  { id: "disponibilidad", texto: "Prometer disponibilidad sin confirmar" },
  { id: "ocultar", texto: "Ocultar que es un asistente si le preguntan" },
];

export const OFRECE: Opcion[] = [
  { id: "hospedaje", texto: "Solo hospedaje" },
  { id: "traslados", texto: "Hospedaje y traslados" },
  { id: "excursion", texto: "Paquetes con excursión" },
  { id: "eventos", texto: "Eventos y grupos" },
];

/** Las tres preguntas sugeridas del chat de prueba. */
export const SUGERENCIAS = [
  "¿Tienen algo en Margarita para el fin de semana?",
  "¿Me mandas foto de la habitación?",
  "¿Hacen descuento para dos noches?",
];
