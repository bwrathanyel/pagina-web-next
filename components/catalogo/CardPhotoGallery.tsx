"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export function CardPhotoGallery({
  fotos,
  alt,
  referencial = false,
}: {
  fotos: string[];
  alt: string;
  /** Transparencia: esta foto es generada por IA (el lugar no tenía ninguna
   * foto real todavía), no una foto del establecimiento. Nunca se oculta. */
  referencial?: boolean;
}) {
  const [activa, setActiva] = useState(0);
  // Dirección del cruce: hacia dónde entra la foto siguiente. El
  // auto-advance del hover usa siempre +1; el swipe/flecha usa mover().
  const [direccion, setDireccion] = useState<1 | -1>(1);
  const [hoverActivo, setHoverActivo] = useState(false);
  // Las fotos 2..N solo se ven si el usuario pasa el mouse o desliza, pero
  // montarlas de entrada las descargaba igual (opacity-0 no evita la descarga):
  // el catálogo bajaba ~4 fotos por card, 12 MB por recorrerlo desde el
  // teléfono. Se montan al primer gesto, que es cuando recién pueden verse.
  const [montarTodas, setMontarTodas] = useState(false);
  const toque = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!hoverActivo || fotos.length < 2) return;
    const interval = window.setInterval(() => {
      setDireccion(1);
      setActiva((indice) => (indice + 1) % fotos.length);
    }, 1800);
    return () => window.clearInterval(interval);
  }, [fotos.length, hoverActivo]);

  function mover(sentido: 1 | -1) {
    setDireccion(sentido);
    setActiva((indice) => (indice + sentido + fotos.length) % fotos.length);
  }

  return (
    <div
      className="absolute inset-0 touch-pan-y"
      role="group"
      aria-roledescription="carrusel de fotografías"
      aria-label={`${alt}: foto ${activa + 1} de ${fotos.length}`}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") { setMontarTodas(true); setHoverActivo(true); }
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") {
          setHoverActivo(false);
          setActiva(0);
        }
      }}
      onTouchStart={(event) => {
        setMontarTodas(true);
        const punto = event.touches[0];
        toque.current = { x: punto.clientX, y: punto.clientY };
      }}
      onTouchEnd={(event) => {
        if (!toque.current || fotos.length < 2) return;
        const punto = event.changedTouches[0];
        const dx = punto.clientX - toque.current.x;
        const dy = punto.clientY - toque.current.y;
        toque.current = null;
        if (Math.abs(dx) > 38 && Math.abs(dx) > Math.abs(dy)) mover(dx < 0 ? 1 : -1);
        else if (Math.abs(dx) < 10 && Math.abs(dy) < 10) mover(1);
      }}
    >
      {/* El zoom al hover vive en este wrapper, no en cada <Image>: si el
          scale del hover y el translate del cruce escriben la misma
          propiedad transform en el mismo nodo se anulan entre sí (hallazgo
          pasada 3). */}
      <div className="motion-safe:group-hover/foto:scale-105 absolute inset-0 transition-transform duration-500 ease-out">
        {(montarTodas ? fotos : fotos.slice(0, 1)).map((foto, indice) => (
          <Image
            key={foto}
            src={foto}
            alt={indice === activa ? alt : ""}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            priority={indice === 0}
            className={
              "object-cover transition-[opacity,transform] duration-700 ease-out " +
              (indice === activa
                ? "translate-x-0 opacity-100"
                : "pointer-events-none opacity-0 " + (direccion === 1 ? "translate-x-[6%]" : "-translate-x-[6%]"))
            }
          />
        ))}
      </div>

      {referencial ? (
        <span className="absolute left-3 top-14 z-10 rounded-lg bg-dusk/80 px-2 py-1 font-mono text-[0.6rem] font-bold uppercase tracking-[0.06em] text-dusk-text backdrop-blur-sm">
          Imagen referencial
        </span>
      ) : null}

      {fotos.length > 1 ? (
        <>
          <span className="absolute right-3 top-14 rounded-lg bg-dusk/80 px-2 py-1 font-mono text-[0.62rem] font-bold text-dusk-text backdrop-blur-sm">
            {activa + 1} / {fotos.length}
          </span>
          <div className="absolute left-1/2 top-14 flex -translate-x-1/2 gap-1.5" aria-hidden="true">
            {fotos.map((foto, indice) => (
              <span
                key={foto}
                className={
                  "h-1.5 rounded-full shadow-sm transition-all duration-300 " +
                  (indice === activa ? "w-5 bg-white" : "w-1.5 bg-white/55")
                }
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
