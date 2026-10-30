"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { m } from "motion/react";
import { Icono, type NombreIcono } from "@/components/ui/Icono";
import { usePaneles } from "@/lib/layout/paneles";
import { esRutaCheckout } from "@/lib/layout/rutasCheckout";
import { esFormularioAcceso } from "@/lib/utils/rutaInterna";

// Cinco pestañas: las dos de la izquierda y la de la derecha de "Cotizar" son
// destinos de mirar; "Cotizar" va al centro, levantada, porque es lo que el
// sitio quiere que se haga. Empleo, IA para negocios, tema y moneda viven en
// la hoja "Más" del header (HojaMas).
type Pestana = {
  href: string;
  label: string;
  icono: NombreIcono;
  /** Rutas que la marcan como activa; por defecto, su propio href. */
  activaEn?: (pathname: string) => boolean;
  /** Abre el panel de cuenta (CuentaHoja) en vez de navegar. */
  abrePanelCuenta?: boolean;
};

const empieza = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

const IZQUIERDA: Pestana[] = [
  { href: "/", label: "Inicio", icono: "inicio", activaEn: (p) => p === "/" },
  {
    href: "/catalogo/hot-sales",
    label: "Promos",
    icono: "etiqueta",
    activaEn: (p) => empieza(p, "/catalogo/hot-sales") || empieza(p, "/catalogo/promociones"),
  },
];

const DERECHA: Pestana[] = [
  { href: "/cuenta/favoritos", label: "Favoritos", icono: "corazon" },
  {
    href: "/cuenta",
    label: "Cuenta",
    icono: "usuario",
    activaEn: (p) => empieza(p, "/cuenta") && !empieza(p, "/cuenta/favoritos"),
    abrePanelCuenta: true,
  },
];

const COTIZAR = { href: "/cotizar", label: "Cotizar" };

export function BottomTabBar() {
  const pathname = usePathname();
  const abrirCuenta = usePaneles((s) => s.abrirCuenta);
  const esActiva = ({ href, activaEn }: Pestana) => (activaEn ? activaEn(pathname) : empieza(pathname, href));
  const cotizarActiva = empieza(pathname, COTIZAR.href);

  const pestana = (p: Pestana) => {
    const activa = esActiva(p);
    const clase =
      "flex h-full min-h-16 w-full flex-col items-center justify-center gap-1 text-xs leading-none transition-colors duration-150 " +
      (activa ? "font-bold text-acento" : "font-semibold text-ink-soft");
    const contenido = (
      <>
        <Icono nombre={p.icono} tamano={22} />
        {p.label}
      </>
    );
    return (
      <li key={p.href} className="relative">
        {activa ? (
          <m.span
            layoutId="pestana-activa"
            aria-hidden="true"
            transition={{ type: "spring", stiffness: 500, damping: 38 }}
            className="absolute inset-x-5 top-0 h-[3px] rounded-b-pill bg-acento"
          />
        ) : null}
        {p.abrePanelCuenta && !esFormularioAcceso(pathname) ? (
          <button
            type="button"
            onClick={abrirCuenta}
            aria-haspopup="dialog"
            aria-current={activa ? "page" : undefined}
            className={clase}
          >
            {contenido}
          </button>
        ) : (
          <Link href={p.href} aria-current={activa ? "page" : undefined} className={clase}>
            {contenido}
          </Link>
        )}
      </li>
    );
  };

  // /cotizar tiene su propia barra al pie (total + Revisar): dos barras
  // apiladas tapaban el contenido y se leían como una sola.
  if (pathname?.startsWith("/cotizar")) return null;
  // /reservar y /pagar tienen su barra fija (total + acción): misma razón.
  if (esRutaCheckout(pathname)) return null;

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-linea bg-card lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto grid max-w-md grid-cols-5 items-stretch">
        {IZQUIERDA.map(pestana)}
        <li>
          <Link
            href={COTIZAR.href}
            aria-current={cotizarActiva ? "page" : undefined}
            className="flex h-full min-h-16 flex-col items-center justify-end gap-1 pb-2 text-xs leading-none"
          >
            <span className="-mt-6 flex h-14 w-14 items-center justify-center rounded-control bg-coral-bright text-btn-ink shadow-chrome ring-4 ring-card transition-transform duration-150 ease-salida active:scale-95">
              <Icono nombre="cotizar" tamano={26} />
            </span>
            <span className={cotizarActiva ? "font-bold text-acento" : "font-semibold text-ink"}>{COTIZAR.label}</span>
          </Link>
        </li>
        {DERECHA.map(pestana)}
      </ul>
    </nav>
  );
}
