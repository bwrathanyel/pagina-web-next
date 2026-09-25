"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { m } from "motion/react";
import { WhatsAppLeadButton } from "@/components/leads/WhatsAppLeadButton";
import { HeaderControls } from "@/components/layout/HeaderControls";
import { HojaMas } from "@/components/layout/HojaMas";
import { PreferenciasPopover } from "@/components/layout/PreferenciasPopover";
import { BOTON_ICONO } from "@/components/layout/botonIcono";
import { BrandMark } from "@/components/layout/BrandMark";
import { Wordmark } from "@/components/layout/Wordmark";
import { Icono } from "@/components/ui/Icono";
import { useHeaderAutoHide } from "@/lib/layout/useHeaderAutoHide";
import { useBarraSobreFoto } from "@/lib/layout/barraSobreFoto";
import { usePaneles } from "@/lib/layout/paneles";
import { useSiteContent } from "@/components/providers/SiteContentProvider";

function WhatsAppIconNav() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20zm4.4-5.9c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.6.1s-.7.8-.8.9-.3.2-.5.1a6.6 6.6 0 0 1-1.9-1.2 7 7 0 0 1-1.3-1.6c-.1-.2 0-.4.1-.5l.4-.4.2-.4v-.4c-.1-.1-.6-1.4-.8-1.9s-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2c0 1.3.9 2.6 1.1 2.8s1.7 2.7 4.1 3.7a5.6 5.6 0 0 0 2.4.6c.9 0 1.5-.4 1.7-.7a1.4 1.4 0 0 0 .1-.9c-.1-.1-.2-.2-.5-.3z" />
    </svg>
  );
}

// Empleo e "IA para su negocio" no son categorías del catálogo: viven en el
// footer y en la hoja "Más". Todo lo demás que el admin deja visible en el
// contenido editable entra en la fila de categorías.
const IDS_FUERA_DE_FILA = new Set(["empleo", "ia-negocio"]);

// Rutas con su propia barra sticky arriba (propuesta de cliente con otra
// paleta, fuera del rediseño): en el móvil la barra del sitio no se pega, para
// no pelear el mismo `top-0`.
const RUTAS_CON_BARRA_PROPIA = ["/ia-para-tu-negocio"];

// Fondo de cada fila de la barra según haya o no un hero detrás. La clase
// `barra-sobre-foto` (tinta clara) va aparte, en lo que se pinta encima: el
// campo de búsqueda queda fuera porque es un campo sobre card.
const FONDO_TRANSPARENTE = "border-transparent bg-transparent";
const FONDO_SOLIDO = "border-linea bg-sand";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { content } = useSiteContent();
  const [masAbierta, setMasAbierta] = useState(false);
  const [prefAbiertas, setPrefAbiertas] = useState(false);
  const prefRef = useRef<HTMLButtonElement>(null);
  const abrirBuscador = usePaneles((s) => s.abrirBuscador);
  const sobreFoto = useBarraSobreFoto((s) => s.sobreFoto);
  const categorias = content.navigation.items.filter((item) => item.visible && !IDS_FUERA_DE_FILA.has(item.id));
  const { visible, propsContenedor } = useHeaderAutoHide();

  const esActiva = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const esHome = pathname === "/";
  const barraPropia = RUTAS_CON_BARRA_PROPIA.some((r) => pathname === r || pathname.startsWith(`${r}/`));
  // Transparente solo mientras el hero (que avisa vía useHeroBajoBarra) sigue
  // detrás de la barra; en cualquier otra ruta, sólida.
  const transparente = esHome && sobreFoto;
  const fondo = transparente ? FONDO_TRANSPARENTE : FONDO_SOLIDO;
  const grupoSobreFoto = transparente ? "barra-sobre-foto" : "";

  // Sin historial propio (llegó desde una red social a esta página) "atrás"
  // llevaría fuera del sitio o no haría nada: en ese caso va al inicio.
  function volver() {
    if (window.history.length > 1) router.back();
    else router.push("/");
  }

  return (
    <>
      <header
        {...propsContenedor}
        className={
          (barraPropia ? "lg:sticky " : "sticky ") +
          "top-0 z-30 transition-[opacity,transform] duration-500 ease-out " +
          // El auto-hide por inactividad es un patrón móvil (pedido del dueño
          // 2026-07-26); en desktop la barra queda siempre a la vista --
          // "lg:translate-y-0 lg:opacity-100 lg:pointer-events-auto" pisa el
          // estado oculto a partir de lg sin tocar el hook.
          (visible ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-3 opacity-0") +
          " lg:pointer-events-auto lg:translate-y-0 lg:opacity-100"
        }
      >
        {/* Móvil: barra compacta en todas las rutas. En Home, marca completa; en
            el resto, atrás + símbolo. Buscar y carrito a la derecha, y "Más"
            para lo que no cabe en las pestañas de abajo. */}
        <div
          className={
            "flex h-14 items-center gap-1 border-b pl-2 pr-1 transition-colors duration-(--dur-media) lg:hidden " +
            fondo +
            " " +
            grupoSobreFoto
          }
        >
          {esHome ? null : (
            <button type="button" onClick={volver} aria-label="Volver" className={BOTON_ICONO}>
              <Icono nombre="flecha-izq" />
            </button>
          )}
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <BrandMark size="sm" priority={esHome} />
            {esHome ? <Wordmark /> : null}
          </Link>
          <div className="ml-auto flex items-center">
            <HeaderControls compacto />
            <button
              type="button"
              onClick={() => setMasAbierta(true)}
              aria-label="Más opciones"
              aria-haspopup="dialog"
              className={BOTON_ICONO}
            >
              <Icono nombre="menu" />
            </button>
          </div>
        </div>
        <HojaMas abierta={masAbierta} onCerrar={() => setMasAbierta(false)} />

        {/* Escritorio, fila 1: logo · campo de búsqueda · acciones. Nada de
            anchos fijos: el campo es el único que se estira y se encoge
            (min-w-0), y las etiquetas aparecen por breakpoint. */}
        <div
          className={"hidden h-16 border-b transition-colors duration-(--dur-media) lg:block " + fondo}
        >
          <div className="mx-auto flex h-full max-w-[var(--ancho-contenido)] items-center gap-4 px-5 xl:gap-8">
            <Link href="/" className={"flex shrink-0 items-center gap-2.5 " + grupoSobreFoto}>
              <BrandMark priority />
              <Wordmark />
            </Link>

            <button
              type="button"
              onClick={abrirBuscador}
              aria-keyshortcuts="Control+K Meta+K"
              title="Buscar (Ctrl K)"
              className="mx-auto flex h-11 min-w-0 max-w-xl flex-1 items-center gap-3 rounded-pill border border-linea bg-card px-4 text-left text-base text-ink-soft transition-colors duration-(--dur-rapida) hover:border-linea-fuerte hover:text-ink"
            >
              <Icono nombre="buscar" tamano={18} className="shrink-0 text-ink" />
              <span className="truncate">¿A dónde quiere viajar?</span>
            </button>

            <div className={"flex shrink-0 items-center gap-1 " + grupoSobreFoto}>
              <Link
                href={content.navigation.quoteHref}
                aria-current={esActiva(content.navigation.quoteHref) ? "page" : undefined}
                className="flex h-11 items-center whitespace-nowrap rounded-pill px-3 text-base font-semibold text-ink underline-offset-4 hover:underline"
              >
                {content.navigation.quoteLabel}
              </Link>
              <WhatsAppLeadButton
                mensajeBase="Hola! Vengo de su página web."
                triggerClassName="inline-flex h-11 w-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-pill bg-coral text-white xl:w-auto xl:px-4 xl:text-base xl:font-semibold"
              >
                <WhatsAppIconNav />
                <span className="hidden xl:inline">{content.navigation.whatsappLabel}</span>
              </WhatsAppLeadButton>
              <HeaderControls />
              <button
                ref={prefRef}
                type="button"
                onClick={() => setPrefAbiertas((v) => !v)}
                aria-label="Preferencias de moneda y tema"
                aria-haspopup="dialog"
                aria-expanded={prefAbiertas}
                className={BOTON_ICONO}
              >
                <Icono nombre="ajustes" />
              </button>
              {prefAbiertas ? (
                <PreferenciasPopover onCerrar={() => setPrefAbiertas(false)} anclaRef={prefRef} />
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {/* Escritorio, fila 2: categorías. Fuera del <header> sticky a propósito:
          se va con el scroll y solo la fila 1 queda pegada. Así la barra no
          cambia de alto mientras se lee (no hay salto de contenido) y las
          filas pegadas del catálogo quedan justo bajo la fila 1. */}
      <nav
        aria-label="Categorías"
        className={
          "relative z-20 hidden h-11 border-b transition-colors duration-(--dur-media) lg:block " +
          fondo +
          " " +
          grupoSobreFoto
        }
      >
        <div className="mx-auto flex h-full max-w-[var(--ancho-contenido)] items-stretch gap-6 px-5 xl:gap-8">
          {categorias.map(({ id, href, label }) => {
            const activa = esActiva(href);
            return (
              <Link
                key={id}
                href={href}
                aria-current={activa ? "page" : undefined}
                className={
                  "relative flex items-center whitespace-nowrap text-base font-semibold transition-colors duration-(--dur-rapida) " +
                  (activa ? "text-ink" : "text-ink-soft hover:text-ink")
                }
              >
                {label}
                {activa ? (
                  <m.span
                    layoutId="categoria-activa"
                    aria-hidden="true"
                    transition={{ type: "spring", stiffness: 500, damping: 38 }}
                    className="franja-marca absolute inset-x-0 bottom-0 h-0.5 rounded-pill"
                  />
                ) : null}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
