"use client";

import { useState } from "react";
import Image from "next/image";

export function FotoCarousel({ fotos, alt }: { fotos: string[]; alt: string }) {
  const [activa, setActiva] = useState(0);

  if (fotos.length === 0) {
    return <div className="aspect-[4/3] w-full rounded-2xl bg-sand-2" />;
  }

  return (
    <div>
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-sand-2">
        <Image
          src={fotos[activa]}
          alt={alt}
          fill
          sizes="(min-width: 860px) 50vw, 100vw"
          className="object-cover"
          priority={activa === 0}
        />
      </div>
      {fotos.length > 1 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {fotos.map((foto, i) => (
            <button
              key={foto}
              type="button"
              onClick={() => setActiva(i)}
              aria-label={`Ver foto ${i + 1} de ${fotos.length}`}
              aria-current={i === activa}
              className={
                "relative h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 " +
                (i === activa ? "border-coral" : "border-transparent")
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
