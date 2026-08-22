"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { WhatsAppLeadButton } from "@/components/leads/WhatsAppLeadButton";
import { HeaderControls } from "@/components/layout/HeaderControls";
import { BrandMark } from "@/components/layout/BrandMark";
import { Wordmark } from "@/components/layout/Wordmark";
import { ThemeSwitch } from "@/components/ui/ThemeSwitch";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { CurrencySwitch } from "@/components/ui/CurrencySwitch";
import { useHeaderAutoHide } from "@/lib/layout/useHeaderAutoHide";
import { useSiteContent } from "@/components/providers/SiteContentProvider";

// Ítems que se agrupan bajo "Más" en el pill para que quepan sin solaparse
// (auditoría redesign desktop 2026-08-22: 7 ítems + Cotizar + WhatsApp + 3
// controles no entraban en max-w-6xl y "Promociones" quedaba encimado sobre
// el wordmark). No se movió a `site-content` porque el editor de contenido
// no tiene UI para agrupar todavía -- agrupar por id acá es reversible sin
// tocar el esquema.
const IDS_MENU_MAS = new Set(["empleo", "ia-negocio"]);

export function Navbar() {
  const pathname = usePathname();
  const { content } = useSiteContent();
  const navItems = content.navigation.items.filter((item) => item.visible);
  const itemsPrincipales = navItems.filter((item) => !IDS_MENU_MAS.has(item.id));
  const itemsMas = navItems.filter((item) => IDS_MENU_MAS.has(item.id));
  const { visible, propsContenedor } = useHeaderAutoHide();
  const [masAbierto, setMasAbierto] = useState(false);

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

        <nav aria-label="Catálogo" className="hidden min-w-0 items-center lg:flex lg:gap-3 xl:gap-6">
          {itemsPrincipales.map(({ id, href, label }) => (
            <Link
              key={id}
              href={href}
              aria-current={esActiva(href) ? "page" : undefined}
              className={
                "relative whitespace-nowrap py-2 font-body text-sm transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:bg-coral after:transition-transform " +
                (esActiva(href)
                  ? "text-ink after:scale-x-100"
                  : "text-ink-soft after:scale-x-0 hover:text-ink hover:after:scale-x-100")
              }
            >
              {label}
            </Link>
          ))}

          {itemsMas.length > 0 ? (
            <div
              className="relative shrink-0"
              onMouseEnter={() => setMasAbierto(true)}
              onMouseLeave={() => setMasAbierto(false)}
            >
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={masAbierto}
                onClick={() => setMasAbierto((v) => !v)}
                className={
                  "flex items-center gap-1 whitespace-nowrap py-2 font-body text-sm transition-colors " +
                  (itemsMas.some((i) => esActiva(i.href)) ? "text-ink" : "text-ink-soft hover:text-ink")
                }
              >
                Más
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {masAbierto ? (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-10 mt-2 w-56 overflow-hidden rounded-2xl border border-linea bg-card shadow-lift"
                >
                  {itemsMas.map(({ id, href, label }) => (
                    <Link
                      key={id}
                      href={href}
                      role="menuitem"
                      className={
                        "block px-4 py-3 text-sm transition-colors " +
                        (esActiva(href) ? "bg-sand-2 text-ink" : "text-ink-soft hover:bg-sand-2 hover:text-ink")
                      }
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          <Link
            href={content.navigation.quoteHref}
            aria-current={esActiva(content.navigation.quoteHref) ? "page" : undefined}
            className="shrink-0 whitespace-nowrap font-body text-sm font-semibold text-ink hover:text-coral"
          >
            {content.navigation.quoteLabel}
          </Link>
          <WhatsAppLeadButton
            mensajeBase="Hola! Vengo de su página web."
            triggerClassName="inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-full bg-coral px-5 text-sm font-semibold text-white"
          >
            {content.navigation.whatsappLabel}
          </WhatsAppLeadButton>
          <div className="flex shrink-0 items-center gap-3 border-l border-linea pl-4 ml-1">
            <CurrencySwitch />
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
