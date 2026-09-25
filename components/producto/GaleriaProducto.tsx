"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Boton } from "@/components/ui/Boton";
import { Hoja } from "@/components/ui/Hoja";
import { Etiqueta } from "@/components/ui/Insignia";

// Un solo árbol para los dos tamaños: en el teléfono es una pista que se
// desliza con snap (una foto por pantalla) y desde `lg` la misma pista pasa a
// ser una grilla, 1 foto grande y 4 chicas. Así cada foto se pide una vez, sin
// montar una versión por tamaño. Tocar cualquier foto abre el visor con todas.
const FOTOS_EN_GRILLA = 5;

function disposicion(n: number) {
  if (n === 1) return "lg:grid-cols-1 lg:grid-rows-1";
  if (n === 2) return "lg:grid-cols-2 lg:grid-rows-1";
  return "lg:grid-cols-4 lg:grid-rows-2";
}

function celda(n: number, i: number) {
  if (n < 3) return "";
  if (i === 0) return "lg:col-span-2 lg:row-span-2";
  if (i >= FOTOS_EN_GRILLA) return "lg:hidden";
  if (n === 3 || (n === 4 && i === 1)) return "lg:col-span-2";
  return "";
}

function tamanos(n: number, i: number) {
  if (n === 1) return "(min-width: 1024px) 1100px, 100vw";
  if (n === 2 || i === 0) return "(min-width: 1024px) 50vw, 100vw";
  return "(min-width: 1024px) 25vw, 100vw";
}

export function GaleriaProducto({ fotos, alt }: { fotos: string[]; alt: string }) {
  const pista = useRef<HTMLDivElement>(null);
  const [activa, setActiva] = useState(0);
  const [visor, setVisor] = useState<number | null>(null);
  const n = fotos.length;

  // Al abrir el visor, la lista queda en la foto que se tocó.
  useEffect(() => {
    if (visor === null) return;
    const id = requestAnimationFrame(() =>
      document.getElementById(`visor-foto-${visor}`)?.scrollIntoView({ block: "start" }),
    );
    return () => cancelAnimationFrame(id);
  }, [visor]);

  if (n === 0) {
    return <div className="aspect-[4/3] w-full rounded-card bg-sand-2 lg:aspect-[5/2]" />;
  }

  function alDeslizar() {
    const el = pista.current;
    if (el && el.clientWidth > 0) setActiva(Math.round(el.scrollLeft / el.clientWidth));
  }

  return (
    <div className="relative overflow-hidden rounded-card bg-sand">
      <div
        ref={pista}
        onScroll={alDeslizar}
        role="group"
        aria-roledescription="carrusel"
        aria-label={`Fotos de ${alt}`}
        className={
          "flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden " +
          "lg:aspect-[5/2] lg:grid lg:snap-none lg:gap-2 lg:overflow-visible " +
          disposicion(n)
        }
      >
        {fotos.map((foto, i) => (
          <button
            key={foto}
            type="button"
            onClick={() => setVisor(i)}
            aria-label={`Ampliar foto ${i + 1} de ${n}`}
            className={
              "group/foto relative aspect-[4/3] w-full shrink-0 snap-center overflow-hidden bg-sand-2 lg:aspect-auto lg:h-full " +
              celda(n, i)
            }
          >
            <Image
              src={foto}
              alt={i === 0 ? alt : ""}
              fill
              sizes={tamanos(n, i)}
              loading={i === 0 ? "eager" : "lazy"}
              fetchPriority={i === 0 ? "high" : "auto"}
              className="object-cover transition-transform duration-[var(--dur-lenta)] ease-salida motion-reduce:transition-none lg:group-hover/foto:scale-[1.03]"
            />
          </button>
        ))}
      </div>

      {n > 1 ? (
        <Etiqueta tono="dusk" className="pointer-events-none absolute bottom-3 right-3 lg:hidden">
          <span aria-hidden="true">
            {activa + 1} / {n}
          </span>
        </Etiqueta>
      ) : null}
      {n > FOTOS_EN_GRILLA ? (
        <Boton
          variante="secundario"
          tamano="sm"
          onClick={() => setVisor(0)}
          className="absolute bottom-4 right-4 max-lg:hidden"
        >
          Ver las {n} fotos
        </Boton>
      ) : null}

      <Hoja
        abierta={visor !== null}
        onCerrar={() => setVisor(null)}
        titulo={`Fotos de ${alt}`}
        escritorio="centrado"
        anchoClassName="max-w-4xl"
      >
        <ul className="flex flex-col gap-3">
          {fotos.map((foto, i) => (
            <li key={foto} id={`visor-foto-${i}`} className="scroll-mt-2">
              <div className="relative aspect-[4/3] overflow-hidden rounded-media bg-sand-2">
                <Image
                  src={foto}
                  alt={`${alt}, foto ${i + 1} de ${n}`}
                  fill
                  sizes="(min-width: 1024px) 56rem, 100vw"
                  loading="lazy"
                  className="object-cover"
                />
              </div>
            </li>
          ))}
        </ul>
      </Hoja>
    </div>
  );
}
