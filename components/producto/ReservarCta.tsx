"use client";

import { Boton } from "@/components/ui/Boton";
import { Icono } from "@/components/ui/Icono";
import { WhatsAppIcon } from "@/components/ui/icons/WhatsAppIcon";
import { useBloqueadoHoy } from "@/components/checkout/useBloqueadoHoy";
import { useCheckoutConfig, type CheckoutConfig } from "@/components/checkout/useCheckoutConfig";
import { registrarEvento } from "@/lib/analitica/eventos";
import { esDestinoCompraDirecta } from "@/lib/checkout/destinos";
import { horaAmPm } from "@/lib/checkout/formato";
import { whatsappHref } from "@/lib/whatsapp";

/** Enlace a /reservar con la tarifa ya elegida y, desde el cotizador, fechas y viajeros
 * (app/reservar/page.tsx los lee). */
export function enlaceReservar(
  productoId: number,
  tarifaId?: number | null,
  viaje?: { desde: string; hasta: string; adultos: number; edades: number[]; bebes: number },
) {
  const q = new URLSearchParams({ hotel: String(productoId) });
  if (tarifaId) q.set("tarifa", String(tarifaId));
  if (viaje) {
    q.set("desde", viaje.desde);
    q.set("hasta", viaje.hasta);
    q.set("adultos", String(viaje.adultos));
    if (viaje.edades.length) q.set("edades", viaje.edades.join(","));
    if (viaje.bebes) q.set("bebes", String(viaje.bebes));
  }
  return `/reservar?${q.toString().replace(/%2C/g, ",")}`;
}

/** ¿Se puede comprar este hotel en línea? Solo destinos con compra directa (Margarita) y sin stop
 * sale en la semana. null mientras carga. */
export function useCompraDirecta(productoId: number | null, destino: string | null | undefined): boolean | null {
  const habilitado = !!productoId && esDestinoCompraDirecta(destino);
  const bloqueado = useBloqueadoHoy(habilitado ? productoId : null);
  if (!habilitado) return false;
  return bloqueado === null ? null : !bloqueado;
}

/** «Reservar y pagar» de las tarjetas del catálogo (hoteles y promociones): solo con el checkout
 * encendido, en horario y con compra directa; mientras carga o fuera de horario la tarjeta queda como siempre. */
export function useReservarTarjeta(
  productoId: number | null,
  tarifaId: number | null | undefined,
  origen: string,
  destino: string | null | undefined,
) {
  const { config } = useCheckoutConfig();
  const directa = useCompraDirecta(productoId, destino);
  if (!productoId || !directa || !config?.activo || !config.abierto) return null;
  return {
    href: enlaceReservar(productoId, tarifaId),
    onClick: () => registrarEvento("abrir_pago", { ruta: `/producto/${productoId}`, meta: { etapa: origen, producto_id: productoId } }),
  };
}

export const horarioCheckout = (c: CheckoutConfig) =>
  `${horaAmPm(c.hora_abre, 8)} a ${horaAmPm(c.hora_cierra, 20)}`;

/** «Reservar y pagar» de la caja de precio. La configuración del checkout llega por
 * `useCheckoutConfig` (una consulta compartida con la barra móvil): mientras carga se
 * reserva la altura del botón para que la caja no salte; apagado o sin red no pinta nada.
 * Fuera de la ventana de atención la salida es WhatsApp, con el horario debajo. */
export function ReservarCta({
  productoId,
  tarifaId,
  nombre,
  destino,
}: {
  productoId: number;
  tarifaId?: number | null;
  nombre: string;
  destino: string | null | undefined;
}) {
  const { config } = useCheckoutConfig();
  const directa = useCompraDirecta(productoId, destino);
  const ruta = `/producto/${productoId}`;

  if (directa === false) return null;
  if (config === null || directa === null) return <div aria-hidden="true" className="mt-4 min-h-12" />;
  if (!config.activo) return null;

  if (!config.abierto) {
    return (
      <div className="mt-4">
        <Boton
          variante="whatsapp"
          ancho
          href={whatsappHref(`Hola, quiero reservar en ${nombre}.`)}
          iconoInicio={<WhatsAppIcon size={18} />}
          onClick={() =>
            registrarEvento("click_whatsapp", { ruta, meta: { origen: "ficha", motivo: "fuera_de_horario", producto_id: productoId } })
          }
        >
          Reservar por WhatsApp
        </Boton>
        <p className="mt-2 text-center text-xs text-ink-soft">
          Reserva y pago en línea de {horarioCheckout(config)} (hora de Venezuela).
        </p>
      </div>
    );
  }

  return (
    <Boton
      href={enlaceReservar(productoId, tarifaId)}
      ancho
      className="mt-4"
      iconoFin={<Icono nombre="flecha-der" tamano={16} />}
      onClick={() => registrarEvento("abrir_pago", { ruta, meta: { etapa: "ficha", producto_id: productoId } })}
    >
      Reservar y pagar
    </Boton>
  );
}
