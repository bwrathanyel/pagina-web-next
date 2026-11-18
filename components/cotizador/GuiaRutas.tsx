"use client";

import { useId, useState } from "react";
import { rutasHacia, textoActualizado, textoDiasFila, type RutaAerea } from "@/lib/cotizador/guiaRutas";

/** «Cómo suelen salir los vuelos a …»: aerolíneas y días por origen, plegado. Orientativo; sin
 * filas para el destino no se pinta (nunca se inventa una ruta). */
export function GuiaRutas({
  rutas,
  destinoIata,
  origenIata,
  abiertaInicial = false,
}: {
  rutas: readonly RutaAerea[];
  destinoIata: string | undefined;
  origenIata?: string;
  abiertaInicial?: boolean;
}) {
  const id = useId();
  const [abierta, setAbierta] = useState(abiertaInicial);
  const grupos = destinoIata ? rutasHacia(rutas, destinoIata, origenIata) : [];
  if (!grupos.length) return null;
  const destino = grupos[0].filas[0].destino_nombre;
  const actualizado = textoActualizado(grupos.flatMap((g) => g.filas));

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        aria-expanded={abierta}
        aria-controls={`${id}-guia`}
        onClick={() => setAbierta((v) => !v)}
        className="self-start text-sm font-semibold text-acento underline underline-offset-4 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento"
      >
        {abierta ? "Ocultar los días de vuelo" : `Cómo suelen salir los vuelos a ${destino}`}
      </button>
      <div id={`${id}-guia`} hidden={!abierta} className="flex flex-col gap-3 rounded-control border border-linea bg-card p-4">
        {grupos.map((g) => (
          <section key={g.origenIata} aria-label={`Desde ${g.origenNombre}`} className="flex flex-col gap-1.5">
            <h3 className="text-sm font-semibold text-ink">Desde {g.origenNombre}</h3>
            <dl className="grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] gap-x-4 gap-y-1 text-sm">
              {g.filas.map((f) => (
                <div key={f.aerolinea} className="contents">
                  <dt className="font-medium text-ink">{f.aerolinea}</dt>
                  <dd className="text-ink-soft">
                    {textoDiasFila(f)}
                    {f.nota ? <span className="text-ink-soft">. {f.nota}</span> : null}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
        <p className="text-xs text-ink-soft">
          Orientativo, según información pública de las aerolíneas{actualizado ? ` (actualizado en ${actualizado})` : ""}. Los días,
          horarios y cupos los confirma el asesor de boletería.
        </p>
      </div>
    </div>
  );
}
