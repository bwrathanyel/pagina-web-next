"use client";

import Link from "next/link";
import { Hoja } from "@/components/ui/Hoja";
import { Icono } from "@/components/ui/Icono";
import { PreferenciasControles } from "@/components/layout/PreferenciasControles";
import { useSiteContent } from "@/components/providers/SiteContentProvider";

// Hot Sales ya es la pestaña "Promos" de la barra inferior. El resto de las
// entradas de navegación salen del contenido editable, así el admin sigue
// mandando sobre los nombres.
const IDS_EN_BARRA = new Set(["hot-sales"]);

/** Hoja "Más" del móvil: lo que no cabe en las cinco pestañas. La abre el botón
 * de menú de la barra superior (Navbar). */
export function HojaMas({ abierta, onCerrar }: { abierta: boolean; onCerrar: () => void }) {
  const { content } = useSiteContent();
  const items = content.navigation.items.filter((item) => item.visible && !IDS_EN_BARRA.has(item.id));

  return (
    <Hoja abierta={abierta} onCerrar={onCerrar} titulo="Más">
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
