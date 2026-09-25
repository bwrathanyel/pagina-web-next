"use client";

import { useId } from "react";
import { chip } from "@/components/cotizador/BarraViaje";
import { textoFechas } from "@/components/cotizador/ResumenViaje";
import { Aviso } from "@/components/ui/Aviso";
import { CLASE_CONTROL, Campo, Selector } from "@/components/ui/Campo";
import { SelectorFecha } from "@/components/ui/SelectorFecha";
import {
  EQUIPAJES,
  fechasVuelo,
  hoyCaracas,
  ORIGENES_VUELO,
  sumarDias,
  textoViajeros,
  type Equipaje,
  type EstadoViaje,
} from "@/lib/cotizador/estado";

const CONTROL_BOTON = `${CLASE_CONTROL} min-h-12 py-2.5 cursor-pointer`;

/** Vuelo: ruta, fechas y pasajeros salen del viaje (una sola fuente, el estado);
 * el cliente puede darle fechas propias, y agrega equipaje y flexibilidad. Sin
 * precio: el vuelo es una solicitud y el asesor lo cotiza. */
export function SeccionVuelo({
  estado,
  error,
  errorId,
  onCambio,
}: {
  estado: EstadoViaje;
  error?: string;
  errorId: string;
  onCambio: (e: EstadoViaje) => void;
}) {
  const id = useId();
  const acompana = estado.servicios.includes("hospedaje") || estado.servicios.includes("tours");
  const fv = fechasVuelo(estado);
  const idaVuelta = estado.vuelo === "ida-vuelta";
  const fechas = textoFechas({ ...estado, desde: fv.ida, hasta: fv.vuelta });

  function otrasFechas() {
    if (fv.propias) return onCambio({ ...estado, vueloDesde: "", vueloHasta: "" });
    const ida = estado.desde || sumarDias(hoyCaracas(), 1);
    onCambio({ ...estado, vueloDesde: ida, vueloHasta: idaVuelta ? estado.hasta : "" });
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Desde">
          {(a11y) => (
            <Selector {...a11y} value={estado.origen} onChange={(ev) => onCambio({ ...estado, origen: ev.target.value })}>
              {ORIGENES_VUELO.map((o) => (
                <option key={o.valor} value={o.valor}>
                  {o.etiqueta}
                </option>
              ))}
            </Selector>
          )}
        </Campo>
        <div>
          <p id={`${id}-tipo`} className="mb-1.5 text-sm font-semibold text-ink">
            Tipo de viaje
          </p>
          <div role="group" aria-labelledby={`${id}-tipo`} className="flex flex-wrap gap-2">
            {(
              [
                ["ida-vuelta", "Ida y vuelta"],
                ["ida", "Solo ida"],
              ] as const
            ).map(([valor, etiqueta]) => (
              <button
                key={valor}
                type="button"
                aria-pressed={estado.vuelo === valor}
                onClick={() => onCambio({ ...estado, vuelo: valor })}
                className={chip(estado.vuelo === valor)}
              >
                {etiqueta}
              </button>
            ))}
          </div>
        </div>
      </div>

      <dl className="grid gap-x-6 gap-y-1 rounded-control bg-sand-2 p-4 text-sm sm:grid-cols-[auto_1fr]">
        <dt className="font-semibold text-ink">Ruta</dt>
        <dd className="text-ink-soft">
          {estado.origen} a {estado.destino}
        </dd>
        <dt className="font-semibold text-ink">Fechas</dt>
        <dd className="text-ink-soft">
          {fechas}
          {acompana && !fv.propias ? " (las de su viaje)" : ""}
        </dd>
        <dt className="font-semibold text-ink">Pasajeros</dt>
        <dd className="text-ink-soft">{textoViajeros(estado)}</dd>
      </dl>

      {acompana ? (
        <div className="flex flex-col gap-3">
          <button type="button" aria-pressed={fv.propias} onClick={otrasFechas} className={`${chip(fv.propias)} self-start`}>
            {fv.propias ? "Usar las fechas de mi viaje" : "El vuelo tiene otras fechas"}
          </button>
          {fv.propias ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="Ida del vuelo">
                {() => (
                  <SelectorFecha
                    id={`${id}-ida`}
                    name="vuelo_ida"
                    etiqueta="Ida del vuelo"
                    valor={fv.ida}
                    onCambio={(iso) =>
                      onCambio({ ...estado, vueloDesde: iso, vueloHasta: estado.vueloHasta && estado.vueloHasta <= iso ? "" : estado.vueloHasta })
                    }
                    rango={idaVuelta ? { desde: fv.ida, hasta: fv.vuelta } : undefined}
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
                      name="vuelo_vuelta"
                      etiqueta="Vuelta del vuelo"
                      valor={fv.vuelta}
                      min={sumarDias(fv.ida, 1)}
                      onCambio={(iso) => onCambio({ ...estado, vueloHasta: iso })}
                      rango={{ desde: fv.ida, hasta: fv.vuelta }}
                      vacio="Elegir fecha"
                      className={CONTROL_BOTON}
                    />
                  )}
                </Campo>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-ink-soft">Las fechas de ida y vuelta se eligen arriba, en Su viaje.</p>
      )}

      {error ? (
        <Aviso>
          <span id={errorId} tabIndex={-1}>
            {error}
          </span>
        </Aviso>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Equipaje">
          {(a11y) => (
            <Selector {...a11y} value={estado.equipaje} onChange={(ev) => onCambio({ ...estado, equipaje: ev.target.value as Equipaje })}>
              {EQUIPAJES.map((q) => (
                <option key={q.valor} value={q.valor}>
                  {q.etiqueta}
                </option>
              ))}
            </Selector>
          )}
        </Campo>
        <div>
          <p id={`${id}-flex`} className="mb-1.5 text-sm font-semibold text-ink">
            Flexibilidad
          </p>
          <button
            type="button"
            aria-pressed={estado.flexible}
            aria-labelledby={`${id}-flex`}
            onClick={() => onCambio({ ...estado, flexible: !estado.flexible })}
            className={chip(estado.flexible)}
          >
            Puedo mover las fechas unos días
          </button>
        </div>
      </div>

      <p className="text-sm text-ink-soft">
        La cédula no se pide ahora: el asesor la solicita al confirmar. El vuelo se cotiza aparte, sin precio en esta pantalla.
      </p>
    </>
  );
}
