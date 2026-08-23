"use client";

import { Children } from "react";
import { Carrusel } from "@/components/ui/Carrusel";

/** Carrusel horizontal en vez de grid (pedido 2026-08-22): antes bajaba a
 * una 2ª fila con más de 4 tarjetas, ahora nunca envuelve -- scroll
 * horizontal con flechas a los costados (mismo patrón que Hot Sales /
 * Más de Lotus 360 en `components/ui/Carrusel.tsx`), pero sin la prop
 * `desktop` porque acá se quiere horizontal en TODOS los tamaños, no solo
 * mobile. TicketCard achica su botón principal a solo ícono por debajo de
 * `sm` para tolerar el ancho angosto de la tarjeta (rediseño 2026-08-14). */
export function CatalogoGrid({ children }: { children: React.ReactNode }) {
  return (
    <Carrusel
      items={Children.toArray(children)}
      anchoItem="46%"
      maxItem="330px"
      gap="gap-3 sm:gap-6"
      flechas
    />
  );
}
