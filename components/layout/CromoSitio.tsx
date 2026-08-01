"use client";

import { usePathname } from "next/navigation";

/* Rutas que se presentan solas, sin el cromo del sitio de consumidor: barra de
   navegación, footer del catálogo, botones flotantes de WhatsApp y del chat de
   viajes, y el onboarding de bienvenida.

   `/ia-planes` no le habla a un cliente que busca viajar sino a una posada que
   evalúa contratar el asistente. Con el cromo puesto, lo primero que veía era
   el onboarding de la agencia tapando la propuesta, y debajo un footer que la
   invitaba a comprar un viaje -- además de alargar una página cuyo pedido
   explícito fue que no se sintiera un scroll infinito. */
const RUTAS_SIN_CROMO = ["/ia-planes"];

export function CromoSitio({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const sinCromo = RUTAS_SIN_CROMO.some((r) => pathname === r || pathname.startsWith(`${r}/`));
  return sinCromo ? null : <>{children}</>;
}
