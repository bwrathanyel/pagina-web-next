"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Boton } from "@/components/ui/Boton";
import { Hoja } from "@/components/ui/Hoja";
import { MontoTablero } from "@/components/ui/MontoTablero";
import { enlaceReservar } from "@/components/producto/ReservarCta";
import { usd } from "@/lib/checkout/formato";
import { precioMasBajo, type PrecioHotel } from "@/lib/checkout/opcionesHotel";
import { bloqueosEnFechas, habitacionDeTarifa, hotelesParaPrecio, type Bloqueo } from "@/lib/cotizador/hotel";
import type { OfertaHotel } from "@/lib/cotizador/ofertas";
import { separarMonto } from "@/lib/tarifas";
import type { Pasajeros } from "./PaseFechas";

/** Lo justo de una oferta de /cotizar para proponer otro hotel en /reservar. */
export type HotelAlternativo = Pick<OfertaHotel, "hotelId" | "nombre" | "foto" | "precio">;

const TARJETA =
  "group flex min-w-0 overflow-hidden rounded-card border border-linea bg-card transition-colors duration-150 ease-salida " +
  "motion-reduce:transition-none hover:border-ink/35 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-acento/20";

const NOTA = "text-xs text-ink-soft";

/** Sin fechas: el «desde» de la oferta solo si es un monto (un texto largo de flyer no es un precio). */
function PrecioOferta({ precio }: { precio: HotelAlternativo["precio"] }) {
  const partes = precio ? separarMonto(precio) : null;
  if (!precio || !partes?.grande) return <span className={NOTA}>Elija fechas para ver el precio</span>;
  const { monto, unidad, ivaEnBs, tasa } = partes;
  return (
    <span className="flex min-w-0 flex-col">
      <span className="font-mono text-base font-bold tabular-nums text-ink">
        {precio.desde ? <span className="font-sans text-xs font-semibold text-ink-soft">Desde </span> : null}
        <MontoTablero texto={monto ?? ""} ivaEnBs={ivaEnBs} tasa={tasa} />
      </span>
      {unidad ? <span className={`line-clamp-1 ${NOTA}`}>{unidad}</span> : null}
    </span>
  );
}

type Calculo = PrecioHotel | "cargando" | null;

/** Con fechas: el total de la habitación más barata que ese hotel ofrece en /reservar para este viaje. */
function Precio({ calculo, oferta }: { calculo: Calculo | undefined; oferta: HotelAlternativo["precio"] }) {
  if (calculo === undefined) return <PrecioOferta precio={oferta} />;
  if (calculo === "cargando") return <span className={NOTA}>Calculando precio…</span>;
  if (!calculo || !calculo.ok)
    return <span className={NOTA}>{calculo?.sinCupo ? "Sin disponibilidad en esas fechas" : "Precio a confirmar"}</span>;
  return (
    <span className="flex min-w-0 flex-col">
      <span className="font-mono text-base font-bold tabular-nums text-ink">
        <span className="font-sans text-xs font-semibold text-ink-soft">Desde </span>
        {usd(calculo.precio)}
      </span>
      <span className={`line-clamp-1 ${NOTA}`}>
        Total {calculo.noches} {calculo.noches === 1 ? "noche" : "noches"}
      </span>
    </span>
  );
}

type Datos = Awaited<ReturnType<typeof hotelesParaPrecio>>;

/** «Otros hoteles en {destino}» bajo las habitaciones: dos del mismo destino y el resto en una hoja.
 * Con fechas y viajeros, cada hotel muestra su precio real para ese viaje (el mismo cálculo que su
 * /reservar) y el enlace abre esa habitación con las mismas fechas y viajeros. */
export function OtrosHoteles({
  hoteles,
  destino,
  desde,
  hasta,
  pasajeros,
}: {
  hoteles: HotelAlternativo[];
  destino: string | null;
  desde: string;
  hasta: string;
  pasajeros: Pasajeros;
}) {
  const [todos, setTodos] = useState(false);
  const claveIds = hoteles.map((h) => h.hotelId).join(",");
  const hayFechas = Boolean(desde && hasta && hasta > desde);
  const claveFechas = hayFechas ? `${desde}|${hasta}` : "";

  // Tarifas y habitaciones de todos: una lectura por página. No dependen de las fechas.
  const [datos, setDatos] = useState<{ clave: string; mapa: Datos | "error" } | null>(null);
  useEffect(() => {
    if (!claveIds) return;
    let vivo = true;
    hotelesParaPrecio(claveIds.split(",").map(Number))
      .then((mapa) => vivo && setDatos({ clave: claveIds, mapa }))
      .catch(() => vivo && setDatos({ clave: claveIds, mapa: "error" }));
    return () => {
      vivo = false;
    };
  }, [claveIds]);

  // Stop sales de esas fechas. Si la lectura falla se calcula sin ellas (el Worker vuelve a validar).
  const [bloqueos, setBloqueos] = useState<{ clave: string; mapa: Map<number, Bloqueo[]> } | null>(null);
  useEffect(() => {
    if (!claveIds || !claveFechas) return;
    let vivo = true;
    const clave = `${claveIds}|${claveFechas}`;
    const [d, h] = claveFechas.split("|");
    bloqueosEnFechas(claveIds.split(",").map(Number), d, h)
      .then((mapa) => vivo && setBloqueos({ clave, mapa }))
      .catch(() => vivo && setBloqueos({ clave, mapa: new Map() }));
    return () => {
      vivo = false;
    };
  }, [claveIds, claveFechas]);

  // Una edad a medio escribir (null) no viaja: /reservar descarta viajeros inválidos, y sin ella no hay precio.
  const edades = pasajeros.edades.filter((e): e is number => e !== null);
  const edadesListas = edades.length === pasajeros.edades.length;
  const viaje = hayFechas ? { desde, hasta, adultos: pasajeros.adultos, edades, bebes: pasajeros.bebes } : undefined;

  // Sin useMemo: el React Compiler ya lo memoiza con el viaje (el contacto que se escribe no lo toca).
  const calculos = new Map<number, Calculo>();
  if (viaje && edadesListas) {
    const mapa = datos?.clave === claveIds ? datos.mapa : undefined;
    const stop = bloqueos?.clave === `${claveIds}|${claveFechas}` ? bloqueos.mapa : undefined;
    for (const h of hoteles) {
      if (mapa === "error") calculos.set(h.hotelId, null);
      else if (!mapa || !stop) calculos.set(h.hotelId, "cargando");
      else {
        const hotel = mapa.get(h.hotelId);
        calculos.set(h.hotelId, hotel ? precioMasBajo(hotel, (t) => !!habitacionDeTarifa(hotel.habitaciones, t)?.fotos.length, viaje, stop.get(h.hotelId) ?? []) : null);
      }
    }
  }

  if (!hoteles.length) return null;
  const enlace = (id: number) => {
    const c = calculos.get(id);
    return enlaceReservar(id, c && c !== "cargando" && c.ok ? c.tarifaId : null, viaje);
  };
  const lugar = destino ? ` de ${destino}` : "";

  return (
    <section aria-label="Otros hoteles" className="flex flex-col gap-3 border-t border-dashed border-linea-fuerte pt-4">
      <p className="text-sm font-semibold text-ink">{destino ? `Otros hoteles en ${destino}` : "Otros hoteles"}</p>
      {/* Teléfono: tira que se desliza de lado con todos, en renglones bajos (menos scroll). Desde lg: dos
          tarjetas con foto 4:3 y el resto en la hoja. */}
      <ul className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto overscroll-x-contain px-4 pb-1 sm:-mx-5 sm:scroll-px-5 sm:px-5 lg:mx-0 lg:grid lg:grid-cols-2 lg:overflow-visible lg:px-0 lg:pb-0">
        {hoteles.map((h, i) => (
          <li key={h.hotelId} className={"flex w-[78%] min-w-0 shrink-0 snap-start sm:w-[45%] lg:w-auto" + (i >= 2 ? " lg:hidden" : "")}>
            <Link href={enlace(h.hotelId)} className={`${TARJETA} flex-1 items-center lg:flex-col lg:items-stretch`}>
              <span className="relative block aspect-4/3 w-24 shrink-0 self-stretch bg-sand-2 lg:w-auto lg:self-auto">
                {h.foto ? <Image src={h.foto} alt="" fill sizes="(min-width: 1024px) 12rem, 6rem" className="object-cover" /> : null}
              </span>
              <span className="flex min-w-0 flex-col gap-1 p-3">
                <span className="line-clamp-2 text-sm font-semibold leading-tight text-ink">{h.nombre}</span>
                <Precio calculo={calculos.get(h.hotelId)} oferta={h.precio} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {hoteles.length > 2 ? (
        <Boton type="button" variante="fantasma" className="self-start max-lg:hidden" aria-haspopup="dialog" onClick={() => setTodos(true)}>
          Ver todos los hoteles{lugar}
        </Boton>
      ) : null}

      <Hoja abierta={todos} onCerrar={() => setTodos(false)} titulo={`Hoteles${lugar}`}>
        <ul className="flex flex-col gap-2">
          {hoteles.map((h) => (
            <li key={h.hotelId}>
              <Link href={enlace(h.hotelId)} onClick={() => setTodos(false)} className={`${TARJETA} items-center gap-3 p-2`}>
                <span className="relative block aspect-4/3 w-24 shrink-0 overflow-hidden rounded-control bg-sand-2">
                  {h.foto ? <Image src={h.foto} alt="" fill sizes="112px" className="object-cover" /> : null}
                </span>
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="line-clamp-2 text-sm font-semibold leading-tight text-ink">{h.nombre}</span>
                  <Precio calculo={calculos.get(h.hotelId)} oferta={h.precio} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Hoja>
    </section>
  );
}
