"use client";

import { useId } from "react";
import { CLASE_CONTROL, Selector } from "@/components/ui/Campo";
import { SelectorFecha } from "@/components/ui/SelectorFecha";
import { SelectorViajeros } from "@/components/ui/SelectorViajeros";
import { SelectorDestino } from "@/components/cotizador/SelectorDestino";
import {
  ADULTOS_MAX,
  alternarServicio,
  BEBES_MAX,
  cambiarDesde,
  cambiarViajeros,
  EDAD_NINO_MAX,
  EDAD_NINO_MIN,
  esPaquete,
  hoyCaracas,
  marcarPaquete,
  NINOS_MAX,
  nochesDe,
  SERVICIOS,
  sumarDias,
  textoDuracion,
  type EstadoViaje,
} from "@/lib/cotizador/estado";

/** Chip de selección (servicios, tipo de vuelo): el estado va en aria-pressed. */
export const CLASE_CHIP =
  "inline-flex min-h-11 items-center justify-center rounded-pill border px-5 text-base font-semibold " +
  "transition-[background-color,border-color,color] duration-150 ease-salida motion-reduce:transition-none " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento";
export const chip = (activo: boolean) =>
  `${CLASE_CHIP} ${
    activo
      ? "border-acento bg-acento text-sobre-acento"
      : "border-linea-fuerte bg-card text-ink hover:border-ink/40 hover:bg-sand-2"
  }`;

const CONTROL_BOTON = `${CLASE_CONTROL} min-h-12 py-2.5 cursor-pointer`;

function Rotulo({ htmlFor, children }: { htmlFor?: string; children: string }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-semibold text-ink">
      {children}
    </label>
  );
}

/** Chip chico de la barra compacta: el marcado lleva un punto de acento. */
const chipCompacto = (activo: boolean) =>
  "inline-flex min-h-11 items-center gap-1.5 rounded-pill border px-3 text-sm font-semibold lg:min-h-9 " +
  "transition-[background-color,border-color,color] duration-150 ease-salida motion-reduce:transition-none " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento " +
  (activo
    ? "border-acento bg-acento-suave text-ink before:size-2 before:rounded-full before:bg-acento before:content-['']"
    : "border-linea-fuerte text-ink-soft hover:border-ink/40 hover:text-ink");

const ETIQUETA_CORTA: Record<string, string> = { tours: "Tours" };

/** Servicios combinables. La variante compacta (barra de escritorio y móvil)
 * no repite la pregunta ni el atajo "Paquete completo": marcar Hospedaje y
 * Vuelo es lo mismo. */
export function ChipsServicios({
  estado,
  onCambio,
  compacto = false,
}: {
  estado: EstadoViaje;
  onCambio: (e: EstadoViaje) => void;
  compacto?: boolean;
}) {
  const id = useId();
  if (compacto) {
    return (
      <div role="group" aria-label="Servicios a cotizar" className="flex flex-wrap gap-1.5">
        {SERVICIOS.map((s) => {
          const activo = estado.servicios.includes(s.id);
          return (
            <button
              key={s.id}
              type="button"
              aria-pressed={activo}
              onClick={() => onCambio(alternarServicio(estado, s.id))}
              className={chipCompacto(activo)}
            >
              {ETIQUETA_CORTA[s.id] ?? s.etiqueta}
            </button>
          );
        })}
      </div>
    );
  }
  return (
    <div>
      <p id={`${id}-servicios`} className="mb-2 text-sm font-semibold text-ink">
        ¿Qué necesita cotizar?
      </p>
      <div role="group" aria-labelledby={`${id}-servicios`} className="flex flex-wrap gap-2">
        {SERVICIOS.map((s) => {
          const activo = estado.servicios.includes(s.id);
          return (
            <button
              key={s.id}
              type="button"
              aria-pressed={activo}
              onClick={() => onCambio(alternarServicio(estado, s.id))}
              className={chip(activo)}
            >
              {s.etiqueta}
            </button>
          );
        })}
        <button
          type="button"
          aria-pressed={esPaquete(estado)}
          onClick={() => onCambio(marcarPaquete(estado))}
          className={chip(esPaquete(estado))}
        >
          Paquete completo
        </button>
      </div>
      <p className="mt-2 text-sm text-ink-soft">Puede combinar varios. Un asesor arma todo en una sola propuesta.</p>
    </div>
  );
}

/** Barra de viaje: destino, fechas y viajeros (y los servicios, salvo que se
 * pinten aparte). Todo lo que cambia aquí baja al estado (y de ahí a la URL). */
export function BarraViaje({
  estado,
  onCambio,
  conServicios = true,
}: {
  estado: EstadoViaje;
  onCambio: (e: EstadoViaje) => void;
  conServicios?: boolean;
}) {
  const id = useId();
  const noches = nochesDe(estado);
  const hospedaje = estado.servicios.includes("hospedaje");
  const vuelo = estado.servicios.includes("vuelo");
  // Sin hospedaje, la segunda fecha solo existe para un vuelo de ida y vuelta.
  const conSegunda = hospedaje || (vuelo && estado.vuelo === "ida-vuelta");
  const [rotuloDesde, rotuloHasta] = hospedaje ? ["Entrada", "Salida"] : vuelo ? ["Ida", "Vuelta"] : ["Fecha", ""];

  return (
    <div className="flex flex-col gap-6">
      {conServicios ? <ChipsServicios estado={estado} onCambio={onCambio} /> : null}

      {/* El destino lleva nombres largos ("Isla de Margarita"): columna más ancha. */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))]">
        <div className="flex flex-col gap-1.5">
          <Rotulo htmlFor={`${id}-destino`}>Destino</Rotulo>
          <SelectorDestino
            id={`${id}-destino`}
            valor={estado.destino}
            onCambio={(destino) => onCambio({ ...estado, destino })}
            className={CONTROL_BOTON}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Rotulo htmlFor={`${id}-desde`}>{rotuloDesde}</Rotulo>
          <SelectorFecha
            id={`${id}-desde`}
            name="fecha"
            etiqueta={rotuloDesde}
            valor={estado.desde}
            onCambio={(iso) => onCambio(cambiarDesde(estado, iso))}
            rango={conSegunda ? { desde: estado.desde, hasta: estado.hasta } : undefined}
            vacio="Elegir fecha"
            className={CONTROL_BOTON}
          />
        </div>

        {conSegunda ? (
          <div className="flex flex-col gap-1.5">
            <Rotulo htmlFor={`${id}-hasta`}>{rotuloHasta}</Rotulo>
            <SelectorFecha
              id={`${id}-hasta`}
              name="hasta"
              etiqueta={rotuloHasta}
              valor={estado.hasta}
              min={sumarDias(estado.desde || hoyCaracas(), 1)}
              onCambio={(iso) => onCambio({ ...estado, hasta: iso })}
              rango={{ desde: estado.desde, hasta: estado.hasta }}
              vacio="Elegir fecha"
              className={CONTROL_BOTON}
            />
          </div>
        ) : null}

        <div className="flex flex-col gap-1.5">
          <Rotulo htmlFor={`${id}-viajeros`}>Viajeros</Rotulo>
          <SelectorViajeros
            id={`${id}-viajeros`}
            valor={{ adultos: estado.adultos, ninos: estado.ninos, bebes: estado.bebes }}
            onCambio={(v) => onCambio(cambiarViajeros(estado, v))}
            maximos={{ adultos: ADULTOS_MAX, ninos: NINOS_MAX, bebes: BEBES_MAX }}
            className={CONTROL_BOTON}
          />
        </div>
      </div>

      {conSegunda && noches > 0 ? (
        <p className="-mt-3 font-mono text-sm tabular-nums text-ink-soft" aria-live="polite">
          {textoDuracion(noches)}
        </p>
      ) : null}

      {estado.ninos > 0 ? <EdadesNinos estado={estado} onCambio={onCambio} /> : null}
    </div>
  );
}

function EdadesNinos({ estado, onCambio }: { estado: EstadoViaje; onCambio: (e: EstadoViaje) => void }) {
  const id = useId();
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-semibold text-ink">Edad de cada niño</legend>
      <div className="flex flex-wrap gap-3">
        {estado.edades.map((edad, i) => (
          <div key={i} className="flex w-32 flex-col gap-1">
            <label htmlFor={`${id}-edad-${i}`} className="text-sm text-ink-soft">
              Niño {i + 1}
            </label>
            <Selector
              id={`${id}-edad-${i}`}
              value={edad}
              onChange={(ev) =>
                onCambio({ ...estado, edades: estado.edades.map((e, j) => (j === i ? Number(ev.target.value) : e)) })
              }
            >
              {Array.from({ length: EDAD_NINO_MAX - EDAD_NINO_MIN + 1 }, (_, k) => EDAD_NINO_MIN + k).map((a) => (
                <option key={a} value={a}>
                  {a} años
                </option>
              ))}
            </Selector>
          </div>
        ))}
      </div>
      <p className="text-sm text-ink-soft">La edad define la tarifa: por favor indique la real.</p>
    </fieldset>
  );
}

const ROTULO_CELDA = "font-mono text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-ink-soft";
const CONTROL_CELDA =
  "w-full min-h-10 cursor-pointer rounded-control px-2 font-semibold text-ink " +
  "transition-colors duration-150 ease-salida motion-reduce:transition-none hover:bg-sand-2 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento";

/** Barra de viaje de escritorio (opción A): una tarjeta de una fila con
 * destino, fechas, viajeros y servicios. Entre lg y xl los servicios bajan a
 * una segunda fila para que las fechas no se corten. */
export function BarraViajeCompacta({ estado, onCambio }: { estado: EstadoViaje; onCambio: (e: EstadoViaje) => void }) {
  const id = useId();
  const noches = nochesDe(estado);
  const hospedaje = estado.servicios.includes("hospedaje");
  const vuelo = estado.servicios.includes("vuelo");
  const conSegunda = hospedaje || (vuelo && estado.vuelo === "ida-vuelta");
  const [rotuloDesde, rotuloHasta] = hospedaje ? ["Entrada", "Salida"] : vuelo ? ["Ida", "Vuelta"] : ["Fecha", ""];
  const celda = "flex min-w-0 flex-col justify-center gap-0.5 px-2 py-2.5";

  return (
    <div className="rounded-card border border-linea bg-card">
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_minmax(0,0.9fr)] xl:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_minmax(0,0.9fr)_auto]">
        <div className={`${celda} border-r border-linea`}>
          <label htmlFor={`${id}-destino`} className={`${ROTULO_CELDA} px-2`}>
            Destino
          </label>
          <SelectorDestino
            id={`${id}-destino`}
            valor={estado.destino}
            onCambio={(destino) => onCambio({ ...estado, destino })}
            className={CONTROL_CELDA}
          />
        </div>

        <div className={`${celda} border-r border-linea`}>
          <p className={`${ROTULO_CELDA} px-2`}>
            {conSegunda ? "Fechas" : rotuloDesde}
            {conSegunda && noches > 0 ? (
              <span className="font-sans font-normal normal-case tracking-normal" aria-live="polite">
                {" "}
                · {textoDuracion(noches)}
              </span>
            ) : null}
          </p>
          <div className="flex items-center">
            <SelectorFecha
              id={`${id}-desde`}
              name="fecha"
              etiqueta={rotuloDesde}
              valor={estado.desde}
              onCambio={(iso) => onCambio(cambiarDesde(estado, iso))}
              rango={conSegunda ? { desde: estado.desde, hasta: estado.hasta } : undefined}
              vacio={conSegunda ? rotuloDesde : "Elegir fecha"}
              className={CONTROL_CELDA}
            />
            {conSegunda ? (
              <>
                <span className="px-1 text-sm text-ink-soft" aria-hidden="true">
                  al
                </span>
                <SelectorFecha
                  id={`${id}-hasta`}
                  name="hasta"
                  etiqueta={rotuloHasta}
                  valor={estado.hasta}
                  min={sumarDias(estado.desde || hoyCaracas(), 1)}
                  onCambio={(iso) => onCambio({ ...estado, hasta: iso })}
                  rango={{ desde: estado.desde, hasta: estado.hasta }}
                  vacio={rotuloHasta}
                  className={CONTROL_CELDA}
                />
              </>
            ) : null}
          </div>
        </div>

        <div className={celda}>
          <label htmlFor={`${id}-viajeros`} className={`${ROTULO_CELDA} px-2`}>
            Viajeros
          </label>
          <SelectorViajeros
            id={`${id}-viajeros`}
            valor={{ adultos: estado.adultos, ninos: estado.ninos, bebes: estado.bebes }}
            onCambio={(v) => onCambio(cambiarViajeros(estado, v))}
            maximos={{ adultos: ADULTOS_MAX, ninos: NINOS_MAX, bebes: BEBES_MAX }}
            className={CONTROL_CELDA}
          />
        </div>

        <div className="col-span-3 flex items-center gap-3 border-t border-linea px-4 py-2.5 xl:col-span-1 xl:flex-col xl:items-start xl:justify-center xl:gap-1 xl:border-l xl:border-t-0">
          <span className={ROTULO_CELDA}>Servicios</span>
          <ChipsServicios estado={estado} onCambio={onCambio} compacto />
        </div>
      </div>

      {estado.ninos > 0 ? (
        <div className="border-t border-linea px-4 py-3">
          <EdadesNinos estado={estado} onCambio={onCambio} />
        </div>
      ) : null}
    </div>
  );
}
