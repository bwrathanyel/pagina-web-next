"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

// Tablero de salidas split-flap: la firma del hero. Cuando cambia `texto`,
// cada letra gira un par de paletas antes de caer en la nueva, en cascada de
// izquierda a derecha (~0,9 s el tablero entero). Solo anima los cambios: el
// texto inicial ya viene pintado del servidor. Con reduced-motion, el texto se
// reemplaza de una.
//
// Las celdas son decorativas (aria-hidden); el lector de pantalla recibe el
// texto completo, sin aria-live: el hero rota solo y anunciarlo cada pocos
// segundos sería ruido.

const GIRO = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const PASO_MS = 75;
const CASCADA_MS = 35;

type Celda = { ch: string; n: number };

function aCeldas(texto: string, largo: number): string[] {
  const limpio = texto.toLocaleUpperCase("es").replace(/\s+/g, " ").trim();
  let corto = limpio;
  if (limpio.length > largo) {
    const corte = limpio.lastIndexOf(" ", largo);
    corto = corte >= largo * 0.6 ? limpio.slice(0, corte) : limpio.slice(0, largo - 1) + "…";
  }
  return Array.from(corto.padEnd(largo, " ")).slice(0, largo);
}

export function TableroSalidas({
  texto,
  largo = 18,
  className = "",
}: {
  texto: string;
  /** Cantidad fija de paletas: el tablero no cambia de ancho entre destinos. */
  largo?: number;
  className?: string;
}) {
  const reducido = useReducedMotion();
  const [celdas, setCeldas] = useState<Celda[]>(() => aCeldas(texto, largo).map((ch) => ({ ch, n: 0 })));
  const objetivo = useRef<string[] | null>(null);

  useEffect(() => {
    const destino = aCeldas(texto, largo);
    const anterior = objetivo.current ?? destino;
    objetivo.current = destino;
    if (reducido) return;

    const timers: number[] = [];
    destino.forEach((final, i) => {
      if (anterior[i] === final) return;
      const saltos = final === " " ? 1 : 2 + (i % 3);
      for (let s = 1; s <= saltos; s++) {
        const ch = s === saltos ? final : GIRO[(i * 7 + s * 11 + final.charCodeAt(0)) % GIRO.length];
        timers.push(
          window.setTimeout(() => {
            setCeldas((prev) => {
              const sig = prev.slice();
              sig[i] = { ch, n: prev[i].n + 1 };
              return sig;
            });
          }, i * CASCADA_MS + s * PASO_MS),
        );
      }
    });
    return () => timers.forEach(clearTimeout);
  }, [texto, largo, reducido]);

  const mostrar: Celda[] = reducido ? aCeldas(texto, largo).map((ch) => ({ ch, n: 0 })) : celdas;

  return (
    <p className={"flex gap-[0.12em] font-mono font-bold uppercase leading-none " + className}>
      <span className="sr-only">{texto}</span>
      {mostrar.map((c, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={"flap-celda" + (c.ch === " " ? " flap-vacia" : "") + (c.n > 0 ? " flap-cae" : "")}
        >
          <span key={c.n}>{c.ch === " " ? " " : c.ch}</span>
        </span>
      ))}
    </p>
  );
}
