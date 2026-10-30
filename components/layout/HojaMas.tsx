"use client";

import { useEffect, useEffectEvent, useSyncExternalStore } from "react";
import Link from "next/link";
import { Hoja } from "@/components/ui/Hoja";
import { Icono } from "@/components/ui/Icono";
import { PreferenciasControles } from "@/components/layout/PreferenciasControles";
import { useSiteContent } from "@/components/providers/SiteContentProvider";
import { itemMenuPublico } from "@/lib/catalogo/ocultas";

// Hot Sales ya es la pestaña "Promos" de la barra inferior. El resto de las
// entradas de navegación salen del contenido editable, así el admin sigue
// mandando sobre los nombres.
const IDS_EN_BARRA = new Set(["hot-sales"]);

// Mismo corte que el resto del header: desde lg no hay hoja "Más".
const MQ_MOVIL = "(max-width: 63.99rem)";
const suscribirMq = (cb: () => void) => {
  const mq = window.matchMedia(MQ_MOVIL);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const leerMovil = () => window.matchMedia(MQ_MOVIL).matches;

// Deslizar desde el borde derecho hacia la izquierda abre la hoja. Solo cuenta
// si el dedo arranca pegado al borde, para no robarle el gesto a los carruseles.
const BORDE_PX = 24;
const RECORRIDO_PX = 40;

function useDeslizarDesdeDerecha(abrir: () => void, activo: boolean) {
  const alAbrir = useEffectEvent(abrir);
  useEffect(() => {
    if (!activo) return;
    let inicio: { x: number; y: number } | null = null;
    const alTocar = (e: TouchEvent) => {
      const t = e.touches[0];
      const libre = document.documentElement.style.overflow !== "hidden";
      inicio = e.touches.length === 1 && libre && t.clientX >= window.innerWidth - BORDE_PX ? { x: t.clientX, y: t.clientY } : null;
    };
    const alMover = (e: TouchEvent) => {
      if (!inicio) return;
      const t = e.touches[0];
      const dx = inicio.x - t.clientX;
      if (Math.abs(t.clientY - inicio.y) > Math.max(dx, 20)) inicio = null;
      else if (dx > RECORRIDO_PX) {
        inicio = null;
        alAbrir();
      }
    };
    const soltar = () => { inicio = null; };
    document.addEventListener("touchstart", alTocar, { passive: true });
    document.addEventListener("touchmove", alMover, { passive: true });
    document.addEventListener("touchend", soltar);
    document.addEventListener("touchcancel", soltar);
    return () => {
      document.removeEventListener("touchstart", alTocar);
      document.removeEventListener("touchmove", alMover);
      document.removeEventListener("touchend", soltar);
      document.removeEventListener("touchcancel", soltar);
    };
  }, [activo]);
}

/** Hoja "Más" del móvil: lo que no cabe en las cinco pestañas. Sale por la
 * derecha; la abre el botón de menú de la barra superior (Navbar) o deslizar
 * desde el borde derecho. */
export function HojaMas({ abierta, onAbrir, onCerrar }: { abierta: boolean; onAbrir: () => void; onCerrar: () => void }) {
  const { content } = useSiteContent();
  const items = content.navigation.items.filter((item) => itemMenuPublico(item) && !IDS_EN_BARRA.has(item.id));
  const esMovil = useSyncExternalStore(suscribirMq, leerMovil, () => false);
  useDeslizarDesdeDerecha(onAbrir, esMovil && !abierta);

  return (
    <Hoja abierta={abierta} onCerrar={onCerrar} titulo="Más" movil="lateral">
      <nav aria-label="Más secciones">
        <ul>
          {items.map(({ id, href, label }) => (
            <li key={id} className="border-b border-linea last:border-b-0">
              <Link
                href={href}
                onClick={onCerrar}
                className="flex min-h-14 items-center justify-between gap-3 text-lg font-semibold text-ink"
              >
                {label}
                <Icono nombre="flecha-der" className="text-ink-soft" />
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-4 border-t border-linea pt-4">
        <PreferenciasControles />
      </div>
    </Hoja>
  );
}
