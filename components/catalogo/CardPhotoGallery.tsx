"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

const CURVA = [0.22, 1, 0.36, 1] as const;

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
  const [hoverActivo, setHoverActivo] = useState(false);
  // En pantallas táctiles no hay hover: el pase se dispara al entrar la tarjeta
  // en pantalla. Sin esto, en teléfono las fotos 2..N no se veían nunca salvo
  // que el usuario adivinara que podía deslizar.
  const [enPantalla, setEnPantalla] = useState(false);
  // Las fotos 2..N solo se ven si el usuario pasa el mouse o desliza, pero
  // montarlas de entrada las descargaba igual (opacity-0 no evita la descarga):
  // el catálogo bajaba ~4 fotos por card, 12 MB por recorrerlo desde el
  // teléfono. Se montan al primer gesto, que es cuando recién pueden verse.
  const [montarTodas, setMontarTodas] = useState(false);
  // El auto-advance no puede cruzar hacia una foto que el navegador todavía
  // no bajó -- eso es el hueco que se veía como salto. Se salta solo entre
  // índices ya confirmados por el onLoad de <Image>.
  const [cargadas, setCargadas] = useState<Set<number>>(() => new Set([0]));
  const toque = useRef<{ x: number; y: number } | null>(null);
  const caja = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const nodo = caja.current;
    if (!nodo || fotos.length < 2) return;
    // Solo en pantallas sin puntero fino: donde hay mouse manda el hover, y dos
    // disparadores a la vez harían saltar la foto sin que nadie la mire.
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (typeof IntersectionObserver === "undefined") return;
    const observador = new IntersectionObserver(
      ([entrada]) => {
        setEnPantalla(entrada.isIntersecting);
        if (entrada.isIntersecting) setMontarTodas(true);
      },
      { threshold: 0.55 },
    );
    observador.observe(nodo);
    return () => observador.disconnect();
  }, [fotos.length]);

  useEffect(() => {
    if ((!hoverActivo && !enPantalla) || fotos.length < 2) return;
    const interval = window.setInterval(() => {
      setActiva((indice) => {
        for (let paso = 1; paso < fotos.length; paso++) {
          const siguiente = (indice + paso) % fotos.length;
          if (cargadas.has(siguiente)) return siguiente;
        }
        return indice;
      });
    }, 2400);
    return () => window.clearInterval(interval);
  }, [fotos.length, hoverActivo, enPantalla, cargadas]);

  function mover(sentido: 1 | -1) {
    setActiva((indice) => (indice + sentido + fotos.length) % fotos.length);
  }

  return (
    <div
      ref={caja}
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
          scale del hover y el del cruce escriben la misma propiedad en el mismo
          nodo se anulan entre sí (hallazgo pasada 3). `transition-transform` de
          Tailwind v4 sí cubre la propiedad `scale`, por eso acá el zoom puede
          seguir siendo una utilidad. */}
      <div className="absolute inset-0 transition-[transform,scale,filter] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/foto:scale-[1.08] group-hover/foto:brightness-[1.04] group-hover/foto:saturate-[1.08]">
        {/* Las fotos se montan todas (lazy) para no volver a descargar al
            volver atrás, pero solo la activa se pinta: el cruce lo maneja
            motion, que anima `transform`/`opacity` de verdad -- la clase
            `scale-[1.02]` de Tailwind v4 escribe `scale:`, que
            `transition-[opacity,transform]` no cubría y saltaba de golpe. */}
        {(montarTodas ? fotos : fotos.slice(0, 1)).map((foto, indice) => (
          <Image
            key={foto}
            src={foto}
            alt=""
            aria-hidden="true"
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            priority={indice === 0}
            onLoad={() => setCargadas((prev) => (prev.has(indice) ? prev : new Set(prev).add(indice)))}
            className="object-cover opacity-0"
          />
        ))}
        <AnimatePresence initial={false}>
          <motion.div
            key={fotos[activa]}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.01 }}
            transition={{ duration: 0.7, ease: CURVA }}
          >
            <Image
              src={fotos[activa]}
              alt={alt}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              priority={activa === 0}
              className="object-cover"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Sombra que aparece con el hover: sin esto el zoom queda plano y el
          contador/los puntitos pierden contraste contra fotos claras. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-dusk/60 via-dusk/5 to-dusk/25 opacity-0 transition-opacity duration-500 ease-out group-hover/foto:opacity-100"
      />

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
          <div className="absolute left-1/2 top-12 z-10 flex -translate-x-1/2 gap-1.5">
            {fotos.map((foto, indice) => (
              <button
                key={foto}
                type="button"
                onClick={() => { setMontarTodas(true); setActiva(indice); }}
                aria-label={`Ver foto ${indice + 1} de ${fotos.length} de ${alt}`}
                aria-current={indice === activa}
                className="group/punto h-6 py-2.5"
              >
                <span
                  className={
                    "block h-1.5 rounded-full shadow-sm transition-all duration-300 ease-out " +
                    (indice === activa
                      ? "w-5 bg-white group-hover/foto:w-7"
                      : "w-1.5 bg-white/55 group-hover/foto:w-2.5 group-hover/punto:bg-white/90")
                  }
                />
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
