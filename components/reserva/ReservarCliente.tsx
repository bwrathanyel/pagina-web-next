"use client";

import Image from "next/image";
import { ViewTransition } from "react";
import { nombreFoto } from "@/components/ui/movimiento";
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
import { BarraTotalMovil, PaseCabecera, type DatosResumen } from "./ResumenBoleto";
import { TramoDatos } from "./TramoDatos";
import { TramoFechas } from "./TramoFechas";
import { TramoHabitacion } from "./TramoHabitacion";
import { TramoPago } from "./TramoPago";
import { useReserva } from "./useReserva";
import { useEsAncho } from "@/components/checkout/useEsEscritorio";

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
  const ancho = useEsAncho();

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
  // Todo en una vista (pedido del dueño, 2026-11-18): cabecera baja con el total, y desde lg dos
  // columnas de tramos sin aside (fechas y habitación | pago, datos y cierre). `datos`, `cierre` y la
  // política se montan recién al conocer la media query (B-15: Turnstile una sola vez, sin saltos).
  const datosPase: DatosResumen = {
    hotel: hotel.nombre,
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
  const politicaNodo = <PoliticaPlegable parrafos={politica} />;

  return (
    <form onSubmit={r.alEnviar} noValidate className="flex flex-col gap-5 lg:gap-4">
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

      {/* Teléfono: franja con la foto real de fondo y el nombre sobre el velo dusk. Desde lg: tarjeta con la
          foto en miniatura, el nombre y el total del pase a la derecha. */}
      <header className="relative flex min-h-24 items-end gap-3 overflow-hidden rounded-card bg-dusk p-3 sm:min-h-28 lg:min-h-0 lg:items-center lg:gap-4 lg:border lg:border-linea lg:bg-card lg:p-2">
        <span className="absolute inset-0 lg:relative lg:inset-auto lg:block lg:h-14 lg:w-24 lg:shrink-0 lg:overflow-hidden lg:rounded-media lg:bg-sand-2">
          {foto ? (
            // La foto del hotel llega volando desde /cotizar o la ficha (mismo nombre, grupo `.morph`).
            <ViewTransition name={nombreFoto(hotel.id)} share="morph" default="none">
              <Image src={foto} alt="" fill preload sizes="(min-width: 1024px) 8rem, 100vw" className="object-cover" />
            </ViewTransition>
          ) : null}
        </span>
        <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-dusk from-10% via-dusk/60 to-dusk/10 lg:hidden" />
        <div className="relative min-w-0 flex-1">
          <h1 className="titulo-marca text-balance font-display text-xl font-bold leading-tight text-dusk-text sm:text-2xl lg:text-xl lg:text-ink">{hotel.nombre}</h1>
          <p className="mt-1.5 flex lg:mt-1 items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-dusk-text lg:text-ink-soft">
            {destino ? <SelloDestino destino={destino} tamano={24} className="shrink-0 text-dusk-text lg:text-ink-soft" /> : null}
            <span className="truncate">
              {destino ? `${destino} · ` : ""}Paso 1 de 3
            </span>
          </p>
        </div>
        <PaseCabecera datos={datosPase} totales={r.totales} sinPrecio={r.sinPrecio} className="relative max-lg:hidden" />
        <a
          {...wa("encabezado")}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Escribirnos por WhatsApp"
          className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-whatsapp text-white lg:hidden"
        >
          <WhatsAppIcon size={22} />
        </a>
      </header>

      {fueraDeHorario ? (
        <Aviso tono="info">
          La compra directa está abierta de {horaAmPm(config?.hora_abre, 8)} a {horaAmPm(config?.hora_cierra, 20)} (hora de
          Venezuela). Puede ver el precio aquí y reservar ahora por WhatsApp con un asesor.
        </Aviso>
      ) : null}

      {/* lg: dos columnas (fechas y habitación | pago, datos y cierre). xl: tres (fechas y habitación | pago
          y política | datos y cierre); la columna derecha se disuelve con `xl:contents`. */}
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start lg:gap-8 xl:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-6 lg:gap-5">
          <Tramo {...propsTramo("fechas", 1, "Fechas y viajeros")}>
            <TramoFechas r={r} />
          </Tramo>

          <Tramo {...propsTramo("habitacion", 2, "Habitación")}>
            <TramoHabitacion r={r} nombreHotel={hotel.nombre} fotosHotel={fotosHotel} />
          </Tramo>

          {/* En lg la política llena el hueco bajo las habitaciones; en xl va bajo el pago; en el teléfono, antes del cierre. */}
          {esEscritorio && !ancho ? politicaNodo : null}
        </div>

        <div className="flex min-w-0 flex-col gap-6 lg:gap-5 xl:contents">
          <div className="flex min-w-0 flex-col gap-6 lg:gap-5">
            <Tramo {...propsTramo("pago", 3, "Forma de pago")}>
              <TramoPago r={r} />
            </Tramo>
            {esEscritorio && ancho ? politicaNodo : null}
          </div>

          <div className="flex min-w-0 flex-col gap-6 lg:gap-5">
            {pantalla !== null ? (
              <Tramo {...propsTramo("datos", 4, "Sus datos")}>
                <TramoDatos r={r} />
              </Tramo>
            ) : null}

            {pantalla === false ? politicaNodo : null}
            {pantalla !== null ? <CierreReserva r={r} /> : null}
          </div>
        </div>
      </div>

      <BarraTotalMovil datos={datosPase} totales={r.totales} sinPrecio={r.sinPrecio} falta={fueraDeHorario ? null : r.falta} accion={<AccionReserva r={r} ancho={false} />} />
    </form>
  );
}
