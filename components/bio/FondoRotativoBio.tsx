"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";

const MS_POR_FOTO = 6000;
const SEG_CRUCE = 1.5;
/* Misma curva que usa Hero.tsx para el cruce entre fotos -- consistencia de
   movimiento en todo el sitio. */
const CURVA = [0.22, 1, 0.36, 1] as const;

function barajar<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let k = a.length - 1; k > 0; k--) {
    const j = Math.floor(Math.random() * (k + 1));
    [a[k], a[j]] = [a[j], a[k]];
  }
  return a;
}

/** Fondo de foto rotativa para las páginas puente de bio: mismo patrón de
 * cruce que el Hero de la home, pero desenfocado y oscurecido a propósito --
 * acá es textura de fondo, no la protagonista. */
export function FondoRotativoBio({ fotos }: { fotos: { url: string; alt: string }[] }) {
  const [orden, setOrden] = useState(fotos);
  const [i, setI] = useState(0);
  const [cargadas, setCargadas] = useState<Set<number>>(() => new Set([0]));
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrden(barajar(fotos));
    setI(0);
    setCargadas(new Set([0]));
  }, [fotos]);

  useEffect(() => {
    const alCambiar = () => setVisible(document.visibilityState === "visible");
    alCambiar();
    document.addEventListener("visibilitychange", alCambiar);
    return () => document.removeEventListener("visibilitychange", alCambiar);
  }, []);

  const rotando = orden.length > 1;

  useEffect(() => {
    if (!rotando || !visible) return;
    const t = setInterval(() => {
      setI((v) => {
        for (let paso = 1; paso < orden.length; paso++) {
          const siguiente = (v + paso) % orden.length;
          if (cargadas.has(siguiente)) return siguiente;
        }
        return v;
      });
    }, MS_POR_FOTO);
    return () => clearInterval(t);
  }, [rotando, visible, orden.length, cargadas]);

  const actual = orden[i];
  if (!actual) return null;

  const marcarCargada = (idx: number) =>
    setCargadas((prev) => (prev.has(idx) ? prev : new Set(prev).add(idx)));

  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      <AnimatePresence initial={false}>
        <motion.div
          key={actual.url}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: SEG_CRUCE, ease: CURVA }}
        >
          <Image
            src={actual.url}
            alt=""
            fill
            sizes="100vw"
            className="scale-110 object-cover blur-2xl"
            priority={i === 0}
            onLoad={() => marcarCargada(i)}
          />
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-b from-dusk/90 via-dusk-2/80 to-dusk/95" />
    </div>
  );
}
