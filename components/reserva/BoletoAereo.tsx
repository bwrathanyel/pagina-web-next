"use client";

import { useId, useState } from "react";
import { SeccionVuelo } from "@/components/cotizador/SeccionVuelo";
import { Boton } from "@/components/ui/Boton";
import { CLASE_CONTROL, Campo } from "@/components/ui/Campo";
import { Hoja } from "@/components/ui/Hoja";
import { Icono } from "@/components/ui/Icono";
import { SelectorFecha } from "@/components/ui/SelectorFecha";
import { esDestinoCompraDirecta } from "@/lib/checkout/destinos";
import { textoFechas } from "@/components/cotizador/ResumenViaje";
import { PrecioMostrado } from "@/components/ui/PrecioMostrado";
import { estadoInicial, hoyCaracas, sumarDias, type EstadoViaje, type VueloPedido } from "@/lib/cotizador/estado";
import { montoConMoneda } from "@/lib/tarifas";
import { listaNatural, nombreDia, recomendacionDia, rutasHacia, type RutaAerea } from "@/lib/cotizador/guiaRutas";
import { estimarVueloViaje, type RutaVuelo } from "@/lib/cotizador/vuelo";
import { enviarCotizacionViaje } from "@/lib/leads/enviarCotizacionViaje";
import type { ReservaCreada, Reserva } from "./useReserva";

const CONTROL_BOTON = `${CLASE_CONTROL} min-h-12 py-2.5 cursor-pointer`;

// La compra directa solo vende Margarita (lib/checkout/destinos.ts): ese es el destino del vuelo.
const DESTINO_VUELO = { destino: "Isla de Margarita", iata: "PMV" } as const;

type DeReserva = Pick<Reserva, "desde" | "hasta" | "pasajeros">;

/** Fechas del vuelo: las propias del boleto o, si no, las del hospedaje. Viajeros: siempre los de la reserva. */
function estadoDesdeReserva(r: DeReserva, pedido: VueloPedido | null): EstadoViaje {
  const edades = r.pasajeros.edades;
  const propias = !!pedido?.vueloDesde;
  return {
    ...estadoInicial(),
    ...(pedido ? { origen: pedido.origen, vuelo: pedido.vuelo, equipaje: pedido.equipaje, flexible: pedido.flexible } : {}),
    servicios: ["vuelo"],
    destino: DESTINO_VUELO.destino,
    vueloDestino: DESTINO_VUELO.iata,
    desde: propias ? pedido!.vueloDesde : r.desde,
    hasta: propias ? pedido!.vueloHasta : r.hasta,
    adultos: r.pasajeros.adultos,
    ninos: edades.length,
    edades,
    bebes: r.pasajeros.bebes,
  };
}

/** Lo que se guarda en la reserva: fechas propias solo si difieren de las del hospedaje (si no, las sigue). */
function pedidoDe(e: EstadoViaje, r: DeReserva): VueloPedido {
  const idaVuelta = e.vuelo === "ida-vuelta";
  const propias = e.desde !== r.desde || (idaVuelta && e.hasta !== r.hasta);
  return {
    origen: e.origen,
    vuelo: e.vuelo,
    equipaje: e.equipaje,
    flexible: e.flexible,
    vueloDesde: propias ? e.desde : "",
    vueloHasta: propias && idaVuelta ? e.hasta : "",
  };
}

/** «Caracas a Isla de Margarita, ida y vuelta, 24 al 27 de nov». */
function rutaTexto(e: EstadoViaje): string {
  return `${e.origen} a ${DESTINO_VUELO.destino}, ${e.vuelo === "ida" ? "solo ida" : "ida y vuelta"}, ${textoFechas({ ...e, hasta: e.vuelo === "ida" ? "" : e.hasta })}`;
}

/** Línea del boleto para el pase y el WhatsApp: «Caracas a Isla de Margarita, … · aprox. $400». */
export function textoBoleto(r: DeReserva, pedido: VueloPedido, rutas: readonly RutaVuelo[]): string {
  const e = estadoDesdeReserva(r, pedido);
  const total = estimarVueloViaje(e, rutas, hoyCaracas()).total;
  return `${rutaTexto(e)}${total != null ? ` · aprox. ${montoConMoneda(total, "USD")}` : ""}`;
}

/** El boleto agregado sale como lead de boletería con el nombre y el WhatsApp de la reserva recién creada. */
export function pedirBoleto(d: ReservaCreada, pedido: VueloPedido, rutas: readonly RutaVuelo[], hotelNombre: string): void {
  const estado = estadoDesdeReserva(d, pedido);
  void enviarCotizacionViaje({
    estado,
    contacto: {
      nombre: d.nombre,
      telefono: d.telefono,
      correo: d.email,
      notas: `Boleto aéreo agregado a la reserva directa${d.codigo ? ` ${d.codigo}` : ""} de ${hotelNombre} (el hospedaje se paga en la web).`,
    },
    iso: d.iso,
    hotel: null,
    vueloViaje: estimarVueloViaje(estado, rutas, hoyCaracas()),
    pagina: "Reservar - boleto",
  }).catch(() => {
    /* sin lead del boleto el pago del hospedaje sigue: el asesor lo ve en la reserva */
  });
}

/** «Para su llegada el miércoles 25: desde Caracas suelen volar …; desde Valencia no suelen salir vuelos ese día.» */
function avanceLlegada(guia: readonly RutaAerea[], fecha: string): string | null {
  if (!fecha) return null;
  const partes = rutasHacia(guia, DESTINO_VUELO.iata)
    .map((g) => {
      const rec = recomendacionDia(guia, g.origenIata, DESTINO_VUELO.iata, fecha);
      if (!rec) return null;
      return rec.tipo === "hay"
        ? `desde ${g.origenNombre} suelen volar ${listaNatural(rec.aerolineas)}`
        : `desde ${g.origenNombre} no suelen salir vuelos ese día`;
    })
    .filter((p): p is string => p !== null);
  if (!partes.length) return null;
  const d = new Date(`${fecha}T00:00:00Z`);
  return `Para su llegada el ${nombreDia(d.getUTCDay())} ${d.getUTCDate()}: ${partes.join("; ")}.`;
}

/** Boleto aéreo como parte de la reserva (pedido del dueño 2026-11-18): sin formulario propio. Se agrega,
 * se ve en el pase y se pide al tocar «Reservar y pagar» con los datos de «Sus datos» (`pedirBoleto`).
 * Hoy se paga solo el hospedaje; el boleto lo cotiza boletería. */
export function BoletoAereo({
  r,
  destino,
  rutas,
  guia,
  valor,
  onCambio,
  className,
}: {
  r: DeReserva;
  destino: string | null;
  rutas: readonly RutaVuelo[];
  guia: readonly RutaAerea[];
  /** Boleto agregado a la reserva (con `vuelo=` de /cotizar entra ya agregado), o null. */
  valor: VueloPedido | null;
  onCambio: (v: VueloPedido | null) => void;
  className?: string;
}) {
  const id = useId();
  const [abierta, setAbierta] = useState(false);
  const [estado, setEstado] = useState<EstadoViaje>(() => estadoDesdeReserva(r, valor));
  const [errorFechas, setErrorFechas] = useState<string | null>(null);

  if (!esDestinoCompraDirecta(destino)) return null;
  const hoy = hoyCaracas();
  const vuelo = estimarVueloViaje(estado, rutas, hoy);
  const avance = avanceLlegada(guia, r.desde);
  const idaVuelta = estado.vuelo === "ida-vuelta";
  // La franja sigue a la reserva: si cambia aquí las fechas del hospedaje, el boleto sin fechas propias las sigue.
  const franja = valor ? estadoDesdeReserva(r, valor) : null;
  const totalFranja = franja ? estimarVueloViaje(franja, rutas, hoy).total : null;

  function abrir() {
    setEstado(estadoDesdeReserva(r, valor));
    setErrorFechas(null);
    setAbierta(true);
  }

  function agregar() {
    if (!estado.desde) return setErrorFechas("Elija la fecha de ida del vuelo.");
    if (idaVuelta && !estado.hasta) return setErrorFechas("Elija también la fecha de vuelta, o marque solo ida.");
    onCambio(pedidoDe(estado, r));
    setAbierta(false);
  }

  function quitar() {
    onCambio(null);
    setAbierta(false);
  }

  return (
    // Teléfono: encabezado con ícono y tarjeta debajo. lg: una sola franja baja (ícono, título, texto y botones
    // en fila) entre la cabecera y el mostrador, para que se vea en la primera pantalla.
    <section
      aria-labelledby={`${id}-titulo`}
      className={`flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4 lg:rounded-card lg:border lg:border-linea lg:bg-card lg:px-4 lg:py-2.5 ${className ?? ""}`}
    >
      <div className="flex shrink-0 items-center gap-3">
        <span
          aria-hidden="true"
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-pill border ${valor ? "border-acento bg-acento text-white" : "border-linea-fuerte text-ink"}`}
        >
          <Icono nombre={valor ? "check" : "avion"} tamano={16} />
        </span>
        <h2 id={`${id}-titulo`} className="min-w-0 flex-1 font-display text-xl font-bold text-ink lg:text-base">
          Boleto aéreo
        </h2>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3 rounded-card border border-linea p-4 md:flex-row md:items-center md:justify-between md:gap-6 md:p-5 lg:rounded-none lg:border-0 lg:border-l lg:p-0 lg:pl-4">
        <div className="flex min-w-0 flex-col gap-1 lg:gap-0.5" aria-live="polite">
          {franja ? (
            <>
              <p className="text-sm font-semibold text-ink">
                En su reserva: {rutaTexto(franja)}
                {totalFranja != null ? (
                  <>
                    {" "}· aprox. <PrecioMostrado texto={montoConMoneda(totalFranja, "USD")} tasaDolar />
                  </>
                ) : null}
              </p>
              <p className="text-sm text-ink-soft lg:text-xs">Hoy paga solo el hospedaje; el boleto se pide con su reserva y lo cotiza boletería.</p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-ink lg:hidden">¿Necesita también el boleto aéreo?</p>
              <p className="text-sm text-ink-soft lg:text-ink">
                <span className="max-lg:hidden">¿Necesita también el boleto? </span>Agréguelo a su reserva: hoy paga solo el hospedaje y el boleto lo cotiza boletería.
              </p>
              {avance ? <p className="text-sm text-ink-soft lg:text-xs">{avance}</p> : null}
            </>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 self-start md:self-center">
          <Boton type="button" variante="secundario" aria-haspopup="dialog" onClick={abrir}>
            {valor ? "Editar" : "Agregar boleto aéreo"}
          </Boton>
          {valor ? (
            <Boton type="button" variante="fantasma" onClick={quitar}>
              Quitar
            </Boton>
          ) : null}
        </div>
      </div>

      <Hoja
        abierta={abierta}
        onCerrar={() => setAbierta(false)}
        titulo="Boleto aéreo"
        anchoClassName="lg:max-w-lg"
        pie={
          <div className="flex flex-col gap-2">
            <Boton type="button" variante="primario" ancho onClick={agregar}>
              {valor ? "Guardar cambios" : "Agregar a mi reserva"}
            </Boton>
            {valor ? (
              <Boton type="button" variante="fantasma" ancho onClick={quitar}>
                Quitar de mi reserva
              </Boton>
            ) : null}
          </div>
        }
      >
        <div className="flex flex-col gap-5">
          <p className="text-sm text-ink-soft">
            El boleto viaja con su reserva: se pide al tocar «Reservar y pagar», con el nombre y el WhatsApp de «Sus datos». Hoy paga solo el
            hospedaje; el boleto se lo cotiza un asesor de boletería.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Ida del vuelo" error={errorFechas ?? undefined}>
              {() => (
                <SelectorFecha
                  id={`${id}-ida`}
                  name="boleto_ida"
                  etiqueta="Ida del vuelo"
                  valor={estado.desde}
                  onCambio={(iso) => setEstado((e) => ({ ...e, desde: iso, hasta: e.hasta && e.hasta <= iso ? "" : e.hasta }))}
                  rango={idaVuelta && estado.hasta ? { desde: estado.desde, hasta: estado.hasta } : undefined}
                  vacio="Elegir fecha"
                  className={CONTROL_BOTON}
                />
              )}
            </Campo>
            {idaVuelta ? (
              <Campo etiqueta="Vuelta del vuelo">
                {() => (
                  <SelectorFecha
                    id={`${id}-vuelta`}
                    name="boleto_vuelta"
                    etiqueta="Vuelta del vuelo"
                    valor={estado.hasta}
                    min={estado.desde ? sumarDias(estado.desde, 1) : undefined}
                    onCambio={(iso) => setEstado((e) => ({ ...e, hasta: iso }))}
                    rango={estado.desde && estado.hasta ? { desde: estado.desde, hasta: estado.hasta } : undefined}
                    vacio="Elegir fecha"
                    className={CONTROL_BOTON}
                  />
                )}
              </Campo>
            ) : null}
          </div>

          <SeccionVuelo
            estado={estado}
            rutas={rutas}
            guia={guia}
            vuelo={vuelo}
            errorId={`${id}-vuelo`}
            onCambio={setEstado}
            ayudaFechas="Las fechas del vuelo se eligen arriba; parten de las de su hospedaje."
          />
        </div>
      </Hoja>
    </section>
  );
}
