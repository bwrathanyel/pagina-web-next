"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WhatsAppLeadButton } from "@/components/leads/WhatsAppLeadButton";
import { HeaderControls } from "@/components/layout/HeaderControls";
import { BrandMark } from "@/components/layout/BrandMark";
import { Wordmark } from "@/components/layout/Wordmark";
import { ThemeSwitch } from "@/components/ui/ThemeSwitch";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { CurrencySwitch } from "@/components/ui/CurrencySwitch";
import { IconoNav } from "@/components/layout/IconosNav";
import { useHeaderAutoHide } from "@/lib/layout/useHeaderAutoHide";
import { useSiteContent } from "@/components/providers/SiteContentProvider";

function WhatsAppIconNav() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20zm4.4-5.9c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.6.1s-.7.8-.8.9-.3.2-.5.1a6.6 6.6 0 0 1-1.9-1.2 7 7 0 0 1-1.3-1.6c-.1-.2 0-.4.1-.5l.4-.4.2-.4v-.4c-.1-.1-.6-1.4-.8-1.9s-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2c0 1.3.9 2.6 1.1 2.8s1.7 2.7 4.1 3.7a5.6 5.6 0 0 0 2.4.6c.9 0 1.5-.4 1.7-.7a1.4 1.4 0 0 0 .1-.9c-.1-.1-.2-.2-.5-.3z" />
    </svg>
  );
}

// "Paquetes" sale de la barra (pasada 3, pedido del dueño) pero la categoría
// sigue viva en /catalogo/paquetes -- solo se oculta del header, igual que
// antes se agrupaba por id bajo "Más" en vez de tocar site-content (el editor
// de contenido no tiene UI para eso todavía).
const IDS_OCULTOS_HEADER = new Set(["paquetes"]);

// Labels cortos solo para el header (pasada 3): el label largo se conserva en
// site-content para el BottomTabBar y el editor de contenido del admin.
const LABEL_HEADER: Record<string, string> = {
  empleo: "Únete",
  "ia-negocio": "IA para empresas",
};

export function Navbar() {
  const pathname = usePathname();
  const { content } = useSiteContent();
  const itemsPrincipales = content.navigation.items.filter(
    (item) => item.visible && !IDS_OCULTOS_HEADER.has(item.id),
  );
  const { visible, propsContenedor } = useHeaderAutoHide();

  const esActiva = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  // El pill (logo+wordmark+campana+carrito) solo tiene sentido en Home dentro
  // del diseño mobile "app-like": el resto de pantallas tiene su propio header.
  // En desktop (lg+) se mantiene en TODAS las rutas como hasta ahora.
  const esHome = pathname === "/";

  return (
    <header
      {...propsContenedor}
      className={
        "sticky top-0 z-30 px-4 pt-4 transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none " +
        // El auto-hide por inactividad es un patrón móvil (pedido del dueño
        // 2026-07-26); en desktop el header queda siempre sólido y estable --
        // "lg:translate-y-0 lg:opacity-100 lg:pointer-events-auto" pisa el
        // estado oculto a partir de lg sin tocar el hook.
        (visible ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-3 opacity-0") +
        " lg:pointer-events-auto lg:translate-y-0 lg:opacity-100 " +
        (esHome ? "" : "hidden lg:block")
      }
    >
      <div className="mx-auto flex max-w-[var(--ancho-contenido)] flex-nowrap items-center justify-between gap-2 rounded-full border border-linea bg-card/95 px-3 py-1.5 shadow-chrome backdrop-blur-xl sm:gap-4 sm:px-4 sm:py-2 lg:px-5 lg:py-2 xl:px-6 xl:py-2.5">
        <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2.5">
          <BrandMark priority />
          <Wordmark />
        </Link>

        <nav aria-label="Catálogo" className="hidden min-w-0 items-center lg:flex lg:gap-2 xl:gap-3 2xl:gap-6">
          {itemsPrincipales.map(({ id, href, label }) => (
            <Link
              key={id}
              href={href}
              aria-current={esActiva(href) ? "page" : undefined}
              className={
                "group relative flex items-center gap-1.5 whitespace-nowrap py-2 font-body text-sm transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:bg-coral after:transition-transform " +
                (esActiva(href)
                  ? "text-ink after:scale-x-100"
                  : "text-ink-soft after:scale-x-0 hover:text-ink hover:after:scale-x-100")
              }
            >
              <IconoNav id={id} className="hidden xl:block" activo={esActiva(href)} />
              {LABEL_HEADER[id] ?? label}
            </Link>
          ))}

          <Link
            href={content.navigation.quoteHref}
            aria-current={esActiva(content.navigation.quoteHref) ? "page" : undefined}
            className="hidden shrink-0 whitespace-nowrap font-body text-sm font-semibold text-ink hover:text-coral xl:inline"
          >
            {content.navigation.quoteLabel}
          </Link>
          <WhatsAppLeadButton
            mensajeBase="Hola! Vengo de su página web."
            triggerClassName="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-coral text-white lg:h-11 lg:w-11 xl:w-auto xl:px-5 xl:text-sm xl:font-semibold"
          >
            <WhatsAppIconNav />
            <span className="hidden xl:inline">{content.navigation.whatsappLabel}</span>
          </WhatsAppLeadButton>
          <div className="flex shrink-0 items-center gap-3 border-l border-linea pl-4 ml-1">
            <CurrencySwitch className="hidden xl:block" />
            <ThemeSwitch />
            <HeaderControls />
          </div>
        </nav>

        {/* Mobile: sin menú hamburguesa -- el BottomTabBar ya cubre la
            navegación principal (Inicio/Promos/Cotizar/Cuenta/Trabaja/IA
            Negocio), tener los dos duplicaba navegación y no pegaba con el
            diseño app (hallazgo real, feedback del dueño 2026-07-23). Buscar
            se sacó del tab bar el 2026-08-11 -- vive inline en Home y Promos.
            Campana y cuenta se sacaron de acá en el rediseño 2026-08-14: la
            campana pasó al FAB (ContactoFab, que es de donde salen sus
            notificaciones) y cuenta ya está en el bottom tab -- el cluster
            derecho ocupaba ~250px de un viewport de 360px y aplastaba el
            wordmark. */}
        <div className="flex items-center gap-1.5 lg:hidden">
          <CurrencySwitch />
          <ThemeToggle compacto />
          <HeaderControls soloCarrito />
        </div>
      </div>
    </header>
  );
}
