"use client";

import { useEffect, useRef, useState } from "react";

/** El header se muestra mientras hay scroll y se desvanece cuando el scroll
 * para (pedido del dueño, 2026-07-26: "que no aparezca todo el tiempo").
 *
 * Tres casos donde NO se esconde, porque esconderlo ahí lo volvería
 * inutilizable en vez de discreto:
 *  - Arriba de todo (scrollY ~ 0): es donde uno aterriza en la página; sin
 *    header ahí no hay marca ni navegación visible al llegar.
 *  - Mientras el puntero está encima: si se desvanece justo cuando vas a
 *    hacer clic, no hay forma de usar el menú.
 *  - Mientras algo adentro tiene foco de teclado: quien navega con Tab
 *    perdería de vista el elemento enfocado.
 */
export function useHeaderAutoHide(msParaOcultar = 1600) {
  const [visible, setVisible] = useState(true);
  const [retenido, setRetenido] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retenidoRef = useRef(false);

  useEffect(() => {
    retenidoRef.current = retenido;
    // Al soltar (mouse afuera / foco perdido), reprograma el ocultado en vez
    // de dejar el header colgado visible para siempre.
    if (!retenido && window.scrollY > 8) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setVisible(false), msParaOcultar);
    }
  }, [retenido, msParaOcultar]);

  useEffect(() => {
    const programarOcultado = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (!retenidoRef.current && window.scrollY > 8) setVisible(false);
      }, msParaOcultar);
    };

    const alScrollear = () => {
      setVisible(true);
      if (window.scrollY <= 8) {
        // Arriba de todo se queda fijo: no programa ocultado.
        if (timerRef.current) clearTimeout(timerRef.current);
        return;
      }
      programarOcultado();
    };

    window.addEventListener("scroll", alScrollear, { passive: true });
    return () => {
      window.removeEventListener("scroll", alScrollear);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [msParaOcultar]);

  const refContenedor = useRef<HTMLElement | null>(null);
  const mostrado = visible || retenido;

  // Las filas sticky del catálogo se pegan justo bajo la barra: su alto y si
  // está oculta viajan a <html> (--alto-barra, data-barra-oculta) y globals.css
  // arma con eso --offset-sticky, así la fila sube cuando la barra se va.
  useEffect(() => {
    const el = refContenedor.current;
    if (!el) return;
    const raiz = document.documentElement;
    const ro = new ResizeObserver(() => raiz.style.setProperty("--alto-barra", `${el.offsetHeight}px`));
    ro.observe(el);
    return () => {
      ro.disconnect();
      raiz.style.removeProperty("--alto-barra");
    };
  }, []);

  useEffect(() => {
    const raiz = document.documentElement;
    raiz.toggleAttribute("data-barra-oculta", !mostrado);
    return () => raiz.removeAttribute("data-barra-oculta");
  }, [mostrado]);

  const propsContenedor = {
    ref: refContenedor,
    onMouseEnter: () => setRetenido(true),
    onMouseLeave: () => setRetenido(false),
    onFocusCapture: () => setRetenido(true),
    onBlurCapture: () => setRetenido(false),
  };

  return { visible: mostrado, propsContenedor };
}
