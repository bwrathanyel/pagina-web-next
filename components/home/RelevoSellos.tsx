"use client";

import { useEffect, useRef, type ComponentProps } from "react";

/** Paso del relevo: la escena dura `--ritmo-escena` (globals.css, 1,4 s) y el
 * resto (0,2 s) es la pausa hasta el próximo sello. */
export const PASO_RELEVO_MS = 1600;
/** Primer sello al abrir el panel (deja asentar la caída de las opciones). */
const ARRANQUE_MS = 400;
/** Al volver de una pausa (puntero, pestaña) retoma enseguida. */
const REANUDA_MS = 600;
const CLASE = "relevo-activo";

/** Grilla de sellos de destino que se relevan de a uno (pedido del dueño,
 * 2026-11-19: el desfase asíncrono se veía desordenado). Un solo reloj, un
 * sello por vez en orden de lectura (orden del DOM), pausa entre uno y otro y
 * bucle infinito. Se detiene con la grilla fuera de pantalla o el popover
 * cerrado (vuelve a empezar por el primero), con la pestaña oculta o el
 * puntero encima (la escena en curso termina), y no corre con
 * prefers-reduced-motion. */
export function GrillaRelevo(props: ComponentProps<"div">) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const raiz = ref.current;
    if (!raiz || typeof IntersectionObserver === "undefined") return;
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)");
    let siguiente = 0;
    let reloj: number | undefined;
    let enVista = false;
    let encima = false;

    const apagar = () => raiz.querySelector(`.${CLASE}`)?.classList.remove(CLASE);
    const relevar = () => {
      const sellos = raiz.querySelectorAll<HTMLElement>(".sello-con-escena");
      if (!sellos.length) return;
      const sello = sellos[siguiente % sellos.length];
      apagar();
      void sello.offsetWidth; // con un solo sello, reinicia su animación
      sello.classList.add(CLASE);
      siguiente = (siguiente + 1) % sellos.length;
    };
    const programar = (ms: number) => {
      reloj = window.setTimeout(() => {
        relevar();
        programar(PASO_RELEVO_MS);
      }, ms);
    };
    const parar = () => {
      window.clearTimeout(reloj);
      reloj = undefined;
    };
    const actualizar = (espera: number) => {
      const corre = enVista && !encima && !document.hidden && !quieto.matches;
      if (corre && reloj === undefined) programar(espera);
      if (!corre && reloj !== undefined) parar();
    };

    const io = new IntersectionObserver(([e]) => {
      enVista = e.isIntersecting;
      if (!enVista) {
        apagar();
        siguiente = 0;
      }
      actualizar(ARRANQUE_MS);
    });
    io.observe(raiz);
    const alEntrar = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      encima = true;
      actualizar(REANUDA_MS);
    };
    const alSalir = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      encima = false;
      actualizar(REANUDA_MS);
    };
    const alCambiar = () => actualizar(REANUDA_MS);
    raiz.addEventListener("pointerenter", alEntrar);
    raiz.addEventListener("pointerleave", alSalir);
    document.addEventListener("visibilitychange", alCambiar);
    quieto.addEventListener("change", alCambiar);
    return () => {
      parar();
      io.disconnect();
      raiz.removeEventListener("pointerenter", alEntrar);
      raiz.removeEventListener("pointerleave", alSalir);
      document.removeEventListener("visibilitychange", alCambiar);
      quieto.removeEventListener("change", alCambiar);
    };
  }, []);

  return <div ref={ref} {...props} />;
}
