"use client";

import { useRouter } from "next/navigation";
import { Boton } from "@/components/ui/Boton";
import { BotonFavorito } from "@/components/ui/BotonFavorito";
import { Icono } from "@/components/ui/Icono";
import { useFavoritos } from "@/lib/favoritos/useFavoritos";
import { useCheckoutConfig } from "@/components/checkout/useCheckoutConfig";
import { enlaceReservar } from "@/components/producto/ReservarCta";
import { registrarEvento } from "@/lib/analitica/eventos";

/** Overlay mobile-only sobre la foto principal: volver + favorito. En
 * desktop ya hay Navbar para volver, no se duplica. */
export function ProductoAccionesOverlay({
  tipo,
  id,
  nombre,
}: {
  tipo: "producto" | "promocion";
  id: number;
  nombre: string;
}) {
  const router = useRouter();
  const { esFavorito, toggle } = useFavoritos();

  return (
    <div className="absolute inset-x-4 top-4 z-10 flex items-center justify-between lg:hidden">
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="Volver"
        className="flex h-11 w-11 items-center justify-center rounded-pill bg-dusk/85 text-dusk-text backdrop-blur-sm transition-colors duration-150 hover:text-coral-bright"
      >
        <Icono nombre="flecha-izq" tamano={20} />
      </button>
      <BotonFavorito
        activo={esFavorito(tipo, id)}
        nombre={nombre}
        onToggle={async () => {
          const r = await toggle(tipo, id);
          if (r === "login-requerido") router.push("/cuenta/login");
        }}
      />
    </div>
  );
}

/** Footer sticky mobile-only con el CTA principal, arriba del bottom tab bar. En
 * hoteles con la compra directa abierta, «Reservar y pagar» pasa a ser la acción
 * principal y Cotizar queda al lado como secundaria; mientras carga la configuración
 * (o fuera de horario) se ve solo Cotizar, sin cambiar la altura de la barra. */
export function ProductoFooterMobile({
  cotizarHref,
  reservar,
}: {
  cotizarHref: string;
  reservar?: { productoId: number; tarifaId?: number | null };
}) {
  const { config } = useCheckoutConfig();
  const directa = reservar && config?.activo && config.abierto ? reservar : null;
  return (
    <div
      className="fixed inset-x-0 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-30 border-t border-linea bg-card px-5 py-3 lg:hidden"
    >
      {directa ? (
        <div className="flex gap-2">
          <Boton href={cotizarHref} variante="secundario" className="shrink-0">
            Cotizar
          </Boton>
          <Boton
            href={enlaceReservar(directa.productoId, directa.tarifaId)}
            className="min-w-0 flex-1"
            iconoFin={<Icono nombre="flecha-der" tamano={18} />}
            onClick={() =>
              registrarEvento("abrir_pago", {
                ruta: `/producto/${directa.productoId}`,
                meta: { etapa: "ficha_movil", producto_id: directa.productoId },
              })
            }
          >
            Reservar y pagar
          </Boton>
        </div>
      ) : (
        <Boton href={cotizarHref} ancho iconoFin={<Icono nombre="flecha-der" tamano={18} />}>
          Cotizar este plan
        </Boton>
      )}
    </div>
  );
}
