"use client";

import { useState } from "react";
import Image from "next/image";

export function FotoCarousel({ fotos, alt }: { fotos: string[]; alt: string }) {
  const [activa, setActiva] = useState(0);

  if (fotos.length === 0) {
    return <div className="aspect-[4/3] w-full rounded-card bg-sand-2" />;
  }

  return (
    <div>
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-card bg-sand-2">
        {fotos.map((foto, i) => (
          <Image
            key={foto}
            src={foto}
            alt={i === activa ? alt : ""}
            fill
            sizes="(min-width: 860px) 50vw, 100vw"
            loading={i === 0 ? "eager" : "lazy"}
            fetchPriority={i === 0 ? "high" : "auto"}
            className={
              "object-cover transition-[opacity,transform,scale] duration-500 ease-entrada-salida motion-reduce:transition-none " +
              (i === activa ? "scale-100 opacity-100" : "pointer-events-none scale-[1.02] opacity-0")
            }
          />
        ))}
      </div>
      {fotos.length > 1 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {fotos.map((foto, i) => (
            <button
              key={foto}
              type="button"
              onClick={() => setActiva(i)}
              onMouseEnter={() => setActiva(i)}
              onFocus={() => setActiva(i)}
              aria-label={`Ver foto ${i + 1} de ${fotos.length}`}
              aria-current={i === activa}
              className={
                "relative h-16 w-20 flex-shrink-0 overflow-hidden rounded-media border-2 transition-colors duration-150 " +
                (i === activa ? "border-acento" : "border-transparent")
              }
            >
              <Image src={foto} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
