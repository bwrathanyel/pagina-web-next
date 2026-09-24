// Set único de iconos del sitio: grilla de 24, trazo 2, puntas redondas. Antes
// cada componente dibujaba el suyo (o usaba glifos como ✕ y ↗, que cambian de
// forma según la fuente del sistema). Los de marca (WhatsApp) siguen en
// ui/icons porque son rellenos, no de trazo.
const TRAZOS = {
  cerrar: <path d="M6 6l12 12M18 6 6 18" />,
  "flecha-der": <path d="M5 12h14M13 6l6 6-6 6" />,
  "flecha-izq": <path d="M19 12H5M11 18l-6-6 6-6" />,
  "chevron-izq": <path d="m15 18-6-6 6-6" />,
  "chevron-der": <path d="m9 18 6-6-6-6" />,
  "chevron-abajo": <path d="m6 9 6 6 6-6" />,
  calendario: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  externo: <path d="M7 17 17 7M8 7h9v9" />,
  buscar: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.2-4.2" />
    </>
  ),
  carrito: (
    <>
      <path d="M3 4h2.2l2.1 10.2a1.5 1.5 0 0 0 1.5 1.2h8.4a1.5 1.5 0 0 0 1.5-1.1L20.5 8H6.1" />
      <circle cx="9.5" cy="19.5" r="1.3" />
      <circle cx="17" cy="19.5" r="1.3" />
    </>
  ),
  corazon: <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20Z" />,
  hotel: (
    <>
      <path d="M4 21h16M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
      <path d="M9.5 7.5h1M13.5 7.5h1M9.5 11.5h1M13.5 11.5h1M10.5 21v-3.5a1.5 1.5 0 0 1 3 0V21" />
    </>
  ),
  inicio: (
    <>
      <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1v-8.5Z" />
    </>
  ),
  etiqueta: (
    <>
      <path d="M20.6 12.6 12.6 20.6a2 2 0 0 1-2.8 0L3 13.8V3h10.8l6.8 6.8a2 2 0 0 1 0 2.8Z" />
      <circle cx="7.5" cy="7.5" r="1.3" />
    </>
  ),
  cotizar: (
    <>
      <path d="M8 4h8M9 2.5h6a1 1 0 0 1 1 1V5H8V3.5a1 1 0 0 1 1-1Z" />
      <path d="M16 4h2a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h2" />
      <path d="M9 11h6M9 15h4" />
    </>
  ),
  usuario: (
    <>
      <circle cx="12" cy="8.5" r="3.8" />
      <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  mas: (
    <>
      <circle cx="5.5" cy="12" r="1.2" />
      <circle cx="12" cy="12" r="1.2" />
      <circle cx="18.5" cy="12" r="1.2" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h10" />,
  campana: (
    <>
      <path d="M18 8.5a6 6 0 1 0-12 0c0 6.5-2.5 8.5-2.5 8.5h17S18 15 18 8.5Z" />
      <path d="M10.3 20.5a2 2 0 0 0 3.4 0" />
    </>
  ),
  sol: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
    </>
  ),
  luna: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />,
  pantalla: (
    <>
      <rect x="3" y="4.5" width="18" height="12" rx="1.5" />
      <path d="M8.5 20.5h7M12 16.5v4" />
    </>
  ),
  avion: <path d="M10.5 13.5 3 11l1.5-1.5 7.5 1 4.5-4.5a2 2 0 0 1 2.8 2.8L14.8 13l1 7.5L14.3 22l-2.5-7.5-3.3 3.3.3 2.2-1.3 1.3-1.3-3.5L2.7 16.5 4 15.2l2.2.3 3.3-3.3" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  maletin: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3 12.5h18" />
    </>
  ),
  destello: <path d="M12 3.5 13.8 9l5.7 1.8-5.7 1.8L12 18.5l-1.8-5.9L4.5 10.8 10.2 9 12 3.5Z" />,
  basura: <path d="M4.5 7h15M10 11v6M14 11v6M6 7l1 12a1.5 1.5 0 0 0 1.5 1.4h7A1.5 1.5 0 0 0 17 19l1-12M9 7V4.5h6V7" />,
  menos: <path d="M5 12h14" />,
  ajustes: (
    <>
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
      <circle cx="15" cy="7" r="2" />
      <circle cx="9" cy="17" r="2" />
    </>
  ),
  copiar: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V6a2 2 0 0 1 2-2h9" />
    </>
  ),
  suma: <path d="M12 5v14M5 12h14" />,
  clip: <path d="m20.5 11.5-8.6 8.6a5 5 0 0 1-7-7l8.6-8.6a3.4 3.4 0 0 1 4.8 4.8l-8.6 8.6a1.7 1.7 0 0 1-2.4-2.4l7.9-7.9" />,
  enviar: <path d="M5 12 3.5 4.5 20.5 12l-17 7.5L5 12Zm0 0h6.5" />,
  alerta: (
    <>
      <path d="M12 3.5 2.8 19.5h18.4L12 3.5Z" />
      <path d="M12 10v4.5M12 17.2v.1" />
    </>
  ),
} as const;

export type NombreIcono = keyof typeof TRAZOS;

export function Icono({
  nombre,
  tamano = 20,
  className = "",
  relleno = false,
  titulo,
}: {
  nombre: NombreIcono;
  tamano?: number;
  className?: string;
  /** Rellena la forma con el color del texto (corazón de favorito activo). */
  relleno?: boolean;
  /** Solo cuando el icono va SIN texto al lado y no está dentro de un botón
   * con aria-label: si no, queda decorativo (aria-hidden). */
  titulo?: string;
}) {
  return (
    <svg
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill={relleno ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={"shrink-0 " + className}
      role={titulo ? "img" : undefined}
      aria-label={titulo}
      aria-hidden={titulo ? undefined : true}
    >
      {TRAZOS[nombre]}
    </svg>
  );
}
