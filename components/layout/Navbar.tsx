"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { WhatsAppLeadButton } from "@/components/leads/WhatsAppLeadButton";
import { HeaderControls } from "@/components/layout/HeaderControls";
import { BrandMark } from "@/components/layout/BrandMark";
import { useSiteContent } from "@/components/providers/SiteContentProvider";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { content } = useSiteContent();
  const navItems = content.navigation.items.filter((item) => item.visible);

  const esActiva = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-30 px-4 pt-4">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 rounded-full border border-ink/10 bg-card/90 px-3 py-2 shadow-[0_12px_35px_rgba(36,31,26,.10)] backdrop-blur-xl sm:gap-4 sm:px-4 lg:px-5">
        <Link href="/" className="flex min-w-0 items-center gap-2.5" onClick={() => setOpen(false)}>
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
          <HeaderControls />
        </nav>

        <div className="flex items-center lg:hidden">
          <HeaderControls />
          <button
            type="button"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-ink lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setOpen((v) => !v)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              {open ? (
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open ? (
        <nav
          id="mobile-menu"
          aria-label="Catálogo"
          className="mx-auto mt-2 flex max-w-6xl flex-col gap-1 rounded-[28px] border border-ink/10 bg-card px-5 py-4 shadow-xl lg:hidden"
        >
          {navItems.map(({ id, href, label }) => (
            <Link
              key={id}
              href={href}
              onClick={() => setOpen(false)}
              aria-current={esActiva(href) ? "page" : undefined}
              className={
                "flex min-h-12 items-center justify-between border-b border-ink/8 font-body " +
                (esActiva(href) ? "font-semibold text-coral" : "text-ink")
              }
            >
              {label}
              <span aria-hidden="true">↗</span>
            </Link>
          ))}
          <Link
            href={content.navigation.quoteHref}
            onClick={() => setOpen(false)}
            className="flex min-h-12 items-center justify-between border-b border-ink/8 font-semibold text-ink"
          >
            {content.navigation.quoteLabel} <span aria-hidden="true">↗</span>
          </Link>
          <WhatsAppLeadButton
            mensajeBase="Hola! Vengo de su página web."
            triggerClassName="mt-2 inline-flex min-h-11 items-center justify-center rounded-full bg-coral px-4 text-sm font-semibold text-white"
          >
            {content.navigation.whatsappLabel}
          </WhatsAppLeadButton>
        </nav>
      ) : null}
    </header>
  );
}
