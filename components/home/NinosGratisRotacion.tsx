"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useReducedMotion } from "motion/react";
import { Boleto } from "@/components/ui/Boleto";
import { Icono } from "@/components/ui/Icono";
import { PrecioMostrado } from "@/components/ui/PrecioMostrado";
import { SelloNinoGratis } from "@/components/catalogo/SelloNinoGratis";
import { diaMes, type HotelNinoGratis } from "@/lib/promociones/ninosGratis";

// Mismo tiempo por foto que el hero: las dos rotaciones se sienten del mismo sitio.
const MS_POR_HOTEL = 8000;

function Cuenta({ h }: { h: HotelNinoGratis }) {
  if (h.dias === null || !h.hasta) return null;
  return (
    <span className="absolute left-3.5 top-3.5 z-10 inline-flex min-h-8 items-center gap-2 rounded-pill bg-dusk px-3 text-xs font-semibold text-dusk-text">
      <Icono nombre="calendario" tamano={14} />
      {h.dias === 0 ? (
        <b className="font-mono text-gold">Último día</b>
      ) : (
        <span>
          Queda{h.dias === 1 ? "" : "n"} <b className="font-mono text-gold">{h.dias} {h.dias === 1 ? "día" : "días"}</b>
        </span>
      )}
      <span className="text-dusk-text-soft">· hasta el {diaMes(h.hasta)}</span>
    </span>
  );
}

function Precios({ h, cantidad, grande }: { h: HotelNinoGratis; cantidad: number; grande?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      {h.precio ? (
        <div>
          <span className="block text-xs text-ink-soft">Adulto, por noche</span>
          <span className={"font-mono font-bold leading-tight text-ink tabular-nums " + (grande ? "text-xl" : "text-base")}>
            <PrecioMostrado texto={h.precio} />
          </span>
        </div>
      ) : null}
      <SelloNinoGratis cantidad={cantidad} />
    </div>
  );
}

const condicion = (h: HotelNinoGratis) => (h.hasta ? `Viajando hasta el ${diaMes(h.hasta)}` : null);

function Destacado({ h, cantidad }: { h: HotelNinoGratis; cantidad: number }) {
  return (
    <Link href={h.href} className="group block rounded-card transition-transform duration-150 ease-salida active:scale-[0.985]">
      <Boleto
        orientacion="h"
        tamanoTalon="4.25rem"
        talon={
          <div className="flex h-full items-center justify-between gap-4 px-5">
            <Precios h={h} cantidad={cantidad} grande />
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-coral-bright text-btn-ink">
              <Icono nombre="flecha-der" tamano={18} />
              <span className="sr-only">Ver {h.hotel}</span>
            </span>
          </div>
        }
      >
        <div className="relative aspect-[2/1] overflow-hidden bg-sand-2">
          {h.foto ? (
            <Image
              src={h.foto}
              alt=""
              fill
              sizes="(min-width: 1280px) 42rem, (min-width: 1024px) 55vw, 100vw"
              className="object-cover transition-[scale] duration-700 ease-salida group-hover:scale-[1.04]"
            />
          ) : null}
          <Cuenta h={h} />
        </div>
        <div className="px-5 pb-3 pt-4">
          <p className="text-balance font-display text-[clamp(1.4rem,2.2vw,1.8rem)] font-bold leading-[1.05] text-ink">{h.hotel}</p>
          <p className="mt-1 text-sm text-ink-soft">Margarita{h.plan ? ` · ${h.plan}` : ""}</p>
          {condicion(h) ? <p className="mt-1.5 text-sm text-ink">{condicion(h)}.</p> : null}
        </div>
      </Boleto>
    </Link>
  );
}

function Secundario({ h, cantidad }: { h: HotelNinoGratis; cantidad: number }) {
  return (
    <Link
      href={h.href}
      className="group flex h-full overflow-hidden rounded-card border border-linea bg-card text-ink transition-transform duration-150 ease-salida active:scale-[0.985]"
    >
      <div className="relative min-h-28 w-[32%] shrink-0 overflow-hidden bg-sand-2">
        {h.foto ? (
          <Image
            src={h.foto}
            alt=""
            fill
            sizes="(min-width: 1024px) 12rem, (min-width: 640px) 18vw, 36vw"
            className="object-cover transition-[scale] duration-700 ease-salida group-hover:scale-[1.04]"
          />
        ) : null}
      </div>
      <div className="min-w-0 flex-1 px-3.5 py-3">
        <p className="font-display text-lg font-bold leading-[1.05]">{h.hotel}</p>
        <p className="mt-1 text-xs text-ink-soft">{[h.plan, condicion(h)].filter(Boolean).join(" · ")}</p>
        <div className="mt-2">
          <Precios h={h} cantidad={cantidad} />
        </div>
      </div>
    </Link>
  );
}

/** Un lugar de la grilla con todos los hoteles apilados en la misma celda: el
 * alto es el del más alto y no salta al rotar. Solo el activo se ve y recibe
 * foco; los demás quedan `inert`. */
function Lugar({
  hoteles,
  activo,
  suave,
  render,
}: {
  hoteles: HotelNinoGratis[];
  activo: number;
  suave: boolean;
  render: (h: HotelNinoGratis) => ReactNode;
}) {
  return (
    <div className="grid">
      {hoteles.map((h, k) => {
        const visible = k === activo;
        return (
          <div
            key={h.id}
            aria-hidden={!visible}
            inert={!visible}
            className={
              "[grid-area:1/1] " +
              (suave ? "transition-opacity duration-500 ease-salida " : "") +
              (visible ? "opacity-100" : "pointer-events-none opacity-0")
            }
          >
            {render(h)}
          </div>
        );
      })}
    </div>
  );
}

/** Columna derecha de la banda de niños gratis: el hotel en grande y dos más
 * debajo van rotando en círculo (pedido del dueño, 2026-11-10), para que no
 * quede siempre el mismo —el más barato— adelante. El servidor pinta el orden
 * de la lista y al montar se elige un arranque al azar (un Math.random() en el
 * init de useState sería mismatch de hidratación, ver Hero). Se para con la
 * pestaña oculta, con la banda fuera de pantalla y con el mouse o el foco
 * encima de las tarjetas. */
export function NinosGratisRotacion({ hoteles, cantidad }: { hoteles: HotelNinoGratis[]; cantidad: number }) {
  const n = hoteles.length;
  const [inicio, setInicio] = useState(0);
  const [pestanaVisible, setPestanaVisible] = useState(true);
  const [enPantalla, setEnPantalla] = useState(false);
  const [encima, setEncima] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const suave = !useReducedMotion();
  const rota = n > 1;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (n > 1) setInicio(Math.floor(Math.random() * n));
  }, [n]);

  useEffect(() => {
    const alCambiar = () => setPestanaVisible(document.visibilityState === "visible");
    alCambiar();
    document.addEventListener("visibilitychange", alCambiar);
    return () => document.removeEventListener("visibilitychange", alCambiar);
  }, []);

  useEffect(() => {
    const el = raiz.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([e]) => setEnPantalla(e.isIntersecting), { threshold: 0.2 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const activo = rota && pestanaVisible && enPantalla && !encima;
  useEffect(() => {
    if (!activo) return;
    const t = setTimeout(() => setInicio((v) => (v + 1) % n), MS_POR_HOTEL);
    return () => clearTimeout(t);
  }, [activo, inicio, n]);

  if (n === 0) return null;
  const en = (paso: number) => (inicio + paso) % n;
  const secundarios = Math.min(2, n - 1);

  return (
    <div
      ref={raiz}
      className="grid gap-3"
      onMouseEnter={() => setEncima(true)}
      onMouseLeave={() => setEncima(false)}
      onFocus={() => setEncima(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setEncima(false);
      }}
    >
      <Lugar hoteles={hoteles} activo={en(0)} suave={suave} render={(h) => <Destacado h={h} cantidad={cantidad} />} />
      {secundarios > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: secundarios }, (_, k) => (
            <Lugar
              key={k}
              hoteles={hoteles}
              activo={en(k + 1)}
              suave={suave}
              render={(h) => <Secundario h={h} cantidad={cantidad} />}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
