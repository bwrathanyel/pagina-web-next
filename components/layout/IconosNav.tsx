// SVG inline de 14px por ítem del header, mismo patrón que HeaderControls.tsx
// y ThemeSwitch.tsx (el sitio no usa librería de iconos). Opacidad baja en
// reposo, plena en hover/activo -- el color lo hereda del texto del link.
const TAMANO = 14;
const PROPS_BASE = {
  width: TAMANO,
  height: TAMANO,
  viewBox: "0 0 24 24",
  "aria-hidden": true,
} as const;

function Etiqueta() {
  return (
    <svg {...PROPS_BASE} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.6 12.6 12.6 20.6a2 2 0 0 1-2.8 0L3 13.8V3h10.8l6.8 6.8a2 2 0 0 1 0 2.8Z" />
      <circle cx="7.5" cy="7.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function Llama() {
  return (
    <svg {...PROPS_BASE} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2c1 3-2 4-2 7a3 3 0 0 0 6 0c2 1 3 3 3 5.5A7 7 0 0 1 5 14.5C5 9 9 6 12 2Z" />
    </svg>
  );
}

function Cama() {
  return (
    <svg {...PROPS_BASE} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6" />
      <path d="M3 18v2M21 18v2M3 12V7a1 1 0 0 1 1-1h5v5" />
    </svg>
  );
}

function PinMapa() {
  return (
    <svg {...PROPS_BASE} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function PersonaMas() {
  return (
    <svg {...PROPS_BASE} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M18 8v6M15 11h6" />
    </svg>
  );
}

function Destello() {
  return (
    <svg {...PROPS_BASE} fill="currentColor" aria-hidden="true">
      <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2z" />
    </svg>
  );
}

const ICONOS: Record<string, () => React.JSX.Element> = {
  promociones: Etiqueta,
  "hot-sales": Llama,
  hoteles: Cama,
  guias: PinMapa,
  empleo: PersonaMas,
  "ia-negocio": Destello,
};

export function IconoNav({
  id,
  activo,
  className = "",
}: {
  id: string;
  activo?: boolean;
  className?: string;
}) {
  const Icono = ICONOS[id];
  if (!Icono) return null;
  return (
    <span className={`shrink-0 transition-opacity ${activo ? "opacity-90" : "opacity-45 group-hover:opacity-90"} ${className}`}>
      <Icono />
    </span>
  );
}
