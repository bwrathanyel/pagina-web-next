"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";

/** Foto del destino, desenfocada y tapada casi entera por el fondo del sitio,
 * detrás de /cotizar: la página era un plano liso sin nada del lugar elegido
 * (pedido del dueño para el video de redes, 2026-10-16). Sigue al destino sin
 * recargar porque CotizadorViaje lo escribe en la URL con replaceState. Misma
 * receta que FondoRotativoBio; 384px alcanzan para una foto que va borrosa. */
export function FondoDestino({ fotos, inicial }: { fotos: Record<string, string>; inicial: string }) {
  const destino = useSearchParams().get("destino") ?? inicial;
  const src = fotos[destino];
  if (!src) return null;
  return (
    // Capa propia y aislada: el blur de pantalla completa se pinta una vez y
    // el scroll no lo vuelve a calcular (en teléfonos de gama baja trababa).
    <div aria-hidden="true" data-fondo-destino className="pointer-events-none fixed inset-0 -z-10 overflow-hidden [contain:strict] will-change-transform">
      <Image key={src} src={src} alt="" fill sizes="384px" className="scale-110 object-cover opacity-60 blur-2xl" />
      <div className="absolute inset-0 bg-gradient-to-b from-sand/55 via-sand/80 to-sand" />
    </div>
  );
}
