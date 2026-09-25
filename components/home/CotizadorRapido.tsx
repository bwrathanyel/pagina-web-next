"use client";

import { useId, useState, type ReactNode } from "react";
import Form from "next/form";
import { Boton, clasesBoton } from "@/components/ui/Boton";
import { Campo, Entrada, Selector } from "@/components/ui/Campo";
import { Hoja } from "@/components/ui/Hoja";
import { Icono } from "@/components/ui/Icono";
import { SelectorFecha } from "@/components/ui/SelectorFecha";
import { SelectorViajeros, type Viajeros } from "@/components/ui/SelectorViajeros";
import {
  ADULTOS_MAX,
  BEBES_MAX,
  COTIZACION_RAPIDA_INICIAL as INICIAL,
  contarNoches,
  DESTINOS_RAPIDOS,
  fechasDelServicio,
  hoyCaracas,
  NINOS_MAX,
  SERVICIOS_RAPIDOS,
  sumarDias,
  textoDuracion,
} from "@/lib/cotizador/cotizacionRapida";

// Cotizador rápido del hero. Es un formulario GET de verdad (next/form): sin
// JavaScript igual llega a /cotizador-personalizado con los datos en la URL,
// y con JavaScript navega en el cliente. La página traduce la URL a las
// respuestas del wizard (lib/cotizador/cotizacionRapida.ts).
const DESTINO = "/cotizador-personalizado";

const MAXIMOS: Viajeros = { adultos: ADULTOS_MAX, ninos: NINOS_MAX, bebes: BEBES_MAX };

/** Estado que comparten la barra y la hoja: el servicio decide cómo se llaman
 * las fechas y si hay segunda fecha (el full day es de un solo día). */
function useCotizacionRapida() {
  const [servicio, setServicio] = useState<string>(INICIAL.servicio);
  const [entrada, setEntrada] = useState("");
  const [salida, setSalida] = useState("");
  const [viajeros, setViajeros] = useState<Viajeros>({ adultos: INICIAL.adultos, ninos: 0, bebes: 0 });
  const [etiquetaInicio, etiquetaFin] = fechasDelServicio(servicio);

  // Si la entrada nueva alcanza a la salida, la salida se corre y conserva
  // las noches que ya tenía (una, si no había).
  function cambiarEntrada(v: string) {
    if (v && salida && salida <= v) setSalida(sumarDias(v, Math.max(1, contarNoches(entrada, salida))));
    setEntrada(v);
  }

  const noches = etiquetaFin ? contarNoches(entrada, salida) : 0;
  return {
    servicio,
    setServicio,
    entrada,
    cambiarEntrada,
    salida,
    setSalida,
    minSalida: sumarDias(entrada || hoyCaracas(), 1),
    viajeros,
    setViajeros,
    etiquetaInicio,
    etiquetaFin,
    duracion: noches > 0 ? textoDuracion(noches) : "",
  };
}

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

function OpcionesNumero({ desde, hasta }: { desde: number; hasta: number }) {
  return Array.from({ length: hasta - desde + 1 }, (_, k) => desde + k).map((n) => (
    <option key={n} value={n}>
      {n}
    </option>
  ));
}

// Un tramo de la barra: etiqueta chica arriba, valor grande abajo, el control
// nativo sin caja propia (la caja es la barra). El foco se ve en el control.
// Arriba y no centrado: bajo las fechas va la línea de días y noches, y así
// las etiquetas y los valores de todos los tramos quedan a la misma altura.
function Tramo({
  etiqueta,
  id,
  className = "",
  children,
}: {
  etiqueta: string;
  id?: string;
  className?: string;
  children: (id: string) => ReactNode;
}) {
  const propio = useId();
  const idControl = id ?? propio;
  return (
    <div
      className={`flex min-w-0 flex-col gap-0.5 rounded-control px-4 pb-1.5 pt-3 transition-colors duration-150 ease-salida hover:bg-sand-2/60 xl:px-5 ${className}`}
    >
      <label htmlFor={idControl} className="text-sm text-ink-soft">
        {etiqueta}
      </label>
      {children(idControl)}
    </div>
  );
}

const CONTROL_TRAMO =
  "w-full min-w-0 cursor-pointer rounded-control bg-transparent py-1 text-base font-semibold text-ink outline-offset-4 xl:text-lg";
// Solo la barra de escritorio: en el teléfono la lista nativa (rueda o
// diálogo a pantalla completa) se toca mejor que un menú flotante.
const SELECTOR_TRAMO = `selector-marca ${CONTROL_TRAMO}`;

/** Escritorio: barra ancha estilo buscador de viajes, con "Cotizar" como CTA. */
export function CotizadorRapidoBarra() {
  const c = useCotizacionRapida();
  const idSalida = useId();
  const fin = c.etiquetaFin;
  const rango = fin ? { desde: c.entrada, hasta: c.salida } : undefined;

  function elegirEntrada(v: string) {
    c.cambiarEntrada(v);
    // Como en los buscadores de viaje: elegida la entrada, se abre la salida.
    if (v && fin && !c.salida) requestAnimationFrame(() => document.getElementById(idSalida)?.click());
  }

  return (
    <Form
      action={DESTINO}
      aria-label="Cotizar un viaje"
      className="sobre-claro flex items-stretch rounded-card border border-linea bg-card p-2"
    >
      <div className="grid min-w-0 flex-1 grid-cols-[0.95fr_1.4fr_2fr_1.65fr] divide-x divide-linea">
        <Tramo etiqueta="Servicio">
          {(id) => (
            <select
              id={id}
              name="servicio"
              value={c.servicio}
              onChange={(e) => c.setServicio(e.target.value)}
              className={SELECTOR_TRAMO}
            >
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

        <div className="flex min-w-0 flex-col">
          <div className="grid flex-1 grid-cols-2">
            <Tramo etiqueta={c.etiquetaInicio} className={fin ? "" : "col-span-2"}>
              {(id) => (
                <SelectorFecha
                  id={id}
                  name="fecha"
                  etiqueta={c.etiquetaInicio}
                  valor={c.entrada}
                  onCambio={elegirEntrada}
                  rango={rango}
                  vacio={fin ? "Flexible" : undefined}
                  className={CONTROL_TRAMO}
                />
              )}
            </Tramo>
            {fin ? (
              <Tramo etiqueta={fin} id={idSalida} className="border-l border-linea">
                {(id) => (
                  <SelectorFecha
                    id={id}
                    name="hasta"
                    etiqueta={fin}
                    valor={c.salida}
                    onCambio={c.setSalida}
                    min={c.minSalida}
                    rango={rango}
                    vacio="Flexible"
                    className={CONTROL_TRAMO}
                  />
                )}
              </Tramo>
            ) : null}
          </div>
          <p aria-live="polite" className="min-h-5 px-4 pb-2 text-center font-mono text-xs tabular-nums text-ink-soft">
            {c.duracion}
          </p>
        </div>

        <Tramo etiqueta="Viajeros">
          {(id) => (
            <SelectorViajeros
              id={id}
              valor={c.viajeros}
              onCambio={c.setViajeros}
              maximos={MAXIMOS}
              className={CONTROL_TRAMO}
            />
          )}
        </Tramo>
      </div>
      <Boton type="submit" variante="firma" tamano="lg" className="ml-2 shrink-0 self-stretch">
        Cotizar
      </Boton>
    </Form>
  );
}

/** Teléfono: un botón con forma de campo que abre la hoja con los datos. */
export function CotizadorRapidoMovil() {
  const [abierta, setAbierta] = useState(false);
  const idForm = useId();
  const c = useCotizacionRapida();
  const cambiarViajeros = (clave: keyof Viajeros) => (e: { target: { value: string } }) =>
    c.setViajeros({ ...c.viajeros, [clave]: Number(e.target.value) });

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierta(true)}
        aria-haspopup="dialog"
        className="sobre-claro flex min-h-14 w-full items-center gap-3 rounded-control border border-linea bg-card pl-4 pr-2 text-left text-base text-ink-soft transition-colors duration-150 ease-salida hover:text-ink"
      >
        <Icono nombre="buscar" tamano={20} className="shrink-0 text-acento" />
        <span className="min-w-0 flex-1 truncate">¿A dónde quiere viajar?</span>
        {/* La flecha naranja reemplaza al botón "Cotizar mi viaje" que iba
            debajo y tapaba la foto del hero (elección del dueño, 2026-09-25):
            la barra de abajo ya lleva "Cotizar" al centro. */}
        <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-control bg-coral-bright text-btn-ink">
          <Icono nombre="flecha-der" tamano={20} />
        </span>
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
              <Selector {...a11y} name="servicio" value={c.servicio} onChange={(e) => c.setServicio(e.target.value)}>
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

          <div>
            <div className={c.etiquetaFin ? "grid grid-cols-2 gap-3" : ""}>
              <Campo etiqueta={c.etiquetaInicio}>
                {(a11y) => (
                  <Entrada
                    {...a11y}
                    type="date"
                    name="fecha"
                    min={hoyCaracas()}
                    value={c.entrada}
                    onChange={(e) => c.cambiarEntrada(e.target.value)}
                    className="font-mono tabular-nums"
                  />
                )}
              </Campo>
              {c.etiquetaFin ? (
                <Campo etiqueta={c.etiquetaFin}>
                  {(a11y) => (
                    <Entrada
                      {...a11y}
                      type="date"
                      name="hasta"
                      min={c.minSalida}
                      value={c.salida}
                      onChange={(e) => c.setSalida(e.target.value)}
                      className="font-mono tabular-nums"
                    />
                  )}
                </Campo>
              ) : null}
            </div>
            {c.etiquetaFin ? (
              <p aria-live="polite" className="mt-2 min-h-5 font-mono text-sm tabular-nums text-ink-soft">
                {c.duracion}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Campo etiqueta="Adultos">
              {(a11y) => (
                <Selector {...a11y} name="adultos" value={c.viajeros.adultos} onChange={cambiarViajeros("adultos")}>
                  <OpcionesNumero desde={1} hasta={ADULTOS_MAX} />
                </Selector>
              )}
            </Campo>
            <Campo etiqueta="Niños">
              {(a11y) => (
                <Selector {...a11y} name="ninos" value={c.viajeros.ninos} onChange={cambiarViajeros("ninos")}>
                  <OpcionesNumero desde={0} hasta={NINOS_MAX} />
                </Selector>
              )}
            </Campo>
            <Campo etiqueta="Bebés">
              {(a11y) => (
                <Selector {...a11y} name="bebes" value={c.viajeros.bebes} onChange={cambiarViajeros("bebes")}>
                  <OpcionesNumero desde={0} hasta={BEBES_MAX} />
                </Selector>
              )}
            </Campo>
          </div>
        </Form>
      </Hoja>
    </>
  );
}
