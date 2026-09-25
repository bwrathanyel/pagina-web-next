"use client";

import { useId } from "react";
import { CLASE_CONTROL, Selector } from "@/components/ui/Campo";
import { SelectorFecha } from "@/components/ui/SelectorFecha";
import { SelectorViajeros } from "@/components/ui/SelectorViajeros";
import {
  ADULTOS_MAX,
  alternarServicio,
  BEBES_MAX,
  cambiarDesde,
  cambiarViajeros,
  DESTINOS,
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
  "transition-[background-color,border-color,color] duration-150 ease-salida " +
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

/** Barra de viaje: servicios combinables, destino, fechas y viajeros. Todo lo
 * que cambia aquí baja al estado (y de ahí a la URL). */
export function BarraViaje({ estado, onCambio }: { estado: EstadoViaje; onCambio: (e: EstadoViaje) => void }) {
  const id = useId();
  const noches = nochesDe(estado);
  const hospedaje = estado.servicios.includes("hospedaje");
  const vuelo = estado.servicios.includes("vuelo");
  // Sin hospedaje, la segunda fecha solo existe para un vuelo de ida y vuelta.
  const conSegunda = hospedaje || (vuelo && estado.vuelo === "ida-vuelta");
  const [rotuloDesde, rotuloHasta] = hospedaje ? ["Entrada", "Salida"] : vuelo ? ["Ida", "Vuelta"] : ["Fecha", ""];

  return (
    <section aria-label="Su viaje" className="flex flex-col gap-6">
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-1.5">
          <Rotulo htmlFor={`${id}-destino`}>Destino</Rotulo>
          <Selector
            id={`${id}-destino`}
            value={estado.destino}
            onChange={(ev) => onCambio({ ...estado, destino: ev.target.value })}
          >
            {DESTINOS.map((d) => (
              <option key={d} value={d}>
                {d === "Extranjero" ? "Viajar al extranjero" : d}
              </option>
            ))}
          </Selector>
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

      {estado.ninos > 0 ? (
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
      ) : null}
    </section>
  );
}
