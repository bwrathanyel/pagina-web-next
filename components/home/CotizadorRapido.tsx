"use client";

import { useId, useState, type ReactNode } from "react";
import Form from "next/form";
import { Boton, clasesBoton } from "@/components/ui/Boton";
import { Campo, Entrada, Selector } from "@/components/ui/Campo";
import { Hoja } from "@/components/ui/Hoja";
import { Icono } from "@/components/ui/Icono";
import {
  ADULTOS_MAX,
  COTIZACION_RAPIDA_INICIAL as INICIAL,
  DESTINOS_RAPIDOS,
  SERVICIOS_RAPIDOS,
} from "@/lib/cotizador/cotizacionRapida";

// Cotizador rápido del hero. Es un formulario GET de verdad (next/form): sin
// JavaScript igual llega a /cotizador-personalizado con los cuatro datos en la
// URL, y con JavaScript navega en el cliente. La página traduce la URL a las
// respuestas del wizard (lib/cotizador/cotizacionRapida.ts).
const DESTINO = "/cotizador-personalizado";

const ADULTOS = Array.from({ length: ADULTOS_MAX }, (_, k) => k + 1);

function OpcionesServicio() {
  return SERVICIOS_RAPIDOS.map((s) => (
    <option key={s.slug} value={s.slug}>
      {s.label}
    </option>
  ));
}

function OpcionesDestino() {
  return DESTINOS_RAPIDOS.map((d) => (
    <option key={d.valor} value={d.valor}>
      {d.label}
    </option>
  ));
}

function OpcionesAdultos() {
  return ADULTOS.map((n) => (
    <option key={n} value={n}>
      {n === 1 ? "1 adulto" : `${n} adultos`}
    </option>
  ));
}

// Un tramo de la barra: etiqueta chica arriba, valor grande abajo, el control
// nativo sin caja propia (la caja es la barra). El foco se ve en el control.
function Tramo({ etiqueta, children }: { etiqueta: string; children: (id: string) => ReactNode }) {
  const id = useId();
  return (
    <div className="flex min-w-0 flex-col justify-center gap-0.5 rounded-control px-5 py-3 transition-colors duration-150 ease-salida hover:bg-sand-2/60">
      <label htmlFor={id} className="text-sm text-ink-soft">
        {etiqueta}
      </label>
      {children(id)}
    </div>
  );
}

const CONTROL_TRAMO =
  "w-full min-w-0 cursor-pointer rounded-control bg-transparent py-1 text-lg font-semibold text-ink outline-offset-4";
// Solo la barra de escritorio: en el teléfono la lista nativa (rueda o
// diálogo a pantalla completa) se toca mejor que un menú flotante.
const SELECTOR_TRAMO = `selector-marca ${CONTROL_TRAMO}`;

/** Escritorio: barra ancha estilo buscador de viajes, con "Cotizar" como CTA. */
export function CotizadorRapidoBarra() {
  return (
    <Form
      action={DESTINO}
      aria-label="Cotizar un viaje"
      className="sobre-claro flex items-stretch rounded-card border border-linea bg-card p-2"
    >
      <div className="grid min-w-0 flex-1 grid-cols-[1.1fr_1.4fr_1fr_0.9fr] divide-x divide-linea">
        <Tramo etiqueta="Servicio">
          {(id) => (
            <select id={id} name="servicio" defaultValue={INICIAL.servicio} className={SELECTOR_TRAMO}>
              <OpcionesServicio />
            </select>
          )}
        </Tramo>
        <Tramo etiqueta="Destino">
          {(id) => (
            <select id={id} name="destino" defaultValue={INICIAL.destino} className={SELECTOR_TRAMO}>
              <OpcionesDestino />
            </select>
          )}
        </Tramo>
        <Tramo etiqueta="Fecha">
          {(id) => <input id={id} type="date" name="fecha" className={CONTROL_TRAMO + " font-mono tabular-nums"} />}
        </Tramo>
        <Tramo etiqueta="Adultos">
          {(id) => (
            <select id={id} name="adultos" defaultValue={INICIAL.adultos} className={SELECTOR_TRAMO}>
              <OpcionesAdultos />
            </select>
          )}
        </Tramo>
      </div>
      <Boton type="submit" variante="firma" tamano="lg" className="ml-2 shrink-0 self-stretch">
        Cotizar
      </Boton>
    </Form>
  );
}

/** Teléfono: un botón con forma de campo que abre la hoja con los 4 datos. */
export function CotizadorRapidoMovil() {
  const [abierta, setAbierta] = useState(false);
  const idForm = useId();

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierta(true)}
        aria-haspopup="dialog"
        className="sobre-claro flex min-h-14 w-full items-center gap-3 rounded-control border border-linea bg-card px-4 text-left text-base text-ink-soft transition-colors duration-150 ease-salida hover:text-ink"
      >
        <Icono nombre="buscar" tamano={20} className="shrink-0 text-acento" />
        ¿A dónde quiere viajar?
      </button>

      <Hoja
        abierta={abierta}
        onCerrar={() => setAbierta(false)}
        titulo="Cotice su viaje"
        escritorio="centrado"
        pie={
          <button type="submit" form={idForm} className={clasesBoton({ variante: "firma", tamano: "lg", ancho: true })}>
            Cotizar
            <Icono nombre="flecha-der" tamano={20} />
          </button>
        }
      >
        <Form id={idForm} action={DESTINO} className="flex flex-col gap-4 pb-2">
          <Campo etiqueta="Servicio">
            {(a11y) => (
              <Selector {...a11y} name="servicio" defaultValue={INICIAL.servicio}>
                <OpcionesServicio />
              </Selector>
            )}
          </Campo>
          <Campo etiqueta="Destino">
            {(a11y) => (
              <Selector {...a11y} name="destino" defaultValue={INICIAL.destino}>
                <OpcionesDestino />
              </Selector>
            )}
          </Campo>
          <div className="grid grid-cols-2 gap-3">
            <Campo etiqueta="Fecha aproximada">
              {(a11y) => <Entrada {...a11y} type="date" name="fecha" className="font-mono tabular-nums" />}
            </Campo>
            <Campo etiqueta="Adultos">
              {(a11y) => (
                <Selector {...a11y} name="adultos" defaultValue={INICIAL.adultos}>
                  <OpcionesAdultos />
                </Selector>
              )}
            </Campo>
          </div>
        </Form>
      </Hoja>
    </>
  );
}
