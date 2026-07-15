import type { CampoDef, PasoDef, Respuestas, TipoCotizacion } from "@/components/cotizador/types";

const ninosMasCero = (r: Respuestas) => Number(r.ninos ?? 0) > 0;

const CAMPO_NOMBRE: CampoDef = {
  key: "nombre",
  label: "Tu nombre",
  tipo: "text",
  placeholder: "Escribe tu nombre completo",
  required: true,
};

const CAMPO_TELEFONO: CampoDef = {
  key: "telefono",
  label: "Tu número de teléfono",
  tipo: "tel",
  placeholder: "Ej: 0412-1234567",
  hint: "Solo para contactarte más rápido si hay ofertas relámpago",
};

const CAMPO_NOTAS: CampoDef = {
  key: "notas",
  label: "Notas",
  tipo: "textarea",
  placeholder: "¿Algo más que debamos saber?",
};

function campoNinos(edadMax = 11): CampoDef[] {
  return [
    {
      key: "ninos",
      label: "Niños",
      tipo: "select",
      opciones: [
        { value: "0", label: "Sin niños" },
        { value: "1", label: "1 niño" },
        { value: "2", label: "2 niños" },
        { value: "3", label: "3 niños" },
        { value: "4", label: "4 niños" },
      ],
      default: "0",
    },
    {
      key: "edadesNinos",
      label: "Edad de cada niño",
      tipo: "text",
      placeholder: `Ej: 5 y 8 años`,
      hint: `Si algún niño tiene 9 años o más (hasta ${edadMax}), necesita cédula vigente para viajar.`,
      condicion: ninosMasCero,
    },
  ];
}

export const DESTINOS_VENEZUELA: import("@/components/cotizador/types").OpcionCampo[] = [
  { value: "Isla de Margarita", label: "Isla de Margarita", desc: "Playas paradisíacas, duty free y vida nocturna", emoji: "🏖️" },
  { value: "Morrocoy", label: "Morrocoy", desc: "Cayos de arena blanca y snorkel de clase mundial", emoji: "🐠" },
  { value: "Los Roques", label: "Los Roques", desc: "Archipiélago virgen ideal para desconectar", emoji: "🏝️" },
  { value: "Mérida", label: "Mérida", desc: "Montañas andinas y el teleférico más alto", emoji: "🚡" },
  { value: "Canaima", label: "Canaima", desc: "Tepuyes milenarios y el Salto Ángel", emoji: "💧" },
  { value: "Catatumbo", label: "Catatumbo", desc: "El relámpago eterno, único en el mundo", emoji: "⚡" },
  { value: "Colonia Tovar", label: "Colonia Tovar", desc: "Pueblo alemán, fresas y arquitectura bávara", emoji: "🏘️" },
  { value: "Extranjero", label: "Viajar al extranjero", desc: "Destinos internacionales", emoji: "🌍" },
];

export const WIZARD_CONFIG: Record<TipoCotizacion, PasoDef[]> = {
  hospedaje: [
    {
      titulo: "¿A dónde quieres ir?",
      campos: [
        { key: "destino", label: "Destino", tipo: "cards", opciones: DESTINOS_VENEZUELA, required: true, default: "Isla de Margarita" },
        { key: "destinoOtro", label: "Escribe tu destino ideal", tipo: "text", condicion: (r) => r.destino === "Extranjero" || r.destino === undefined },
        CAMPO_NOMBRE,
      ],
    },
    {
      titulo: "Hospedaje",
      campos: [
        {
          key: "alojamiento",
          label: "Tipo de alojamiento",
          tipo: "cards",
          default: "Hotel",
          opciones: [
            { value: "Hotel", label: "Hotel", desc: "Servicio completo, recepción 24h y amenities", emoji: "🏨" },
            { value: "Apartamento / Suite", label: "Apartamento / Suite", desc: "Más espacio y privacidad, ideal para familias", emoji: "🏠" },
            { value: "Posada / Ecolodge", label: "Posada / Ecolodge", desc: "Experiencia auténtica y contacto con la naturaleza", emoji: "🌿" },
            { value: "Resort", label: "Resort", desc: "Todo incluido con actividades y entretenimiento", emoji: "🌴" },
            { value: "Sin preferencia", label: "Sin preferencia", desc: "Te recomendamos la mejor opción", emoji: "✨" },
          ],
        },
        {
          key: "plan",
          label: "Plan de alimentación",
          tipo: "cards",
          default: "Solo Alojamiento",
          opciones: [
            { value: "Solo Alojamiento", label: "Solo Alojamiento", emoji: "🛏️" },
            { value: "Desayuno Incluido", label: "Desayuno Incluido", emoji: "☕" },
            { value: "Media Pensión", label: "Media Pensión", desc: "Desayuno + cena", emoji: "🍽️" },
            { value: "Pensión Completa", label: "Pensión Completa", desc: "Desayuno, almuerzo y cena", emoji: "🥩" },
            { value: "Todo Incluido", label: "Todo Incluido", emoji: "🍹" },
          ],
        },
        {
          key: "amenidades",
          label: "Preferencias",
          tipo: "tags",
          multiple: true,
          opciones: [
            { value: "Piscina", label: "Piscina" },
            { value: "Playa privada", label: "Playa priv." },
            { value: "Wi-Fi", label: "Wi-Fi" },
            { value: "Estacionamiento", label: "Parqueo" },
            { value: "Jacuzzi", label: "Jacuzzi" },
            { value: "Gimnasio", label: "Gym" },
            { value: "Restaurante", label: "Restaurante" },
            { value: "Vista al mar", label: "Vista al mar" },
            { value: "Aire acondicionado", label: "A/C" },
            { value: "Desayuno buffet", label: "Buffet" },
          ],
        },
        { key: "presupuesto", label: "Presupuesto por noche (USD)", tipo: "slider", min: 20, max: 500, step: 10, default: 100 },
      ],
    },
    {
      titulo: "Fechas y huéspedes",
      campos: [
        { key: "checkin", label: "Check-in", tipo: "date", required: true },
        { key: "checkout", label: "Check-out", tipo: "date", required: true },
        { key: "adultos", label: "Adultos", tipo: "number", min: 1, max: 50, default: 2, required: true },
        ...campoNinos(),
        { key: "habitaciones", label: "Habitaciones", tipo: "select", default: "1", opciones: [
          { value: "1", label: "1" }, { value: "2", label: "2" }, { value: "3", label: "3" }, { value: "4", label: "4" },
        ] },
      ],
    },
    {
      titulo: "¿Cómo llegas al destino?",
      campos: [
        {
          key: "transporte", label: "Medio de transporte", tipo: "tags", default: "vehiculo-propio",
          opciones: [
            { value: "vehiculo-propio", label: "Vehículo propio" },
            { value: "transporte-terrestre", label: "Transporte terrestre" },
            { value: "traslado-aereo", label: "Traslado aéreo" },
          ],
        },
        { key: "origenVuelo", label: "Ciudad de origen del vuelo", tipo: "text", condicion: (r) => r.transporte === "traslado-aereo" },
        {
          key: "flexVuelo", label: "Flexibilidad de fechas de vuelo", tipo: "select", default: "0",
          condicion: (r) => r.transporte === "traslado-aereo",
          opciones: [
            { value: "0", label: "Fechas fijas" }, { value: "1", label: "±1 día" }, { value: "2", label: "±2 días" }, { value: "3", label: "±3 días" },
          ],
        },
      ],
    },
    {
      titulo: "Contacto y extras",
      campos: [
        CAMPO_TELEFONO,
        {
          key: "ocasion", label: "Ocasión especial", tipo: "select", default: "Vacaciones",
          opciones: [
            { value: "Vacaciones", label: "Vacaciones" },
            { value: "Luna de Miel / Aniversario", label: "💑 Luna de Miel" },
            { value: "Cumpleaños", label: "🎂 Cumpleaños" },
            { value: "Viaje de Negocios", label: "💼 Negocios" },
            { value: "Despedida de Soltero/a", label: "🥂 Despedida" },
          ],
        },
        CAMPO_NOTAS,
      ],
    },
  ],

  boleteria: [
    {
      titulo: "Tu vuelo",
      campos: [
        { key: "tipoViaje", label: "¿Qué necesitas?", tipo: "tags", default: "ida-vuelta", opciones: [
          { value: "ida", label: "Solo Ida" }, { value: "ida-vuelta", label: "Ida y Vuelta" },
        ] },
        { key: "origen", label: "Origen", tipo: "select", default: "Valencia", opciones: [
          { value: "Valencia", label: "Valencia (VLN)" }, { value: "Caracas", label: "Caracas (CCS)" },
          { value: "Maracaibo", label: "Maracaibo (MAR)" }, { value: "Barcelona", label: "Barcelona (BLA)" },
          { value: "Isla de Margarita", label: "Isla de Margarita (PMV)" }, { value: "Otro", label: "Otro (especificar)" },
        ] },
        { key: "origenOtro", label: "Ciudad de origen", tipo: "text", condicion: (r) => r.origen === "Otro" },
        { key: "destino", label: "Destino", tipo: "select", required: true, opciones: [
          { value: "Caracas", label: "Caracas (CCS)" }, { value: "Maracaibo", label: "Maracaibo (MAR)" },
          { value: "Barcelona", label: "Barcelona (BLA)" }, { value: "Isla de Margarita", label: "Isla de Margarita (PMV)" },
          { value: "Valencia", label: "Valencia (VLN)" }, { value: "Puerto Ordaz", label: "Puerto Ordaz (PZO)" },
          { value: "Cumaná", label: "Cumaná (CUM)" }, { value: "Maturín", label: "Maturín (MUN)" },
          { value: "Bogotá, Colombia", label: "Bogotá (BOG)" }, { value: "Panamá", label: "Panamá (PTY)" },
          { value: "Madrid, España", label: "Madrid (MAD)" }, { value: "Miami, EE.UU.", label: "Miami (MIA)" },
          { value: "Cancún, México", label: "Cancún (CUN)" }, { value: "Lima, Perú", label: "Lima (LIM)" },
          { value: "Otro", label: "Otro (especificar)" },
        ] },
        { key: "destinoOtro", label: "Ciudad de destino", tipo: "text", condicion: (r) => r.destino === "Otro" },
        CAMPO_NOMBRE,
      ],
    },
    {
      titulo: "Fechas",
      campos: [
        { key: "fechaIda", label: "Fecha de ida", tipo: "date", required: true },
        { key: "fechaVuelta", label: "Fecha de vuelta", tipo: "date", condicion: (r) => r.tipoViaje !== "ida" },
        { key: "flexibilidad", label: "Flexibilidad de fechas", tipo: "select", default: "0", opciones: [
          { value: "0", label: "Fijas" }, { value: "1", label: "±1" }, { value: "2", label: "±2" }, { value: "3", label: "±3" }, { value: "7", label: "±7" },
        ] },
      ],
    },
    {
      titulo: "Pasajeros",
      campos: [
        { key: "adultos", label: "Adultos (12+ años)", tipo: "number", min: 1, max: 50, default: 2, required: true },
        { key: "cedulaAdultos", label: "Todos los adultos tienen cédula vigente", tipo: "checkbox", default: true },
        ...campoNinos(),
        { key: "cedulaNinos", label: "Los niños que viajan tienen cédula", tipo: "checkbox", condicion: ninosMasCero },
        { key: "bebes", label: "Bebés (0-23 meses)", tipo: "select", default: "0", opciones: [
          { value: "0", label: "Sin bebés" }, { value: "1", label: "1 bebé" }, { value: "2", label: "2 bebés" },
        ] },
        { key: "equipaje", label: "Equipaje", tipo: "tags", multiple: true, default: ["Equipaje de mano"], opciones: [
          { value: "Equipaje de mano", label: "Mano" }, { value: "Equipaje facturado", label: "Facturado" }, { value: "Sin equipaje", label: "Sin equipaje" },
        ] },
      ],
    },
    {
      titulo: "Contacto y extras",
      campos: [
        CAMPO_TELEFONO,
        { key: "ocasion", label: "Ocasión especial", tipo: "select", default: "Viaje regular", opciones: [
          { value: "Viaje regular", label: "Viaje regular" }, { value: "Luna de Miel", label: "💑 Luna de Miel" },
          { value: "Cumpleaños", label: "🎂 Cumpleaños" }, { value: "Viaje de Negocios", label: "💼 Negocios" },
          { value: "Emergencia", label: "🏥 Emergencia" },
        ] },
        CAMPO_NOTAS,
      ],
    },
  ],

  fullday: [
    {
      titulo: "Tu grupo",
      campos: [
        CAMPO_NOMBRE,
        { key: "adultos", label: "Adultos (11+ años)", tipo: "number", min: 1, max: 100, default: 15, required: true, hint: "Servicio privado por grupo, mínimo 15 personas en total." },
        ...campoNinos(10),
      ],
    },
    {
      titulo: "Elige tu plan",
      campos: [
        {
          key: "plan", label: "Plan (precio por persona)", tipo: "cards", default: "basico",
          opciones: [
            { value: "basico", label: "Plan Básico · $25", desc: "Traslado, lancha, hidratación y logística", emoji: "🧊" },
            { value: "full360", label: "Plan Full360 · $35", desc: "Todo lo del Básico + almuerzo playero", emoji: "🐟" },
          ],
        },
      ],
    },
    {
      titulo: "Contacto",
      campos: [CAMPO_TELEFONO, CAMPO_NOTAS],
    },
  ],

  paquete: [
    {
      titulo: "Tu consulta",
      campos: [
        CAMPO_NOMBRE,
        { key: "destino", label: "Destino de interés", tipo: "text", required: true, placeholder: "Ej: Los Roques, Dubái, Tepuy Roraima..." },
        { key: "fechaAprox", label: "Fecha aproximada", tipo: "date" },
      ],
    },
    {
      titulo: "Viajeros",
      campos: [
        { key: "adultos", label: "Adultos", tipo: "number", min: 1, max: 50, default: 2, required: true },
        ...campoNinos(),
      ],
    },
    {
      titulo: "Contacto y notas",
      campos: [CAMPO_TELEFONO, CAMPO_NOTAS],
    },
  ],

  // El único lugar del sitio con el wizard completo desde cero — cuando
  // ya se eligió un producto o promoción concreta (ficha, carrito), ese
  // destino/tipo ya se sabe y no se vuelve a preguntar acá.
  personalizado: [
    {
      titulo: "¿Qué tipo de experiencia buscas?",
      campos: [
        {
          key: "tipoServicio",
          label: "Servicio",
          tipo: "cards",
          required: true,
          default: "Hospedaje",
          opciones: [
            { value: "Hospedaje", label: "Hospedaje", desc: "Hotel, resort, posada o apartamento", emoji: "🏨" },
            { value: "Full Day / Tour", label: "Full Day / Tour", desc: "Excursión de un día o varios", emoji: "🌴" },
            { value: "Boletería aérea", label: "Boletería aérea", desc: "Vuelos nacionales o internacionales", emoji: "✈️" },
            { value: "Paquete completo", label: "Paquete completo", desc: "Vuelo + hospedaje + actividades", emoji: "🌍" },
            { value: "No estoy seguro", label: "No estoy seguro/a", desc: "Cuéntanos qué tienes en mente y te asesoramos", emoji: "💬" },
          ],
        },
        CAMPO_NOMBRE,
      ],
    },
    {
      titulo: "¿A dónde quieres ir?",
      campos: [
        { key: "destino", label: "Destino", tipo: "cards", opciones: DESTINOS_VENEZUELA, required: true, default: "Isla de Margarita" },
        { key: "destinoOtro", label: "Escribe tu destino ideal", tipo: "text", condicion: (r) => r.destino === "Extranjero" || r.destino === undefined },
      ],
    },
    {
      titulo: "Presupuesto y fechas",
      campos: [
        { key: "presupuesto", label: "Presupuesto total aproximado (USD)", tipo: "slider", min: 50, max: 3000, step: 50, default: 500 },
        { key: "fechaAprox", label: "Fecha aproximada de viaje", tipo: "date" },
        { key: "adultos", label: "Adultos", tipo: "number", min: 1, max: 50, default: 2, required: true },
        ...campoNinos(),
      ],
    },
    {
      titulo: "Contacto",
      campos: [CAMPO_TELEFONO, CAMPO_NOTAS],
    },
  ],
};
