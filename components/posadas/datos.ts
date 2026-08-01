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

export const PLAN_BASICO = 50;
export const PLAN_FULL = 90;

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

export const NO_HACE: Opcion[] = [
  { id: "descuentos", texto: "Dar descuentos por su cuenta" },
  { id: "disponibilidad", texto: "Prometer disponibilidad sin confirmar" },
  { id: "otras", texto: "Hablar de otras posadas" },
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
