"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WhatsAppLeadButton } from "@/components/leads/WhatsAppLeadButton";
import { HeaderControls } from "@/components/layout/HeaderControls";
import { BrandMark } from "@/components/layout/BrandMark";
import { ThemeSwitch } from "@/components/ui/ThemeSwitch";
import { useHeaderAutoHide } from "@/lib/layout/useHeaderAutoHide";
import { useSiteContent } from "@/components/providers/SiteContentProvider";

export function Navbar() {
  const pathname = usePathname();
  const { content } = useSiteContent();
  const navItems = content.navigation.items.filter((item) => item.visible);
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
        // Oculto: además de desvanecerse se sube un poco y deja de recibir
        // clics, si no seguiría tapando el contenido de abajo aunque no se vea.
        (visible ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-3 opacity-0") +
        " " +
        (esHome ? "" : "hidden lg:block")
      }
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 rounded-full border border-ink/10 bg-card/90 px-3 py-2 shadow-[0_12px_35px_rgba(36,31,26,.10)] backdrop-blur-xl sm:gap-4 sm:px-4 lg:px-5">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <BrandMark priority />
          <span className="max-w-[7rem] text-balance font-display text-[0.68rem] font-bold leading-[0.98] text-ink sm:max-w-[11.5rem] sm:text-base sm:leading-[1.05] lg:text-lg">
            {content.brand.name}
          </span>
        </Link>

        <nav aria-label="Catálogo" className="hidden items-center gap-5 lg:flex">
          {navItems.map(({ id, href, label }) => (
            <Link
              key={id}
              href={href}
              aria-current={esActiva(href) ? "page" : undefined}
              className={
                "relative py-2 font-body text-sm transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:bg-coral after:transition-transform " +
                (esActiva(href)
                  ? "text-ink after:scale-x-100"
                  : "text-ink-soft after:scale-x-0 hover:text-ink hover:after:scale-x-100")
              }
            >
              {label}
            </Link>
          ))}
          <Link
            href={content.navigation.quoteHref}
            aria-current={esActiva(content.navigation.quoteHref) ? "page" : undefined}
            className="font-body text-sm font-semibold text-ink hover:text-coral"
          >
            {content.navigation.quoteLabel}
          </Link>
          <WhatsAppLeadButton
            mensajeBase="Hola! Vengo de su página web."
            triggerClassName="inline-flex min-h-11 items-center rounded-full bg-coral px-5 text-sm font-semibold text-white"
          >
            {content.navigation.whatsappLabel}
          </WhatsAppLeadButton>
          <ThemeSwitch />
          <HeaderControls />
        </nav>

        {/* Mobile: sin menú hamburguesa -- el BottomTabBar ya cubre la
            navegación principal (Inicio/Buscar/Promos/Cotizar/Cuenta), tener
            los dos duplicaba navegación y no pegaba con el diseño app
            (hallazgo real, feedback del dueño 2026-07-23). */}
        <div className="flex items-center gap-1.5 lg:hidden">
          <ThemeSwitch />
          <HeaderControls />
        </div>
      </div>
    </header>
  );
}
