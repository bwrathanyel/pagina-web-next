"use client";

import {
  useEffect,
  useEffectEvent,
  useId,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, m, useDragControls } from "motion/react";
import { Icono } from "@/components/ui/Icono";

// Panel superpuesto único del sitio. En el teléfono siempre es hoja inferior
// (al alcance del pulgar, se cierra arrastrando hacia abajo); en escritorio es
// panel lateral o diálogo centrado. Modal.tsx es este mismo componente con
// `escritorio="centrado"`.
//
// Accesibilidad: foco atrapado adentro, Esc cierra, el foco vuelve al botón que
// la abrió y el fondo no scrollea. Hojas apiladas (un Modal abierto desde el
// carrito) se respetan: solo la de arriba escucha el teclado.

type Modo = "movil" | "lateral" | "centrado";

const MQ_ESCRITORIO = "(min-width: 64rem)";
const suscribirMq = (cb: () => void) => {
  const mq = window.matchMedia(MQ_ESCRITORIO);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const leerMq = () => window.matchMedia(MQ_ESCRITORIO).matches;
const sinSuscripcion = () => () => {};

const ENFOCABLES =
  'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"]),[contenteditable="true"]';

const pila: object[] = [];
let overflowPrevio = "";

const EASE_SALIDA = [0.22, 1, 0.36, 1] as const;
const EASE_ENTRADA_SALIDA = [0.65, 0, 0.35, 1] as const;
const SALIDA = { duration: 0.22, ease: EASE_ENTRADA_SALIDA };

const MOVIMIENTO = {
  movil: {
    initial: { y: "100%" },
    animate: { y: 0 },
    exit: { y: "100%", transition: SALIDA },
  },
  lateral: {
    initial: { x: "100%" },
    animate: { x: 0 },
    exit: { x: "100%", transition: SALIDA },
  },
  centrado: {
    initial: { opacity: 0, y: 12, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 8, scale: 0.98, transition: SALIDA },
  },
} as const;

const CONTENEDOR: Record<Modo, string> = {
  movil: "items-end",
  lateral: "justify-end",
  centrado: "items-center justify-center p-6",
};

const PANEL: Record<Modo, string> = {
  movil: "max-h-[88dvh] w-full rounded-t-card pb-[env(safe-area-inset-bottom)]",
  lateral: "h-full w-full",
  centrado: "max-h-[90dvh] w-full rounded-card",
};

function atraparFoco(e: KeyboardEvent, panel: HTMLElement | null) {
  if (!panel) return;
  const items = Array.from(panel.querySelectorAll<HTMLElement>(ENFOCABLES)).filter(
    (el) => el.getClientRects().length > 0,
  );
  const activo = document.activeElement;
  if (items.length === 0) {
    e.preventDefault();
    panel.focus();
    return;
  }
  const primero = items[0];
  const ultimo = items[items.length - 1];
  const afuera = !panel.contains(activo) || activo === panel;
  if (e.shiftKey && (activo === primero || afuera)) {
    e.preventDefault();
    ultimo.focus();
  } else if (!e.shiftKey && (activo === ultimo || afuera)) {
    e.preventDefault();
    primero.focus();
  }
}

export type HojaProps = {
  abierta: boolean;
  onCerrar: () => void;
  titulo: string;
  children: ReactNode;
  /** Cómo se presenta en escritorio. En el teléfono siempre es hoja inferior. */
  escritorio?: "lateral" | "centrado";
  /** Va antes del título (ej. el badge de WhatsApp del Modal). */
  icono?: ReactNode;
  /** Zona fija al pie, fuera del scroll (ej. total del carrito + botón). */
  pie?: ReactNode;
  /** Corre cuando terminó la animación de salida. */
  onSalida?: () => void;
  /** Ancho máximo en escritorio. */
  anchoClassName?: string;
};

export function Hoja({
  abierta,
  onCerrar,
  titulo,
  children,
  escritorio = "lateral",
  icono,
  pie,
  onSalida,
  anchoClassName = "lg:max-w-md",
}: HojaProps) {
  const montado = useSyncExternalStore(sinSuscripcion, () => true, () => false);
  const esEscritorio = useSyncExternalStore(suscribirMq, leerMq, () => false);
  const modo: Modo = esEscritorio ? escritorio : "movil";
  const panelRef = useRef<HTMLDivElement>(null);
  const tituloId = useId();
  const arrastre = useDragControls();

  const alTeclado = useEffectEvent((e: KeyboardEvent, token: object) => {
    if (pila[pila.length - 1] !== token) return;
    if (e.key === "Escape") {
      e.preventDefault();
      onCerrar();
    } else if (e.key === "Tab") {
      atraparFoco(e, panelRef.current);
    }
  });

  useEffect(() => {
    if (!abierta) return;
    const token = {};
    pila.push(token);
    const raiz = document.documentElement;
    if (pila.length === 1) {
      overflowPrevio = raiz.style.overflow;
      raiz.style.overflow = "hidden";
    }
    const previo = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    // El foco va al panel, no al primer input: en el teléfono eso abriría el
    // teclado encima de lo que la persona todavía no leyó. [data-autofocus]
    // lo pide explícito (ej. el buscador).
    const frame = requestAnimationFrame(() => {
      const panel = panelRef.current;
      (panel?.querySelector<HTMLElement>("[data-autofocus]") ?? panel)?.focus({ preventScroll: true });
    });
    const onKey = (e: KeyboardEvent) => alTeclado(e, token);
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKey);
      pila.splice(pila.indexOf(token), 1);
      if (pila.length === 0) raiz.style.overflow = overflowPrevio;
      if (previo?.isConnected) previo.focus({ preventScroll: true });
    };
  }, [abierta]);

  if (!montado) return null;

  const esMovil = modo === "movil";

  // Portal a document.body: un ancestro con backdrop-blur/filter (el navbar)
  // crea un containing block nuevo para position:fixed y la hoja quedaba
  // encuadrada dentro de él.
  return createPortal(
    <AnimatePresence onExitComplete={onSalida}>
      {abierta ? (
        <m.div key="hoja" className={"fixed inset-0 z-[60] flex " + CONTENEDOR[modo]}>
          <m.div
            aria-hidden="true"
            className="absolute inset-0 bg-dusk/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: SALIDA }}
            transition={{ duration: 0.2 }}
            onClick={onCerrar}
          />
          <m.div
            key={modo}
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={tituloId}
            tabIndex={-1}
            className={
              "relative flex flex-col bg-card text-ink shadow-lift focus:outline-hidden " +
              PANEL[modo] +
              (esMovil ? "" : " " + anchoClassName)
            }
            {...MOVIMIENTO[modo]}
            transition={{ duration: 0.32, ease: EASE_SALIDA }}
            drag={esMovil ? "y" : false}
            dragControls={arrastre}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.7 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 110 || info.velocity.y > 500) onCerrar();
            }}
          >
            <div
              className={"shrink-0" + (esMovil ? " touch-none" : "")}
              onPointerDown={esMovil ? (e) => arrastre.start(e) : undefined}
            >
              {esMovil ? (
                <span aria-hidden="true" className="mx-auto mt-2.5 block h-1 w-10 rounded-pill bg-linea-fuerte" />
              ) : null}
              <div className={"flex items-center gap-3 px-5 pb-3 " + (esMovil ? "pt-2" : "pt-5")}>
                {icono}
                <h2
                  id={tituloId}
                  className="min-w-0 flex-1 font-display text-2xl font-bold leading-tight tracking-tight text-balance text-ink"
                >
                  {titulo}
                </h2>
                <button
                  type="button"
                  onClick={onCerrar}
                  aria-label="Cerrar"
                  className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-pill text-ink-soft transition-colors duration-150 hover:bg-sand-2 hover:text-ink"
                >
                  <Icono nombre="cerrar" />
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5">{children}</div>
            {pie ? <div className="shrink-0 border-t border-linea px-5 py-4">{pie}</div> : null}
          </m.div>
        </m.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
