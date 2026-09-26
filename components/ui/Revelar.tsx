"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

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
  const [armado, setArmado] = useState(false);
  const [visible, setVisible] = useState(false);

  // Antes del primer cuadro: lo que ya está en pantalla se queda quieto y
  // visible (animarlo es hacerlo esperar); solo lo de más abajo se oculta
  // para entrar al hacer scroll.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;
    setArmado(true);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || !armado) return;

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
  }, [armado]);

  const Elemento = as as "div";
  return (
    <Elemento
      ref={ref as React.Ref<HTMLDivElement>}
      className={`${escalonar ? "revelar-escalonado" : "revelar"} ${armado ? "revelar-armado" : ""} ${visible ? "es-visible" : ""} ${className}`}
      style={{ "--retraso": `${retraso}ms` } as React.CSSProperties}
    >
      {children}
    </Elemento>
  );
}
