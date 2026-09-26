"use client";

import Image from "next/image";
import { useState } from "react";
import { chip } from "@/components/cotizador/BarraViaje";
import { Boton } from "@/components/ui/Boton";
import { Etiqueta } from "@/components/ui/Insignia";
import { PrecioMostrado } from "@/components/ui/PrecioMostrado";
import { esOnRequest, textoSinDisponibilidad, type Bloqueo } from "@/lib/cotizador/hotel";
import type { OfertaHotel } from "@/lib/cotizador/ofertas";

type Filtro = "todas" | "todo-incluido" | "ninos-gratis";
const FILTROS: { id: Filtro; etiqueta: string }[] = [
  { id: "todas", etiqueta: "Todas" },
  { id: "todo-incluido", etiqueta: "Todo incluido" },
  { id: "ninos-gratis", etiqueta: "Niños gratis" },
];
const VISIBLES = 6;
const VISIBLES_LISTA = 3;

/** Otras ofertas con un hotel ya elegido: renglones cortos (foto, nombre,
 * plan y Ver), sin filtros. */
function ListaOfertas({
  ofertas,
  bloqueos,
  desde,
  hasta,
  onVer,
}: {
  ofertas: OfertaHotel[];
  bloqueos: Map<number, Bloqueo[]> | null;
  desde: string;
  hasta: string;
  onVer: (o: OfertaHotel) => void;
}) {
  const [todas, setTodas] = useState(false);
  const visibles = todas ? ofertas : ofertas.slice(0, VISIBLES_LISTA);
  return (
    <div className="flex flex-col gap-3">
      <ul className="divide-y divide-linea rounded-card border border-linea">
        {visibles.map((o) => {
          const sinDisponibilidad = desde && hasta ? textoSinDisponibilidad(bloqueos?.get(o.hotelId), desde, hasta) : null;
          return (
            <li key={o.hotelId} className="flex items-center gap-3 p-3">
              <span className="relative size-16 shrink-0 overflow-hidden rounded-control bg-sand-2">
                {o.foto ? (
                  <Image src={o.foto} alt="" fill sizes="64px" className={`object-cover ${sinDisponibilidad ? "grayscale" : ""}`} />
                ) : null}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="font-semibold leading-snug text-ink">{o.nombre}</span>
                {sinDisponibilidad ? (
                  <span className="text-sm font-semibold text-peligro">{sinDisponibilidad}</span>
                ) : o.plan || o.ninosGratis ? (
                  <span className="flex flex-wrap gap-1.5">
                    {o.plan ? <Etiqueta>{o.plan.toLowerCase()}</Etiqueta> : null}
                    {o.ninosGratis ? <Etiqueta tono="seafoam">Niños gratis</Etiqueta> : null}
                  </span>
                ) : null}
              </span>
              <Boton
                variante="secundario"
                tamano="sm"
                disabled={!!sinDisponibilidad}
                aria-label={`Ver ${o.nombre}`}
                onClick={() => onVer(o)}
              >
                Ver
              </Boton>
            </li>
          );
        })}
      </ul>
      {ofertas.length > VISIBLES_LISTA ? (
        <Boton variante="fantasma" tamano="sm" className="self-start" aria-expanded={todas} onClick={() => setTodas((v) => !v)}>
          {todas ? "Ver menos" : `Ver las ${ofertas.length}`}
        </Boton>
      ) : null}
    </div>
  );
}

/** Ofertas de hospedaje del destino, una por hotel, en el orden del dueño
 * (niños gratis, todo incluido, el resto). Un hotel con stop sale en las
 * fechas elegidas se ve pero no se puede elegir. */
export function OfertasHospedaje({
  ofertas,
  destino,
  elegido,
  bloqueos,
  desde,
  hasta,
  onVer,
  variante = "grilla",
}: {
  ofertas: OfertaHotel[];
  destino: string;
  elegido: number | null;
  bloqueos: Map<number, Bloqueo[]> | null;
  desde: string;
  hasta: string;
  onVer: (o: OfertaHotel) => void;
  variante?: "grilla" | "lista";
}) {
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [menorPrecio, setMenorPrecio] = useState(false);
  const [todas, setTodas] = useState(false);

  if (variante === "lista") {
    return ofertas.length ? <ListaOfertas ofertas={ofertas} bloqueos={bloqueos} desde={desde} hasta={hasta} onVer={onVer} /> : null;
  }

  if (!ofertas.length) {
    return (
      <p className="text-ink-soft">
        Aún no tenemos ofertas publicadas en {destino}. Cuéntenos abajo qué busca (plan, presupuesto, zona) y un asesor
        le propone opciones con disponibilidad para sus fechas.
      </p>
    );
  }

  const filtradas = ofertas.filter((o) =>
    filtro === "todo-incluido" ? o.todoIncluido : filtro === "ninos-gratis" ? o.ninosGratis : true,
  );
  // "Menor precio" solo ordena las que tienen un número comparable; el resto va detrás.
  const ordenadas = menorPrecio
    ? [...filtradas].sort((a, b) => (a.orden ?? Infinity) - (b.orden ?? Infinity))
    : filtradas;
  const visibles = todas ? ordenadas : ordenadas.slice(0, VISIBLES);
  const hayFiltro = (id: Filtro) =>
    id === "todas" || ofertas.some((o) => (id === "todo-incluido" ? o.todoIncluido : o.ninosGratis));

  return (
    <div className="flex flex-col gap-4">
      <div role="group" aria-label="Filtrar ofertas" className="flex flex-wrap gap-2">
        {FILTROS.filter((f) => hayFiltro(f.id)).map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={filtro === f.id}
            onClick={() => setFiltro(f.id)}
            className={chip(filtro === f.id)}
          >
            {f.etiqueta}
          </button>
        ))}
        <button type="button" aria-pressed={menorPrecio} onClick={() => setMenorPrecio((v) => !v)} className={chip(menorPrecio)}>
          Menor precio
        </button>
      </div>

      {visibles.length ? (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibles.map((o) => {
            const sinDisponibilidad = desde && hasta ? textoSinDisponibilidad(bloqueos?.get(o.hotelId), desde, hasta) : null;
            const onRequest = !sinDisponibilidad && esOnRequest(bloqueos?.get(o.hotelId));
            const esElegido = o.hotelId === elegido;
            return (
              <li key={o.hotelId}>
                <button
                  type="button"
                  onClick={() => onVer(o)}
                  disabled={!!sinDisponibilidad}
                  aria-label={`${o.nombre}${sinDisponibilidad ? `. ${sinDisponibilidad}` : ". Ver habitaciones y precio"}`}
                  className={`group flex h-full w-full flex-col overflow-hidden rounded-card border bg-card text-left transition-[border-color,box-shadow] duration-150 ease-salida focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento disabled:cursor-not-allowed ${
                    esElegido ? "border-acento ring-2 ring-acento" : "border-linea hover:border-linea-fuerte hover:shadow-chrome"
                  }`}
                >
                  <span className="relative block aspect-4/3 w-full overflow-hidden bg-sand-2">
                    {o.foto ? (
                      <Image
                        src={o.foto}
                        alt=""
                        fill
                        sizes="(min-width: 1280px) 16rem, (min-width: 640px) 45vw, 100vw"
                        className={`object-cover transition-[scale] duration-700 ease-salida group-enabled:group-hover:scale-[1.03] motion-reduce:transition-none ${
                          sinDisponibilidad ? "grayscale" : ""
                        }`}
                      />
                    ) : null}
                    <span className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                      {o.ninosGratis ? <Etiqueta tono="seafoam">Niños gratis</Etiqueta> : null}
                      {esElegido ? <Etiqueta tono="acento">Elegido</Etiqueta> : null}
                    </span>
                  </span>
                  <span className="flex flex-1 flex-col gap-2 p-4">
                    <span className="font-display text-xl font-bold leading-tight text-ink">{o.nombre}</span>
                    {o.plan ? <span className="text-sm text-ink-soft">{o.plan.toLowerCase()}</span> : null}
                    {sinDisponibilidad ? (
                      <span className="mt-auto text-sm font-semibold text-peligro">{sinDisponibilidad}</span>
                    ) : (
                      <span className="mt-auto flex flex-col">
                        {o.precio ? (
                          <>
                            <span className="font-mono text-lg font-bold tabular-nums text-ink">
                              {o.precio.desde ? "Desde " : ""}
                              <PrecioMostrado texto={o.precio.monto} />
                            </span>
                            {o.precio.unidad ? <span className="text-xs text-ink-soft">{o.precio.unidad}</span> : null}
                          </>
                        ) : (
                          <span className="text-sm text-ink-soft">Precio a confirmar por el asesor</span>
                        )}
                        {onRequest ? (
                          <span className="mt-1 text-xs font-semibold text-ambar">Sujeto a confirmación del hotel en sus fechas</span>
                        ) : null}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-ink-soft">No hay ofertas con ese filtro en {destino}.</p>
      )}

      {ordenadas.length > VISIBLES && !todas ? (
        <Boton variante="secundario" onClick={() => setTodas(true)} className="self-start">
          Ver {ordenadas.length - VISIBLES} hoteles más
        </Boton>
      ) : null}
    </div>
  );
}
