"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CATEGORIAS } from "@/types/supabase";
import { whatsappHref } from "@/lib/whatsapp";
import { HeaderControls } from "@/components/layout/HeaderControls";

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-dusk">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <Image src="/logo-lotus360.png" alt="Lotus 360" width={36} height={36} priority />
          <span className="font-display text-lg font-bold text-dusk-text">Lotus 360</span>
        </Link>

        <nav aria-label="Catálogo" className="hidden items-center gap-5 md:flex">
          {CATEGORIAS.map(({ slug, label }) => (
            <Link
              key={slug}
              href={`/catalogo/${slug}`}
              className="font-body text-sm text-dusk-text-soft hover:text-dusk-text"
            >
              {label}
            </Link>
          ))}
          <Link
            href="/cotizador-personalizado"
            className="font-body text-sm text-dusk-text-soft hover:text-dusk-text"
          >
            Cotizador Personalizado
          </Link>
          <a
            href={whatsappHref("Hola! Vengo de su página web.")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center rounded-full bg-gradient-to-br from-coral to-gold px-4 text-sm font-semibold text-btn-ink"
          >
            WhatsApp
          </a>
          <HeaderControls />
        </nav>

        <div className="flex items-center md:hidden">
          <HeaderControls />
          <button
          type="button"
          className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-dusk-text md:hidden"
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
          className="flex flex-col gap-1 border-t border-dusk-text/10 px-5 pb-4 md:hidden"
        >
          {CATEGORIAS.map(({ slug, label }) => (
            <Link
              key={slug}
              href={`/catalogo/${slug}`}
              onClick={() => setOpen(false)}
              className="flex min-h-11 items-center font-body text-dusk-text"
            >
              {label}
            </Link>
          ))}
          <Link
            href="/cotizador-personalizado"
            onClick={() => setOpen(false)}
            className="flex min-h-11 items-center font-body text-dusk-text"
          >
            Cotizador Personalizado
          </Link>
          <a
            href={whatsappHref("Hola! Vengo de su página web.")}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex min-h-11 items-center justify-center rounded-full bg-gradient-to-br from-coral to-gold px-4 text-sm font-semibold text-btn-ink"
          >
            Escríbenos por WhatsApp
          </a>
        </nav>
      ) : null}
    </header>
  );
}
