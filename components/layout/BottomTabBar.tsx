"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  {
    href: "/",
    label: "Inicio",
    icon: (
      <path d="M4 11.5 12 4l8 7.5M6 10v9h5v-5h2v5h5v-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    href: "/buscar",
    label: "Buscar",
    icon: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="M20 20l-4.5-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </>
    ),
  },
  {
    href: "/catalogo/hot-sales",
    label: "Promos",
    icon: (
      <path d="M3 12h18M8 6l-5 6 5 6M16 6l5 6-5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    href: "/cotizador-personalizado",
    label: "Cotizar",
    icon: (
      <path d="M6 3h9l5 5v13H6V3zM14 3v5h5M9 12h6M9 16h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    href: "/cuenta",
    label: "Cuenta",
    icon: (
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20c1.5-4 4.7-6 8-6s6.5 2 8 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
];

export function BottomTabBar() {
  const pathname = usePathname();
  const esActiva = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-card/95 backdrop-blur-lg lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-md items-stretch justify-between px-1">
        {TABS.map(({ href, label, icon }) => {
          const activo = esActiva(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={activo ? "page" : undefined}
              className="flex min-w-0 flex-1 flex-col items-center gap-1 px-1 pb-2 pt-2.5 text-center"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={activo ? "text-coral" : "text-ink-soft"} aria-hidden="true">
                {icon}
              </svg>
              <span className={`truncate text-[10.5px] leading-none ${activo ? "font-bold text-coral" : "font-medium text-ink-soft"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
