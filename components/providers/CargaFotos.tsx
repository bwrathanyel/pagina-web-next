"use client";

import { useEffect } from "react";

/* Las fotos (next/image) aparecían de golpe sobre el fondo del contenedor, que
   en el tema oscuro es casi negro: al navegar se veían huecos oscuros que se
   llenaban a saltos. Acá se marca cada <img data-nimg> cuando termina de
   cargar para que entre con un fundido (globals.css, .fotos-suaves).

   Solo se ocultan fotos después de hidratar y con este componente escuchando:
   las que ya habían cargado quedan "ya" (sin animación) y, si el JS no corre,
   la clase nunca se pone y todo se ve como antes. load/error no burbujean,
   por eso la escucha va en captura sobre el documento. */
export function CargaFotos() {
  useEffect(() => {
    const raiz = document.documentElement;
    const marcar = (e: Event) => {
      const img = e.target;
      if (!(img instanceof HTMLImageElement) || img.dataset.nimg === undefined || img.dataset.cargada) return;
      img.dataset.cargada = e.type === "load" ? "fundido" : "error";
    };
    document.addEventListener("load", marcar, true);
    document.addEventListener("error", marcar, true);
    document.querySelectorAll<HTMLImageElement>("img[data-nimg]").forEach((img) => {
      if (img.complete && !img.dataset.cargada) img.dataset.cargada = "ya";
    });
    raiz.classList.add("fotos-suaves");
    return () => {
      document.removeEventListener("load", marcar, true);
      document.removeEventListener("error", marcar, true);
      raiz.classList.remove("fotos-suaves");
    };
  }, []);
  return null;
}
