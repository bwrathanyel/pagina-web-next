"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { WhatsAppLeadButton } from "@/components/leads/WhatsAppLeadButton";
import { HeaderControls } from "@/components/layout/HeaderControls";
import { HojaMas } from "@/components/layout/HojaMas";
import { BOTON_ICONO } from "@/components/layout/botonIcono";
import { BrandMark } from "@/components/layout/BrandMark";
import { Wordmark } from "@/components/layout/Wordmark";
import { Icono } from "@/components/ui/Icono";
import { SelectorTema } from "@/components/ui/SelectorTema";
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

// Rutas con su propia barra sticky arriba (propuesta de cliente con otra
// paleta, fuera del rediseño): en el móvil la barra del sitio no se pega, para
// no pelear el mismo `top-0`.
const RUTAS_CON_BARRA_PROPIA = ["/ia-para-tu-negocio"];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { content } = useSiteContent();
  const [masAbierta, setMasAbierta] = useState(false);
  const itemsPrincipales = content.navigation.items.filter(
    (item) => item.visible && !IDS_OCULTOS_HEADER.has(item.id),
  );
  const { visible, propsContenedor } = useHeaderAutoHide();

  const esActiva = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  // Indicador deslizante que reemplaza los after: independientes de cada
  // ítem: sigue al hover y vuelve al ítem activo al salir. Arranca invisible
  // hasta la primera medición real para no flashear en la esquina izquierda
  // antes de hidratar.
  const [indicador, setIndicador] = useState({ left: 0, width: 0, visible: false });
  const navElRef = useRef<HTMLElement | null>(null);
  const roRef = useRef<ResizeObserver | null>(null);

  function medirYSetear(el: Element | null) {
    const navEl = navElRef.current;
    if (!el || !navEl) return;
    const navRect = navEl.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    setIndicador({ left: elRect.left - navRect.left, width: elRect.width, visible: true });
  }

  function medirActivo() {
    medirYSetear(navElRef.current?.querySelector('[aria-current="page"]') ?? null);
  }

  // Callback ref: no depende de itemsPrincipales/pathname (busca el activo
  // por [aria-current] en el DOM), así que arranca una sola vez -- evita
  // reconectar el ResizeObserver en cada render.
  const setNavRef = useCallback((node: HTMLElement | null) => {
    navElRef.current = node;
    roRef.current?.disconnect();
    if (!node) return;
    medirActivo();
    const ro = new ResizeObserver(() => medirActivo());
    ro.observe(node);
    roRef.current = ro;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // El cambio de ruta no dispara setState directo en el cuerpo del efecto
  // (react-hooks/set-state-in-effect es error acá): la medición corre dentro
  // del callback de requestAnimationFrame, no en el efecto mismo.
  useEffect(() => {
    const raf = requestAnimationFrame(() => medirActivo());
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const esHome = pathname === "/";
  const barraPropia = RUTAS_CON_BARRA_PROPIA.some((r) => pathname === r || pathname.startsWith(`${r}/`));

  // Sin historial propio (llegó desde una red social a esta página) "atrás"
  // llevaría fuera del sitio o no haría nada: en ese caso va al inicio.
  function volver() {
    if (window.history.length > 1) router.back();
    else router.push("/");
  }

  return (
    <header
      {...propsContenedor}
      className={
        (barraPropia ? "lg:sticky " : "sticky ") +
        "top-0 z-30 transition-[opacity,transform] duration-500 ease-out lg:px-4 lg:pt-4 " +
        // El auto-hide por inactividad es un patrón móvil (pedido del dueño
        // 2026-07-26); en desktop el header queda siempre sólido y estable --
        // "lg:translate-y-0 lg:opacity-100 lg:pointer-events-auto" pisa el
        // estado oculto a partir de lg sin tocar el hook.
        (visible ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-3 opacity-0") +
        " lg:pointer-events-auto lg:translate-y-0 lg:opacity-100"
      }
    >
      {/* Móvil: barra compacta en todas las rutas. En Home, marca completa; en
          el resto, atrás + símbolo. Buscar y carrito a la derecha, y "Más"
          para lo que no cabe en las pestañas de abajo. */}
      <div className="flex h-14 items-center gap-1 border-b border-linea bg-card pl-2 pr-1 lg:hidden">
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

      <div className="mx-auto hidden max-w-[var(--ancho-contenido)] flex-nowrap items-center justify-between gap-4 rounded-full border border-linea bg-card/95 px-5 py-2 shadow-chrome backdrop-blur-xl lg:flex xl:px-6 xl:py-2.5">
        <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2.5">
          <BrandMark priority />
          <Wordmark />
        </Link>

        <nav
          ref={setNavRef}
          aria-label="Catálogo"
          onPointerLeave={() => medirActivo()}
          className="relative hidden min-w-0 items-center lg:flex lg:gap-2 xl:gap-3 2xl:gap-6"
        >
          <span
            aria-hidden="true"
            className={
              "pointer-events-none absolute bottom-0 h-px bg-coral transition-[left,width] duration-[250ms] ease-out " +
              (indicador.visible ? "opacity-100" : "opacity-0")
            }
            style={{ left: indicador.left, width: indicador.width }}
          />
          {itemsPrincipales.map(({ id, href, label }) => (
            <Link
              key={id}
              href={href}
              aria-current={esActiva(href) ? "page" : undefined}
              onPointerEnter={(e) => medirYSetear(e.currentTarget)}
              onFocus={(e) => medirYSetear(e.currentTarget)}
              className={
                "group relative flex items-center gap-1.5 whitespace-nowrap py-2 font-body text-sm transition-colors " +
                (esActiva(href) ? "text-ink" : "text-ink-soft hover:text-ink")
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
            <SelectorTema compacto />
            <HeaderControls />
          </div>
        </nav>

      </div>
    </header>
  );
}
