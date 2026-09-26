"use client";

import { useId } from "react";
import { chip } from "@/components/cotizador/BarraViaje";
import { textoFechas } from "@/components/cotizador/ResumenViaje";
import { Aviso } from "@/components/ui/Aviso";
import { CLASE_CONTROL, Campo, Entrada, Selector } from "@/components/ui/Campo";
import { PrecioMostrado } from "@/components/ui/PrecioMostrado";
import { SelectorFecha } from "@/components/ui/SelectorFecha";
import {
  EQUIPAJES,
  fechasVuelo,
  hoyCaracas,
  ORIGENES_VUELO,
  sumarDias,
  textoViajeros,
  VUELO_DESTINO_OTRO,
  VUELO_DESTINO_OTRO_MAX,
  limpiarDestinoOtro,
  type Equipaje,
  type EstadoViaje,
} from "@/lib/cotizador/estado";
import { destinosDeRutas, type RutaVuelo, type VueloViaje } from "@/lib/cotizador/vuelo";
import { montoConMoneda } from "@/lib/tarifas";

const CONTROL_BOTON = `${CLASE_CONTROL} min-h-12 py-2.5 cursor-pointer`;

/** Vuelo: fechas y pasajeros salen del viaje (una sola fuente, el estado); el
 * cliente elige origen y destino, puede darle fechas propias, y agrega equipaje
 * y flexibilidad. Con ruta en `vuelos_referencia` muestra un aproximado
 * (estimarVuelo); sin ruta u "Otro", "a confirmar": nunca un número inventado. */
export function SeccionVuelo({
  estado,
  rutas,
  vuelo,
  error,
  errorId,
  onCambio,
}: {
  estado: EstadoViaje;
  rutas: readonly RutaVuelo[];
  vuelo: VueloViaje;
  error?: string;
  errorId: string;
  onCambio: (e: EstadoViaje) => void;
}) {
  const id = useId();
  const destinos = destinosDeRutas(rutas);
  const grupos = [
    { etiqueta: "Nacionales", lista: destinos.filter((d) => d.ambito === "nacional") },
    { etiqueta: "Internacionales", lista: destinos.filter((d) => d.ambito === "internacional") },
  ].filter((g) => g.lista.length);
  const otro = vuelo.destino === VUELO_DESTINO_OTRO;
  const destinoTexto = otro ? vuelo.destinoNombre || "otro destino" : vuelo.destinoNombre || estado.destino;
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
        <Campo etiqueta="Hacia">
          {(a11y) => (
            <Selector
              {...a11y}
              value={vuelo.destino}
              onChange={(ev) => onCambio({ ...estado, vueloDestino: ev.target.value, vueloDestinoOtro: "" })}
            >
              {vuelo.destino ? null : <option value="">Elegir destino</option>}
              {grupos.map((g) => (
                <optgroup key={g.etiqueta} label={g.etiqueta}>
                  {g.lista.map((d) => (
                    <option key={d.iata} value={d.iata}>
                      {d.nombre} ({d.iata})
                    </option>
                  ))}
                </optgroup>
              ))}
              <option value={VUELO_DESTINO_OTRO}>Otro destino</option>
            </Selector>
          )}
        </Campo>
        {otro ? (
          <Campo etiqueta="¿A dónde viaja?" ayuda="Ciudad o aeropuerto. El asesor le confirma el precio.">
            {(a11y) => (
              <Entrada
                {...a11y}
                value={estado.vueloDestinoOtro}
                maxLength={VUELO_DESTINO_OTRO_MAX}
                autoComplete="off"
                onChange={(ev) => onCambio({ ...estado, vueloDestinoOtro: limpiarDestinoOtro(ev.target.value) })}
              />
            )}
          </Campo>
        ) : null}
        <div className={otro ? "" : "sm:col-span-2"}>
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
          {estado.origen} a {destinoTexto}
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

      <EstimadoVuelo vuelo={vuelo} />

      <p className="text-sm text-ink-soft">La cédula no se pide ahora: el asesor la solicita al confirmar.</p>
    </>
  );
}

function EstimadoVuelo({ vuelo }: { vuelo: VueloViaje }) {
  if (vuelo.porPersona === null) {
    const motivo = vuelo.aConfirmar.includes("fecha")
      ? "La fecha del vuelo ya pasó: elija otra para ver un aproximado."
      : vuelo.destino && vuelo.destino !== VUELO_DESTINO_OTRO
        ? "No tenemos tarifa de referencia para esta ruta: el asesor de boletería le confirma el precio."
        : "Precio a confirmar por el asesor de boletería.";
    return <Aviso tono="info">{motivo}</Aviso>;
  }
  const porPersona = montoConMoneda(vuelo.porPersona, "USD");
  return (
    <div className="flex flex-col gap-2 rounded-control bg-sand-2 p-4">
      <p className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="text-sm font-semibold text-ink">Vuelo aproximado</span>
        <span className="font-mono text-xl font-bold tabular-nums text-ink">
          <PrecioMostrado texto={vuelo.total !== null ? montoConMoneda(vuelo.total, "USD") : porPersona} />
        </span>
      </p>
      <p className="text-sm text-ink-soft">
        <PrecioMostrado texto={porPersona} /> por persona, {vuelo.origenIata}-{vuelo.destino}
        {vuelo.bebesSinCosto ? ". Los bebés no suman en este aproximado" : ""}.
      </p>
      <p className="text-sm text-ink-soft">
        Aproximado. La boletería cambia según la disponibilidad a la fecha del vuelo; puede salir menos.
      </p>
      {vuelo.cercano && vuelo.dias !== null ? (
        <Aviso tono="info">
          {vuelo.dias === 0 ? "Su vuelo sale hoy" : `Su vuelo sale en ${vuelo.dias} ${vuelo.dias === 1 ? "día" : "días"}`}: con tan poca
          anticipación suele costar más.
        </Aviso>
      ) : null}
    </div>
  );
}
