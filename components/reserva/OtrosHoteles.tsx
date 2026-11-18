"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Boton } from "@/components/ui/Boton";
import { Hoja } from "@/components/ui/Hoja";
import { MontoTablero } from "@/components/ui/MontoTablero";
import { enlaceReservar } from "@/components/producto/ReservarCta";
import type { OfertaHotel } from "@/lib/cotizador/ofertas";
import { separarMonto } from "@/lib/tarifas";
import type { Pasajeros } from "./PaseFechas";

/** Lo justo de una oferta de /cotizar para proponer otro hotel en /reservar. */
export type HotelAlternativo = Pick<OfertaHotel, "hotelId" | "nombre" | "foto" | "precio">;

const TARJETA =
  "group flex min-w-0 overflow-hidden rounded-card border border-linea bg-card transition-colors duration-150 ease-salida " +
  "motion-reduce:transition-none hover:border-ink/35 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-acento/20";

function PrecioDesde({ precio }: { precio: HotelAlternativo["precio"] }) {
  if (!precio) return <span className="text-xs text-ink-soft">Precio a confirmar</span>;
  const { monto, unidad, grande, ivaEnBs } = separarMonto(precio);
  return (
    <span className="flex min-w-0 flex-col">
      {grande ? (
        <span className="font-mono text-base font-bold tabular-nums text-ink">
          {precio.desde ? <span className="font-sans text-xs font-semibold text-ink-soft">Desde </span> : null}
          <MontoTablero texto={monto ?? ""} ivaEnBs={ivaEnBs} />
        </span>
      ) : (
        <span className="line-clamp-2 text-xs font-semibold text-ink">{monto}</span>
      )}
      {unidad ? <span className="line-clamp-1 text-xs text-ink-soft">{unidad}</span> : null}
    </span>
  );
}

/** «Otros hoteles en {destino}» bajo las habitaciones: dos del mismo destino y el resto en una hoja.
 * Elegir uno abre /reservar de ese hotel con las mismas fechas y viajeros (sin tarifa: se elige allá). */
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
  if (!hoteles.length) return null;
  // Una edad a medio escribir (null) no viaja: /reservar descarta viajeros inválidos.
  const edades = pasajeros.edades.filter((e): e is number => e !== null);
  const viaje = desde && hasta ? { desde, hasta, adultos: pasajeros.adultos, edades, bebes: pasajeros.bebes } : undefined;
  const enlace = (id: number) => enlaceReservar(id, null, viaje);
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
                <PrecioDesde precio={h.precio} />
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
                  <PrecioDesde precio={h.precio} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Hoja>
    </section>
  );
}
