// Landings por destino (/destinos/[slug]). Texto versionado acá y no en la
// base: es contenido editorial que Google y los asistentes con IA citan, y
// cambia poco. Los hoteles y precios de cada página salen del catálogo real
// (productos.destino ∈ destinosDb), así que nunca se escriben a mano.
// BORRADOR 2026-10-28 — pendiente de revisión del dueño.

export interface Faq {
  p: string;
  r: string;
}

export interface Destino {
  slug: string;
  nombre: string;
  /** Valores de productos.destino que pertenecen a esta landing. */
  destinosDb: string[];
  /** Valor exacto de DESTINOS del cotizador: "Cotizar mi viaje" arranca ahí. */
  destinoCotizador: string;
  estado: string;
  geo: { lat: number; lng: number };
  foto: string;
  titulo: string;
  descripcion: string;
  intro: string;
  secciones: { titulo: string; parrafos: string[] }[];
  faqs: Faq[];
}

export const DESTINOS: Destino[] = [
  {
    slug: "los-roques",
    nombre: "Los Roques",
    destinosDb: ["Los Roques"],
    destinoCotizador: "Los Roques",
    estado: "Dependencias Federales",
    geo: { lat: 11.95, lng: -66.67 },
    foto: "/destinos/los-roques-gran-roque",
    titulo: "Los Roques: posadas, vuelos y paquetes con agencia en Venezuela",
    descripcion:
      "Cómo viajar a Los Roques: vuelos desde Maiquetía, posadas en Gran Roque, mejor época, qué incluye cada plan y precios reales. Reserve con Destino y Eventos Lotus 360.",
    intro:
      "El archipiélago de Los Roques es un parque nacional de más de 300 cayos e islas en el mar Caribe, a unos 40 minutos de vuelo de Caracas. Agua turquesa, arena blanca y arrecifes de coral: es el destino de playa más buscado de Venezuela y también el que más planificación pide, porque solo se llega en avioneta y las plazas en posadas son limitadas.",
    secciones: [
      {
        titulo: "Cómo llegar a Los Roques",
        parrafos: [
          "La única vía práctica es aérea: avionetas y aviones pequeños salen del terminal auxiliar del Aeropuerto Internacional de Maiquetía hacia Gran Roque, la única isla poblada. Las aerolíneas permiten poco equipaje (suele rondar los 10 kg por persona), así que conviene viajar con bolso blando.",
          "Al llegar se paga la tasa de entrada al Parque Nacional. Nosotros le confirmamos el monto vigente y los horarios de vuelo al cotizar, y podemos coordinar el boleto, la posada y los traslados en una sola reserva.",
        ],
      },
      {
        titulo: "Dónde hospedarse",
        parrafos: [
          "En Gran Roque no hay grandes hoteles: el hospedaje es en posadas de pocas habitaciones, la mayoría con plan que incluye desayuno, cena y el paseo diario en lancha a los cayos con almuerzo tipo picnic. Por eso el precio por persona de Los Roques suele parecer alto frente a otros destinos, pero incluye casi todo el día.",
          "Abajo tiene las posadas que vendemos con su precio actualizado. Si viaja en temporada alta (Carnaval, Semana Santa, agosto, diciembre) reserve con varias semanas de anticipación.",
        ],
      },
      {
        titulo: "Qué hacer",
        parrafos: [
          "Los paseos en lancha llevan a cayos como Francisquí, Madrisquí, Crasquí, Cayo de Agua (con su lengua de arena entre dos islas) y Noronquí. Se practica snorkel, buceo, kitesurf y pesca deportiva con permiso. En el pueblo se puede subir al faro holandés para ver el atardecer.",
        ],
      },
      {
        titulo: "Mejor época para ir",
        parrafos: [
          "Los Roques tiene buen clima casi todo el año, con poca lluvia. De diciembre a abril sopla más brisa (ideal para kitesurf) y entre mayo y noviembre el mar suele estar más calmado, mejor para snorkel. Los feriados largos se agotan primero.",
        ],
      },
    ],
    faqs: [
      {
        p: "¿Cuánto cuesta un viaje a Los Roques?",
        r: "Depende de la posada, el plan y la temporada. En esta página mostramos el precio desde por persona de cada posada que vendemos, actualizado desde nuestro tarifario. El boleto aéreo se cotiza aparte según la fecha.",
      },
      {
        p: "¿Se puede ir a Los Roques por un día?",
        r: "Sí, hay full days con vuelo ida y vuelta en el mismo día, paseo a un cayo y almuerzo. Escríbanos por WhatsApp para consultar salidas disponibles.",
      },
      {
        p: "¿Puedo reservar Los Roques desde el exterior?",
        r: "Sí. Muchos de nuestros clientes son venezolanos en el exterior que reservan para ellos o sus familiares. Le enviamos la cotización por WhatsApp y le indicamos los medios de pago disponibles.",
      },
    ],
  },
  {
    slug: "margarita",
    nombre: "Isla de Margarita",
    destinosDb: ["Margarita", "Coche"],
    destinoCotizador: "Isla de Margarita",
    estado: "Nueva Esparta",
    geo: { lat: 11.0, lng: -63.9 },
    foto: "/destinos/margarita-playa",
    titulo: "Isla de Margarita: hoteles todo incluido, paquetes y full days",
    descripcion:
      "Hoteles todo incluido en Margarita, paquetes con boleto aéreo, full days a Coche y Cubagua, y cómo llegar en avión o ferry. Precios reales con Destino y Eventos Lotus 360.",
    intro:
      "Margarita es la isla más visitada de Venezuela: playas para todos los gustos, hoteles todo incluido, compras, gastronomía de mar y buena conexión aérea con Caracas, Valencia, Maracaibo y otras ciudades. Es el destino ideal para viajar en familia y para quienes buscan descanso sin complicaciones.",
    secciones: [
      {
        titulo: "Cómo llegar a Margarita",
        parrafos: [
          "En avión, el Aeropuerto Internacional Santiago Mariño (Porlamar) recibe vuelos nacionales diarios. En ferry, hay salidas desde Puerto La Cruz y Cumaná hacia Punta de Piedras, una opción popular para quienes viajan con carro.",
          "Tenemos paquetes con boleto aéreo ida y vuelta más hotel, con salida desde varias ciudades: elija pasajeros y noches y vea el precio al instante.",
        ],
      },
      {
        titulo: "Dónde hospedarse",
        parrafos: [
          "La mayor oferta de hoteles todo incluido está en Pampatar, Playa El Agua, Playa Parguito y la zona de Porlamar. En el todo incluido van comidas, bebidas y actividades del hotel, lo que facilita controlar el presupuesto. También hay hoteles con solo desayuno para quienes prefieren comer fuera.",
          "Abajo verá los hoteles que vendemos con su precio por persona actualizado. En muchos, los niños pagan menos o no pagan según la promoción vigente.",
        ],
      },
      {
        titulo: "Qué hacer",
        parrafos: [
          "Playas como El Agua, Parguito, El Yaque (kitesurf y windsurf), Playa Caribe y La Restinga, con su paseo en lancha por los manglares. Excursiones de un día a Isla de Coche y Cubagua en catamarán, el Castillo de San Carlos Borromeo en Pampatar, el Valle del Espíritu Santo y las compras en Porlamar.",
        ],
      },
      {
        titulo: "Mejor época para ir",
        parrafos: [
          "Margarita tiene sol casi todo el año. Las temporadas con más demanda son Carnaval, Semana Santa, julio-agosto y diciembre: en esas fechas los vuelos y hoteles suben y se agotan antes. Entre septiembre y noviembre suele haber mejores precios.",
        ],
      },
    ],
    faqs: [
      {
        p: "¿Cuál es el mejor hotel todo incluido en Margarita?",
        r: "Depende de lo que busque: playa frente al hotel, actividades para niños o tranquilidad. Le recomendamos según su presupuesto y fechas; en esta página puede comparar los hoteles que vendemos con fotos y precio.",
      },
      {
        p: "¿Venden paquetes a Margarita con boleto aéreo incluido?",
        r: "Sí. Nuestros paquetes incluyen boleto ida y vuelta y hotel, con varias ciudades de salida. El precio se calcula según pasajeros y noches.",
      },
      {
        p: "¿Cómo pago si estoy fuera de Venezuela?",
        r: "Le cotizamos por WhatsApp y le indicamos los medios de pago disponibles para clientes en el exterior. Muchos venezolanos afuera compran el viaje para su familia en Venezuela.",
      },
    ],
  },
  {
    slug: "canaima",
    nombre: "Canaima y Salto Ángel",
    destinosDb: ["Canaima"],
    destinoCotizador: "Canaima",
    estado: "Bolívar",
    geo: { lat: 6.24, lng: -62.85 },
    foto: "/destinos/canaima-salto-angel",
    titulo: "Canaima y Salto Ángel: paquetes, campamentos y cuándo ir",
    descripcion:
      "Viaje a Canaima y Salto Ángel: cómo llegar, campamentos, excursión en curiara, mejor época para ver el salto y paquetes con Destino y Eventos Lotus 360.",
    intro:
      "El Parque Nacional Canaima, Patrimonio de la Humanidad, es el paisaje de tepuyes, ríos y cascadas que identifica a Venezuela en el mundo. Allí está el Salto Ángel (Kerepakupai Merú), la caída de agua más alta del planeta, con cerca de 979 metros desde la cima del Auyantepuy.",
    secciones: [
      {
        titulo: "Cómo llegar a Canaima",
        parrafos: [
          "No hay carretera: se llega en avioneta, normalmente desde Ciudad Bolívar o Puerto Ordaz, y en algunas temporadas con vuelos desde otras ciudades. Los paquetes suelen incluir el vuelo, el campamento, las comidas y las excursiones con guía local.",
        ],
      },
      {
        titulo: "Dónde hospedarse",
        parrafos: [
          "El hospedaje es en campamentos frente a la laguna de Canaima, con habitaciones sencillas y plan de comidas incluido. Abajo están los que vendemos con su precio actualizado.",
        ],
      },
      {
        titulo: "Qué hacer",
        parrafos: [
          "La excursión al Salto Ángel en curiara (canoa) remonta los ríos Carrao y Churún y suele incluir noche en hamaca frente al salto. Desde la laguna se visitan los saltos Sapo (caminando por detrás de la cortina de agua), Hacha, Ucaima y Golondrina. También hay sobrevuelos al Auyantepuy.",
        ],
      },
      {
        titulo: "Mejor época para ver el Salto Ángel",
        parrafos: [
          "En temporada de lluvias (aproximadamente de junio a noviembre) el salto tiene más caudal y los ríos permiten llegar en curiara. En temporada seca el paisaje es igual de impresionante, pero el salto puede verse con menos agua y la ruta en río puede estar limitada. Le confirmamos qué excursiones operan en su fecha.",
        ],
      },
    ],
    faqs: [
      {
        p: "¿Cuántos días necesito para Canaima?",
        r: "Lo habitual son 3 días y 2 noches, que permite la laguna, el Salto Sapo y la excursión al Salto Ángel. Hay planes más cortos si solo quiere la laguna y un sobrevuelo.",
      },
      {
        p: "¿Es exigente físicamente la excursión al Salto Ángel?",
        r: "Requiere varias horas en curiara y una caminata de aproximadamente una hora por selva hasta el mirador. Es apta para la mayoría de personas con condición física normal.",
      },
    ],
  },
  {
    slug: "merida",
    nombre: "Mérida",
    destinosDb: ["Mérida"],
    destinoCotizador: "Mérida",
    estado: "Mérida",
    geo: { lat: 8.59, lng: -71.14 },
    foto: "/destinos/merida-pico-bolivar",
    titulo: "Mérida: hoteles, paquetes y qué hacer en los Andes venezolanos",
    descripcion:
      "Viaje a Mérida, Venezuela: hoteles y posadas, paquetes con boleto aéreo, Teleférico Mukumbarí, páramo y pueblos andinos. Precios reales con Destino y Eventos Lotus 360.",
    intro:
      "Mérida es la capital de los Andes venezolanos: clima fresco, montañas, el pico más alto del país (Pico Bolívar, unos 4.978 metros) y pueblos de páramo con tradición cafetalera y gastronómica. Es el destino favorito para quienes buscan algo distinto a la playa, sobre todo en vacaciones de diciembre.",
    secciones: [
      {
        titulo: "Cómo llegar a Mérida",
        parrafos: [
          "En avión hay vuelos al aeropuerto de Mérida y al de El Vigía, a una hora y media aproximadamente de la ciudad. Por carretera se llega desde Barinas o desde la Panamericana. Nuestros paquetes incluyen boleto ida y vuelta y hotel.",
        ],
      },
      {
        titulo: "Dónde hospedarse",
        parrafos: [
          "Hay hoteles en la ciudad, cerca del Teleférico y la zona de La Hechicera, y posadas de montaña en la vía al páramo (Mucuchíes, San Rafael, Apartaderos). Abajo verá los que vendemos con su precio actualizado.",
        ],
      },
      {
        titulo: "Qué hacer",
        parrafos: [
          "Subir en el Teleférico Mukumbarí, uno de los más altos y largos del mundo, hasta Pico Espejo. Recorrer la Ruta del Páramo, la Laguna de Mucubají, el Pico El Águila, Los Aleros, la Venezuela de Antier, Jají y el mercado principal. Para aventura: parapente, canopy y rafting.",
        ],
      },
      {
        titulo: "Mejor época para ir",
        parrafos: [
          "De diciembre a abril es temporada seca, con cielos más despejados para ver los picos. Diciembre es la fecha más demandada por las fiestas y el frío. Lleve abrigo: en el páramo la temperatura baja de 10 °C y en Pico Espejo puede estar bajo cero.",
        ],
      },
    ],
    faqs: [
      {
        p: "¿Cuántos días se recomiendan para Mérida?",
        r: "Entre 4 y 5 días permiten la ciudad, el Teleférico y un día completo por la Ruta del Páramo sin apuro.",
      },
      {
        p: "¿Venden paquetes a Mérida con boleto aéreo?",
        r: "Sí, con boleto ida y vuelta y hotel. El precio se calcula según la ciudad de salida, los pasajeros y las noches.",
      },
    ],
  },
  {
    slug: "morrocoy",
    nombre: "Morrocoy y Chichiriviche",
    destinosDb: ["Chichiriviche", "Morrocoy", "Tucacas"],
    destinoCotizador: "Morrocoy",
    estado: "Falcón",
    geo: { lat: 10.87, lng: -68.27 },
    foto: "/destinos/morrocoy-sombrero",
    titulo: "Morrocoy y Chichiriviche: posadas, cayos y full days",
    descripcion:
      "Viaje a Morrocoy: posadas en Chichiriviche y Tucacas, paseo a Cayo Sombrero, Cayo Sal y Cayo Muerto, full days y cómo llegar desde Valencia y Caracas.",
    intro:
      "El Parque Nacional Morrocoy, en la costa de Falcón, es el destino de playa más cercano para el centro del país: cayos de arena blanca y agua tranquila a pocas horas por carretera de Valencia y Caracas. Ideal para fines de semana y para viajar con niños.",
    secciones: [
      {
        titulo: "Cómo llegar a Morrocoy",
        parrafos: [
          "Por carretera, Tucacas y Chichiriviche quedan a unas 2 horas de Valencia y unas 4 de Caracas. Desde los embarcaderos de cada pueblo salen las lanchas a los cayos, con tarifas por persona según el cayo. Somos una agencia de Valencia y conocemos la ruta: podemos incluir traslados.",
        ],
      },
      {
        titulo: "Dónde hospedarse",
        parrafos: [
          "La oferta es de posadas y hoteles pequeños en Chichiriviche y Tucacas, muchos con plan que incluye el paseo en lancha. Abajo verá los que vendemos con precio actualizado.",
        ],
      },
      {
        titulo: "Qué hacer",
        parrafos: [
          "Desde Tucacas: Cayo Sombrero, Playa Mero, Cayo Sal, Cayo Paiclás y Boca Seca. Desde Chichiriviche: Cayo Muerto, Cayo Sal, Cayo Peraza y la Cueva de la Virgen. También paseos por los manglares y el Refugio de Fauna de Cuare, con flamencos en temporada.",
        ],
      },
      {
        titulo: "Mejor época para ir",
        parrafos: [
          "Se puede ir todo el año. Los feriados y agosto son los días de más gente; entre semana los cayos están mucho más tranquilos y las posadas tienen mejor disponibilidad.",
        ],
      },
    ],
    faqs: [
      {
        p: "¿Qué es mejor, Tucacas o Chichiriviche?",
        r: "Tucacas da acceso a Cayo Sombrero y Playa Mero y tiene más servicios. Chichiriviche es más tranquilo y está más cerca de Cayo Muerto y Cayo Sal. Le ayudamos a elegir según lo que busque.",
      },
      {
        p: "¿Hay full days a Morrocoy?",
        r: "Sí, con salida desde Valencia y otras ciudades del centro, que incluyen traslado, lancha a los cayos y almuerzo. Consulte salidas por WhatsApp.",
      },
    ],
  },
];

export function destinoPorSlug(slug: string) {
  return DESTINOS.find((d) => d.slug === slug) ?? null;
}

/** Landing a la que pertenece un valor de productos.destino, para enlazar desde la ficha. */
export function destinoDeProducto(destinoDb: string | null) {
  if (!destinoDb) return null;
  return DESTINOS.find((d) => d.destinosDb.includes(destinoDb)) ?? null;
}
