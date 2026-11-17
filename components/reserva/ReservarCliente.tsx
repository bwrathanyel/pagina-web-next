"use client";

import Image from "next/image";
import { ViewTransition } from "react";
import { nombreFoto } from "@/components/ui/movimiento";
import { Pasos } from "@/components/checkout/Pasos";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { WhatsAppIcon } from "@/components/ui/icons/WhatsAppIcon";
import type { HotelParaCobrar } from "@/lib/checkout/calculo";
import { horaAmPm } from "@/lib/checkout/formato";
import { ChipPlazo } from "@/components/checkout/ChipPlazo";
import type { HabitacionWeb } from "@/lib/cotizador/hotel";
import { AccionReserva, CierreReserva } from "./CierreReserva";
import { textoViajeros, type Pasajeros } from "./PaseFechas";
import { PoliticaPlegable } from "./PoliticaPlegable";
import { Tramo } from "./Tramo";
import { SelloDestino } from "@/components/ui/SelloDestino";
import type { TramoId } from "@/lib/checkout/tramos";
import { BarraTotalMovil, ResumenBoleto, type DatosResumen } from "./ResumenBoleto";
import { TramoDatos } from "./TramoDatos";
import { TramoFechas } from "./TramoFechas";
import { TramoHabitacion } from "./TramoHabitacion";
import { TramoPago } from "./TramoPago";
import { useReserva } from "./useReserva";

// Pantalla de compra directa de hospedaje (Plan 1, rediseño F2). El total que se ve acá es
// informativo: el Worker (/api/checkout) lo recalcula desde la base y, si difiere, responde
// `precio_cambio` con el precio real. El pago va antes que los datos personales: el precio
// queda final antes de pedirle nada al cliente.

export function ReservarCliente({
  hotel,
  destino,
  foto,
  habitaciones,
  fotosHotel,
  inicial,
  politica,
}: {
  hotel: HotelParaCobrar;
  destino: string | null;
  foto: string | null;
  habitaciones: HabitacionWeb[];
  fotosHotel: string[];
  inicial: { tarifaId: number | null; desde: string; hasta: string; pasajeros: Pasajeros | null };
  politica: string[];
}) {
  const r = useReserva({ hotel, habitaciones, fotosHotel, inicial });
  const { config, pantalla, esEscritorio, fueraDeHorario, abierta, segundosAbierta, wa } = r;

  // ------------------------------------------------------------------ pantallas de salida
  if (config && (config.fallo || !config.activo)) {
    return (
      <div className="mx-auto flex max-w-lg flex-col gap-5">
        <h1 className="titulo-marca text-balance font-display text-3xl font-bold leading-tight text-ink">{hotel.nombre}</h1>
        <Aviso tono="info">
          {config.fallo
            ? "No pudimos cargar la compra directa. Revise su conexión e inténtelo de nuevo."
            : "La compra directa no está disponible por ahora. Un asesor le arma la reserva y le indica cómo pagar."}
        </Aviso>
        {config.fallo ? (
          <Boton type="button" variante="secundario" ancho onClick={r.reintentar}>
            Reintentar
          </Boton>
        ) : null}
        <Boton variante="whatsapp" ancho iconoInicio={<WhatsAppIcon size={20} />} {...wa("checkout_no_disponible")}>
          Escribirnos por WhatsApp
        </Boton>
        <Boton href={`/cotizar?hotel=${hotel.id}`} variante="secundario" ancho>
          Cotizar este hotel
        </Boton>
      </div>
    );
  }

  // ------------------------------------------------------------------ formulario
  // `datos` y `cierre` existen UNA sola vez: en el aside (escritorio) o en la columna (teléfono).
  // En el teléfono el título lo pone su Tramo; en el aside queda solo para lectores de pantalla.
  const datos = <TramoDatos r={r} conTitulo={pantalla !== false} />;
  const datosPase: DatosResumen = {
    hotel: hotel.nombre,
    foto,
    habitacion: r.habitacion,
    plan: r.elegida?.tarifa.plan?.trim() || null,
    desde: r.desde,
    hasta: r.hasta,
    viajeros: textoViajeros(r.pasajeros),
    pago: r.resumenTramo.pago,
    completos: r.completos,
  };
  const propsTramo = (id: TramoId, numero: number, titulo: string) => ({
    id,
    numero,
    titulo,
    resumen: r.resumenTramo[id],
    completo: r.completos[id],
    abierto: r.abierto(id),
    editando: r.editando === id,
    onCambiar: () => r.cambiarTramo(id),
    onListo: r.cerrarTramo,
  });
  const cierre = <CierreReserva r={r} />;

  return (
    <form onSubmit={r.alEnviar} noValidate className="flex flex-col gap-6">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_26rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_30rem] xl:gap-10">
        <div className="flex min-w-0 flex-col gap-8">
          {/* Una reserva ya creada esperando pago va antes que todo: es lo que no se debe perder. */}
          {abierta && segundosAbierta > 0 ? (
            <Aviso tono="info">
              <span className="flex flex-wrap items-center gap-2">
                <span>
                  Tiene la reserva <span className="font-mono font-bold">{abierta.codigo}</span>
                  {abierta.hotel && abierta.hotel !== hotel.nombre ? ` (${abierta.hotel})` : ""} esperando pago.
                </span>
                <ChipPlazo hasta={abierta.expira_en} />
              </span>
              <Boton href={`/pagar/${abierta.token}`} variante="secundario" tamano="sm" className="mt-2">
                Continuar al pago
              </Boton>
            </Aviso>
          ) : null}

          <header className="flex flex-col gap-3">
            {/* Banda con la foto real del hotel: el nombre va sobre el velo dusk, el destino con su sello. */}
            <div className="relative aspect-video overflow-hidden rounded-card bg-dusk lg:aspect-[21/9]">
              {foto ? (
                // La foto del hotel llega volando desde /cotizar o la ficha (mismo nombre, grupo `.morph`).
                <ViewTransition name={nombreFoto(hotel.id)} share="morph" default="none">
                  <Image
                    src={foto}
                    alt=""
                    fill
                    preload
                    sizes="(min-width: 1280px) 52rem, (min-width: 1024px) 60vw, 100vw"
                    className="object-cover"
                  />
                </ViewTransition>
              ) : null}
              <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-dusk from-10% via-dusk/60 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end gap-3 p-4 lg:p-6">
                <div className="min-w-0 flex-1">
                  <h1 className="titulo-marca text-balance font-display text-2xl font-bold leading-tight text-dusk-text lg:text-4xl">{hotel.nombre}</h1>
                  <p className="mt-2 flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-dusk-text">
                    {destino ? <SelloDestino destino={destino} tamano={28} className="text-dusk-text" /> : null}
                    <span>
                      {destino ?? ""}
                      <span className="hidden lg:inline">{destino ? " · " : ""}Paso 1 de 3</span>
                    </span>
                  </p>
                </div>
                <a
                  {...wa("encabezado")}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Escribirnos por WhatsApp"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-whatsapp text-white lg:hidden"
                >
                  <WhatsAppIcon size={22} />
                </a>
              </div>
            </div>
            <Pasos actual={1} className="lg:hidden" />
          </header>

          {fueraDeHorario ? (
            <Aviso tono="info">
              La compra directa está abierta de {horaAmPm(config?.hora_abre, 8)} a {horaAmPm(config?.hora_cierra, 20)} (hora de
              Venezuela). Puede ver el precio aquí y reservar ahora por WhatsApp con un asesor.
            </Aviso>
          ) : null}

          <Tramo {...propsTramo("fechas", 1, "Fechas y viajeros")}>
            <TramoFechas r={r} />
          </Tramo>

          <Tramo {...propsTramo("habitacion", 2, "Habitación")}>
            <TramoHabitacion r={r} nombreHotel={hotel.nombre} fotosHotel={fotosHotel} />
          </Tramo>

          <Tramo {...propsTramo("pago", 3, "Forma de pago")}>
            <TramoPago r={r} />
          </Tramo>

          {pantalla === false ? <Tramo {...propsTramo("datos", 4, "Sus datos")}>{datos}</Tramo> : null}

          <PoliticaPlegable parrafos={politica} />
          {pantalla === false ? cierre : null}
        </div>

        <aside
          aria-label="Su reserva"
          className="hidden lg:sticky lg:top-24 lg:flex lg:max-h-[calc(100dvh-7rem)] lg:flex-col lg:gap-3 lg:overflow-y-auto lg:overscroll-contain"
        >
          <ResumenBoleto datos={datosPase} totales={r.totales} sinPrecio={r.sinPrecio} />
          {esEscritorio ? datos : null}
          {esEscritorio ? cierre : null}
        </aside>
      </div>

      <BarraTotalMovil datos={datosPase} totales={r.totales} sinPrecio={r.sinPrecio} falta={fueraDeHorario ? null : r.falta} accion={<AccionReserva r={r} ancho={false} />} />
    </form>
  );
}
