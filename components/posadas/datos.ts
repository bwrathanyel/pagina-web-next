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
   Los precios salieron de un cálculo de costo real, y desde el 02/08/2026 el
   costo está MEDIDO, no estimado: el CRM cuenta los mensajes, los contactos y
   los tokens de cada cliente (CRM > IA Atención al Cliente > Clientes).

   - ManyChat: ~$15/mes hasta 500 contactos ACTIVOS (se reinicia cada ciclo).
     Es prácticamente el costo entero, y el único que puede escalar: cobra por
     personas distintas que escriben, no por mensajes.
   - DeepSeek v4-flash: $0.14 por millón de tokens de entrada, pero el prefijo
     del prompt se sirve desde su caché a ~1/10 de precio. Medido con tráfico
     real: 97,7% de aciertos de caché. Una posada gasta ~$0.0004 por mensaje,
     o sea ~$0.40 cada 1.000 mensajes. El modelo dejó de ser un costo.

   La estimación vieja de este comentario decía "~3.000 tokens por mensaje" y
   ~$5 en 10.000 mensajes. Contaba solo el catálogo y se olvidaba del prompt,
   que pesa ~12.600 tokens y viaja en CADA mensaje -- se equivocaba ~5x hacia
   abajo en tokens y, sin contar el caché, ~10x hacia arriba en dólares.

   Consecuencia: el costo es plano, entre $15 y $18 al mes por cliente, sin
   importar el tier. Los tiers son empaquetado de valor, no traslado de costo
   -- por eso el margen crece hacia arriba (74% -> 86%) en vez de comprimirse.

   Ganancia por cliente, a repartir 50/50 entre el dueño y la agencia
   (los tiers de 5.000 y 10.000 calculados al 80% de uso, que es lo que de
   verdad consume alguien que compra ese plan):
     Básico  $59 -> $43.80 | $69 -> $53.20 | $79 -> $62.40 | $89 -> $70.80
     Pro     $109 -> $92.40 | $129 -> $110.80
   Más la instalación: $109 una vez, ~$94 de ganancia el primer mes.

   Lo que ese margen paga y no aparece en la tabla: construir esto, mantenerlo
   cuando el proveedor deprecia un modelo sin avisar (pasó el 24/07), y las
   horas de puesta a punto de cada cliente. El costo marginal de un mensaje no
   es el costo del servicio.

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
