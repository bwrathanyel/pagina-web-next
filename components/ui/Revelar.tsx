"use client";

import { useEffect, useRef, useState } from "react";

type Elemento = "div" | "section" | "li" | "ul";

/** Envuelve contenido y lo anima al entrar en viewport (una sola vez, nunca
 * re-anima al volver a scrollear). Si el navegador no soporta
 * IntersectionObserver el contenido se muestra visible de entrada -- sin esta
 * guarda, un fallo del observer deja bloques enteros en opacity:0 para siempre
 * (ver plan de rediseño 2026-08-14).
 *
 * `escalonar`: en vez de entrar el bloque entero, entran sus hijos directos
 * uno detrás de otro (grillas de tarjetas). Con reduced-motion todo queda en
 * su lugar desde el principio (globals.css). */
export function Revelar({
  retraso = 0,
  escalonar = false,
  as = "div",
  className = "",
  children,
}: {
  retraso?: number;
  escalonar?: boolean;
  as?: Elemento;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }

    const observer = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const Elemento = as as "div";
  return (
    <Elemento
      ref={ref as React.Ref<HTMLDivElement>}
      className={`${escalonar ? "revelar-escalonado" : "revelar"} ${visible ? "es-visible" : ""} ${className}`}
      style={{ "--retraso": `${retraso}ms` } as React.CSSProperties}
    >
      {children}
    </Elemento>
  );
}
