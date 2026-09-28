"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { chip } from "@/components/cotizador/BarraViaje";
import { Boton } from "@/components/ui/Boton";
import { Etiqueta } from "@/components/ui/Insignia";
import { PrecioMostrado } from "@/components/ui/PrecioMostrado";
import { esOnRequest, textoSinDisponibilidad, type Bloqueo } from "@/lib/cotizador/hotel";
import type { OfertaHotel } from "@/lib/cotizador/ofertas";
import { separarMonto } from "@/lib/tarifas";

type Filtro = "todas" | "todo-incluido" | "ninos-gratis";
const FILTROS: { id: Filtro; etiqueta: string }[] = [
  { id: "todas", etiqueta: "Todas" },
  { id: "todo-incluido", etiqueta: "Todo incluido" },
  { id: "ninos-gratis", etiqueta: "1 niño gratis" },
];
const VISIBLES = 6;
const VISIBLES_LISTA = 3;
const PASO_FOTO_MS = 1100;

/** Qué hotel tiene el mouse encima. Solo mouse: en táctil no hay hover. */
function useEncima() {
  const [encima, setEncima] = useState<number | null>(null);
  const props = (id: number) => ({
    onPointerEnter: (e: React.PointerEvent) => e.pointerType === "mouse" && setEncima(id),
    onPointerLeave: () => setEncima((v) => (v === id ? null : v)),
  });
  return [encima, props] as const;
}

/** Foto de la oferta que, con el mouse encima, va pasando las del hotel. Solo
 * con mouse (en táctil no hay hover) y sin reduced-motion. Las fotos se montan
 * a medida que llegan, una por delante, para no bajarlas todas al cargar. */
function FotoRotativa({
  fotos,
  sizes,
  apagada,
  encima,
}: {
  fotos: string[];
  sizes: string;
  apagada: boolean;
  /** El mouse está sobre la tarjeta o el renglón (no la foto sola). */
  encima: boolean;
}) {
  const [indice, setIndice] = useState(0);
  const [montadas, setMontadas] = useState(1);
  const activo = encima && fotos.length > 1 && !apagada;
  useEffect(() => {
    if (!activo || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Cada paso monta una foto más: siempre hay una lista por delante (la
    // segunda se monta al entrar, ver `visibles`).
    const reloj = setInterval(() => {
      setIndice((i) => (i + 1) % fotos.length);
      setMontadas((m) => Math.min(fotos.length, Math.max(m, 2) + 1));
    }, PASO_FOTO_MS);
    return () => {
      clearInterval(reloj);
      setIndice(0);
    };
  }, [activo, fotos.length]);

  if (!fotos.length) return null;
  const visibles = Math.max(montadas, activo ? 2 : 1);
  return (
    <span className="absolute inset-0">
      {fotos.slice(0, visibles).map((src, i) => (
        <Image
          key={src}
          src={src}
          alt=""
          fill
          sizes={sizes}
          className={`object-cover transition-opacity duration-300 ease-salida motion-reduce:transition-none ${
            i === indice ? "opacity-100" : "opacity-0"
          } ${apagada ? "grayscale" : ""}`}
        />
      ))}
      {activo && (montadas > 1 || indice > 0) ? (
        <span className="absolute inset-x-0 bottom-2 flex justify-center gap-1" aria-hidden="true">
          {fotos.map((src, i) => (
            <span key={src} className={`size-1.5 rounded-full ${i === indice ? "bg-white" : "bg-white/50"}`} />
          ))}
        </span>
      ) : null}
    </span>
  );
}

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
  const [encima, sobre] = useEncima();
  const visibles = todas ? ofertas : ofertas.slice(0, VISIBLES_LISTA);
  return (
    <div className="flex flex-col gap-3">
      <ul className="divide-y divide-linea rounded-card border border-linea">
        {visibles.map((o) => {
          const sinDisponibilidad = desde && hasta ? textoSinDisponibilidad(bloqueos?.get(o.hotelId), desde, hasta) : null;
          return (
            <li key={o.hotelId} className="flex items-center gap-3 p-3" {...sobre(o.hotelId)}>
              <span className="relative size-16 shrink-0 overflow-hidden rounded-control bg-sand-2">
                <FotoRotativa fotos={o.fotos} sizes="64px" apagada={!!sinDisponibilidad} encima={encima === o.hotelId} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="font-semibold leading-snug text-ink">{o.nombre}</span>
                {sinDisponibilidad ? (
                  <span className="text-sm font-semibold text-peligro">{sinDisponibilidad}</span>
                ) : o.plan || o.ninosGratis ? (
                  <span className="flex flex-wrap gap-1.5">
                    {o.plan ? <Etiqueta>{o.plan.toLowerCase()}</Etiqueta> : null}
                    {o.ninosGratis ? <Etiqueta tono="seafoam">1 niño gratis</Etiqueta> : null}
                  </span>
                ) : null}
              </span>
              <Boton
                variante="secundario"
                tamano="sm"
                disabled={!!sinDisponibilidad}
                aria-label={`${o.conFotosHabitacion ? "Ver" : "Elegir"} ${o.nombre}`}
                onClick={() => onVer(o)}
              >
                {o.conFotosHabitacion ? "Ver" : "Elegir"}
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
  ninos = 0,
}: {
  ofertas: OfertaHotel[];
  destino: string;
  elegido: number | null;
  bloqueos: Map<number, Bloqueo[]> | null;
  desde: string;
  hasta: string;
  onVer: (o: OfertaHotel) => void;
  variante?: "grilla" | "lista";
  /** Niños del viaje: con niños y hoteles con el regalo, se muestran esos primero. */
  ninos?: number;
}) {
  const conRegalo = ofertas.filter((o) => o.ninosGratis);
  const [filtro, setFiltro] = useState<Filtro>(ninos > 0 && conRegalo.length ? "ninos-gratis" : "todas");
  // Si agrega niños con la página abierta, el filtro salta solo al regalo.
  const [ninosPrevios, setNinosPrevios] = useState(ninos);
  if (ninos !== ninosPrevios) {
    setNinosPrevios(ninos);
    if (ninosPrevios === 0 && ninos > 0 && conRegalo.length) setFiltro("ninos-gratis");
  }
  const [menorPrecio, setMenorPrecio] = useState(false);
  const [todas, setTodas] = useState(false);
  const [encima, sobre] = useEncima();

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

  const gratisMin = conRegalo.length ? Math.min(...conRegalo.map((o) => o.ninosGratisCantidad || 1)) : 0;
  const preciosNino = conRegalo.map((o) => o.precioNino).filter((x): x is string => !!x);
  const pisoNino = preciosNino.length
    ? preciosNino.reduce((a, b) => (Number(b.replace(/[^\d.]/g, "")) < Number(a.replace(/[^\d.]/g, "")) ? b : a))
    : null;

  return (
    <div className="flex flex-col gap-4">
      {ninos > 0 && conRegalo.length ? (
        <div role="note" className="flex gap-3 rounded-card border border-seafoam bg-seafoam-bg p-3.5 text-sm text-ink">
          <span aria-hidden="true" className="text-xl leading-none">🎁</span>
          <p>
            <strong className="font-semibold">
              ¡Viaja con {ninos === 1 ? "un niño" : "niños"}! En {conRegalo.length === 1 ? "este hotel" : `estos ${conRegalo.length} hoteles`}{" "}
              {gratisMin > 1 ? `los primeros ${gratisMin} niños van` : "el primer niño va"} totalmente gratis.
            </strong>{" "}
            {ninos > gratisMin
              ? pisoNino
                ? `El ${gratisMin === 1 ? "segundo" : "siguiente"} niño paga desde ${pisoNino} por noche.`
                : `El ${gratisMin === 1 ? "segundo" : "siguiente"} niño paga tarifa de niño: el asesor le confirma el monto.`
              : "Aplican edades y fechas de la promoción."}
          </p>
        </div>
      ) : null}
      <div role="group" aria-label="Filtrar ofertas" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [&>*]:shrink-0 [&>*]:whitespace-nowrap [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
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
            const { monto, unidad, grande } = separarMonto(o.precio);
            return (
              <li key={o.hotelId}>
                <button
                  type="button"
                  {...sobre(o.hotelId)}
                  onClick={() => onVer(o)}
                  disabled={!!sinDisponibilidad}
                  aria-label={`${o.nombre}${
                    sinDisponibilidad
                      ? `. ${sinDisponibilidad}`
                      : o.conFotosHabitacion
                        ? ". Ver habitaciones y precio"
                        : esElegido
                          ? ". Elegido"
                          : ". Elegir este hotel"
                  }`}
                  className={`group flex h-full w-full flex-col overflow-hidden rounded-card border bg-card text-left transition-[border-color,box-shadow] duration-150 ease-salida focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento disabled:cursor-not-allowed ${
                    esElegido ? "border-acento ring-2 ring-acento" : "border-linea hover:border-linea-fuerte hover:shadow-chrome"
                  }`}
                >
                  <span className="relative block aspect-4/3 w-full overflow-hidden bg-sand-2">
                    <FotoRotativa
                      fotos={o.fotos}
                      sizes="(min-width: 1280px) 16rem, (min-width: 640px) 45vw, 100vw"
                      apagada={!!sinDisponibilidad}
                      encima={encima === o.hotelId}
                    />
                    <span className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                      {o.ninosGratis ? <Etiqueta tono="seafoam">1 niño gratis</Etiqueta> : null}
                      {esElegido ? <Etiqueta tono="acento">Elegido</Etiqueta> : null}
                    </span>
                  </span>
                  <span className="flex flex-1 flex-col gap-2 p-4">
                    <span className="font-display text-xl font-bold leading-tight text-ink">{o.nombre}</span>
                    {o.plan ? (
                      <span className="line-clamp-2 text-sm text-ink-soft">{o.plan.toLowerCase()}</span>
                    ) : o.resumen ? (
                      <span className="line-clamp-2 text-sm text-ink-soft">{o.resumen}</span>
                    ) : null}
                    {o.ninosGratis && ninos > 0 ? (
                      <span className="text-xs font-semibold text-seafoam-text">
                        {o.ninosGratisCantidad > 1 ? `${o.ninosGratisCantidad} niños gratis` : "1er niño gratis"}
                        {o.ninosGratisEdades ? ` (${o.ninosGratisEdades} años)` : ""}
                        {ninos > Math.max(1, o.ninosGratisCantidad) && o.precioNino ? ` · siguiente: ${o.precioNino}/noche` : ""}
                      </span>
                    ) : null}
                    {sinDisponibilidad ? (
                      <span className="mt-auto text-sm font-semibold text-peligro">{sinDisponibilidad}</span>
                    ) : (
                      <span className="mt-auto flex flex-col">
                        {o.precio && grande ? (
                          <>
                            <span className="font-mono text-lg font-bold tabular-nums text-ink">
                              {o.precio.desde ? "Desde " : ""}
                              <PrecioMostrado texto={monto} />
                            </span>
                            {unidad ? <span className="line-clamp-2 text-xs text-ink-soft">{unidad}</span> : null}
                          </>
                        ) : o.precio ? (
                          <span className="line-clamp-2 text-sm font-semibold text-ink">{monto}</span>
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
