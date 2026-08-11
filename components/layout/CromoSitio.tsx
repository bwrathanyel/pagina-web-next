"use client";

import { usePathname } from "next/navigation";

/* Rutas que se presentan solas, sin el cromo del sitio de consumidor: barra de
   navegación, footer del catálogo, botones flotantes de WhatsApp y del chat de
   viajes, y el onboarding de bienvenida. `/ia-para-tu-negocio` pasó a ser
   pública y con navegación normal (2026-08-11), no va más en esta lista. */
const RUTAS_SIN_CROMO: string[] = [];

export function CromoSitio({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const sinCromo = RUTAS_SIN_CROMO.some((r) => pathname === r || pathname.startsWith(`${r}/`));
  return sinCromo ? null : <>{children}</>;
}
