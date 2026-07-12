import Link from "next/link";

const SERVICIOS = [
  {
    href: "/catalogo/paquetes",
    titulo: "Full Day",
    desc: "Escápate por el día",
    color: "text-[#10b981]",
    border: "border-[#10b981]/25",
    icon: (
      <path d="M12 3a5 5 0 0 0-5 5v1H5a2 2 0 0 0-2 2v1a9 9 0 0 0 9 9h0a9 9 0 0 0 9-9v-1a2 2 0 0 0-2-2h-2V8a5 5 0 0 0-5-5z" />
    ),
  },
  {
    href: "/catalogo/hoteles",
    titulo: "Hospedaje",
    desc: "Hoteles al mejor precio",
    color: "text-coral",
    border: "border-coral/25",
    icon: <path d="M3 21V7a2 2 0 0 1 2-2h4v16M15 21V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v12M9 21V11h4v10M3 21h18" />,
  },
  {
    href: "/cotizar/boleteria",
    titulo: "Boletería",
    desc: "Vuelos nacionales e intl.",
    color: "text-[#4a9eff]",
    border: "border-[#4a9eff]/25",
    icon: <path d="M10.5 21 12 17l-5-2 1-2 6 1 3.5-3.5a1.5 1.5 0 1 0-2-2L12 12l-6-1-2 1 2 5-1 1.5" />,
  },
];

export function ServiciosGrid() {
  return (
    <nav aria-label="Servicios principales" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {SERVICIOS.map((s) => (
        <Link
          key={s.href}
          href={s.href}
          className={`flex min-h-11 flex-col items-center gap-2 rounded-2xl border-2 bg-card px-4 py-6 text-center ${s.border}`}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={s.color} aria-hidden="true">
            {s.icon}
          </svg>
          <span className="font-display text-lg font-semibold text-ink">{s.titulo}</span>
          <span className="text-sm text-ink-soft">{s.desc}</span>
        </Link>
      ))}
    </nav>
  );
}
