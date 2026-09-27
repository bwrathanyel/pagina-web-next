"use client";

import { useEffect, useId, useRef, useState } from "react";
import "./solcito.css";

// Solcito: la mascota de los juegos del stand (ruleta-evento/public/mascot.js), portada a React.
// El estado vive en data-mood/eyes/mouth/arms y todas las animaciones están en solcito.css.

export type SolcitoMood =
  | "idle"
  | "happy"
  | "sad"
  | "eager"
  | "peek"
  | "wink"
  | "love"
  | "twirl"
  | "wave"
  | "look"
  | "cool"
  | "nervous"
  | "think"
  | "listen";

const MOODS: Record<SolcitoMood, { eyes: string; mouth: string; arms: string; acc?: string }> = {
  idle: { eyes: "normal", mouth: "smile", arms: "down" },
  happy: { eyes: "happy", mouth: "open", arms: "up" },
  sad: { eyes: "sad", mouth: "flat", arms: "down" },
  eager: { eyes: "normal", mouth: "open", arms: "up" },
  peek: { eyes: "normal", mouth: "o", arms: "cover" },
  wink: { eyes: "wink", mouth: "smile", arms: "up" },
  love: { eyes: "heart", mouth: "open", arms: "up" },
  twirl: { eyes: "happy", mouth: "open", arms: "up" },
  wave: { eyes: "happy", mouth: "open", arms: "wave" },
  look: { eyes: "normal", mouth: "smile", arms: "down" },
  cool: { eyes: "normal", mouth: "smile", arms: "down", acc: "shades" },
  nervous: { eyes: "normal", mouth: "o", arms: "cheeks" },
  think: { eyes: "normal", mouth: "o", arms: "chin" },
  listen: { eyes: "happy", mouth: "o", arms: "cheeks" },
};

// Gestos sueltos mientras está tranquilo: [estado, globo, duración ms].
export type SolcitoGesto = [SolcitoMood, string, number];
const GESTOS_BASE: SolcitoGesto[] = [
  ["wave", "¡Hola!", 1700],
  ["look", "¿Adónde vamos?", 1900],
  ["wink", "Tengo ofertas", 1500],
  ["cool", "Modo vacaciones", 2400],
  ["twirl", "", 1000],
];
const CALMOS = new Set<SolcitoMood>(["idle", "wave", "look", "wink", "cool", "twirl"]);
const COLORES_CHISPA = ["var(--sol-gold)", "var(--sol-orange)", "var(--sol-seafoam)", "var(--sol-card)"];

const ola = (y: number) => `M0 ${y}q12 -7 24 0${"t24 0".repeat(10)}`;

function espiral(cx: number, cy: number) {
  return `M${cx + 1} ${cy}a1 1 0 1 1 2 0a3 3 0 1 1 -6 0a5 5 0 1 1 10 0a7 7 0 1 1 -14 0`;
}

function corazon(cx: number, cy: number) {
  return `M${cx} ${cy + 8}C${cx - 13} ${cy - 1} ${cx - 8} ${cy - 12} ${cx} ${cy - 5}C${cx + 8} ${cy - 12} ${cx + 13} ${cy - 1} ${cx} ${cy + 8}Z`;
}

function rayos() {
  let d = "";
  for (let i = 0; i < 12; i += 1) {
    const a = (i * Math.PI) / 6;
    const p = (r: number) => `${(110 + r * Math.cos(a)).toFixed(1)} ${(110 + r * Math.sin(a)).toFixed(1)}`;
    d += `M${p(95)}L${p(108)}`;
  }
  return d;
}
const RAYOS = rayos();

function Brazo({ lado, x0, cx, x1 }: { lado: "l" | "r"; x0: number; cx: number; x1: number }) {
  const d = `M${x0} 124Q${cx} 130 ${x1} 146`;
  return (
    <g className={`m-arm m-arm-${lado}`}>
      <path className="m-arm-edge" d={d} />
      <path className="m-arm-line" d={d} />
      <circle cx={x1} cy="146" r="8.5" />
    </g>
  );
}

type Props = {
  /** Estado base. Los gestos pasajeros vuelven a este. */
  mood?: SolcitoMood;
  /** Ancho y alto en px. */
  size?: number;
  /** Hace gestos sueltos cuando está tranquilo. */
  gestos?: boolean | SolcitoGesto[];
  /** Cada cambio de valor dispara chispas. */
  chispas?: number;
  /** Texto del gesto actual, para que el padre lo muestre en un globo. */
  onDecir?: (texto: string) => void;
  /** Los ojos siguen al puntero. */
  mirar?: boolean;
  className?: string;
};

export default function Solcito({ mood = "idle", size = 64, gestos = false, chispas = 0, onDecir, mirar = true, className = "" }: Props) {
  const id = useId().replace(/:/g, "");
  const raiz = useRef<HTMLDivElement>(null);
  const fx = useRef<HTMLDivElement>(null);
  const [gesto, setGesto] = useState<SolcitoMood | null>(null);
  const decir = useRef(onDecir);
  useEffect(() => {
    decir.current = onDecir;
  }, [onDecir]);

  const actual = gesto ?? mood;
  const m = MOODS[actual];

  // Si el padre cambia el estado, se corta cualquier gesto en curso.
  const [moodPrevio, setMoodPrevio] = useState(mood);
  if (mood !== moodPrevio) {
    setMoodPrevio(mood);
    setGesto(null);
  }

  // Gestos sueltos cada ~6 s mientras el estado base es tranquilo.
  useEffect(() => {
    if (!gestos || !CALMOS.has(mood)) return;
    const lista = Array.isArray(gestos) ? gestos : GESTOS_BASE;
    let i = Math.floor(Math.random() * lista.length);
    let fin = 0;
    const loop = window.setInterval(() => {
      if (document.hidden) return;
      const [nombre, texto, ms] = lista[i];
      i = (i + 1) % lista.length;
      setGesto(nombre);
      if (texto) decir.current?.(texto);
      fin = window.setTimeout(() => {
        setGesto(null);
        decir.current?.("");
      }, ms);
    }, 6200);
    return () => {
      window.clearInterval(loop);
      window.clearTimeout(fin);
    };
  }, [gestos, mood]);

  // Los ojos siguen al puntero (máx. 6 unidades del viewBox).
  useEffect(() => {
    if (!mirar) return;
    let raf = 0;
    const mover = (e: PointerEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const el = raiz.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        if (!r.width) return;
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height * 0.45);
        const k = 6 / Math.max(60, Math.hypot(dx, dy));
        el.style.setProperty("--gx", (dx * k).toFixed(2));
        el.style.setProperty("--gy", (dy * k * 0.7).toFixed(2));
      });
    };
    document.addEventListener("pointermove", mover, { passive: true });
    return () => {
      document.removeEventListener("pointermove", mover);
      cancelAnimationFrame(raf);
    };
  }, [mirar]);

  // Chispas de festejo.
  useEffect(() => {
    if (!chispas || !fx.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const n = 12;
    const caja = fx.current;
    for (let i = 0; i < n; i += 1) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.4;
      const d = 0.5 + Math.random() * 0.45;
      const s = document.createElement("i");
      s.className = i % 2 ? "sol-chispa redonda" : "sol-chispa";
      s.style.setProperty("--dx", `${(Math.cos(a) * d * size).toFixed(1)}px`);
      s.style.setProperty("--dy", `${(Math.sin(a) * d * size).toFixed(1)}px`);
      s.style.setProperty("--c", COLORES_CHISPA[i % COLORES_CHISPA.length]);
      caja.append(s);
      window.setTimeout(() => s.remove(), 950);
    }
  }, [chispas, size]);

  return (
    <div
      ref={raiz}
      className={`solcito ${className}`}
      style={{ width: size, height: size }}
      data-mood={actual}
      data-eyes={m.eyes}
      data-mouth={m.mouth}
      data-arms={m.arms}
      data-acc={m.acc ?? ""}
      aria-hidden="true"
    >
      <svg className="sol-svg" viewBox="0 0 220 220">
        <defs>
          <linearGradient id={`${id}-sol`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" style={{ stopColor: "var(--sol-gold)" }} />
            <stop offset="1" style={{ stopColor: "var(--sol-orange)" }} />
          </linearGradient>
          <clipPath id={`${id}-clip`}>
            <circle cx="110" cy="110" r="62" />
          </clipPath>
        </defs>
        <ellipse className="m-shadow" cx="110" cy="204" rx="44" ry="7" />
        <g className="m-body">
          <path className="m-rays" d={RAYOS} />
          <circle className="m-ring" cx="110" cy="110" r="84" />
          <circle cx="110" cy="110" r="62" fill={`url(#${id}-sol)`} />
          <g className="m-sea" clipPath={`url(#${id}-clip)`}>
            <path className="m-wave" d={ola(150)} />
            <path className="m-wave w2" d={ola(163)} />
          </g>
          <g className="m-face">
            <circle className="m-cheek" cx="74" cy="118" r="8" />
            <circle className="m-cheek" cx="146" cy="118" r="8" />
            <g className="m-gaze">
              <g className="m-eyes m-eyes-wink">
                <path d="M82 103q8 -11 16 0" />
                <ellipse cx="130" cy="100" rx="7" ry="9.5" />
                <circle className="m-glint" cx="132.5" cy="96" r="2.6" />
              </g>
              <g className="m-eyes m-eyes-heart">
                <path className="m-heart" d={corazon(90, 100)} />
                <path className="m-heart" d={corazon(130, 100)} />
              </g>
              <g className="m-eyes m-eyes-normal">
                <g className="m-eye">
                  <ellipse cx="90" cy="100" rx="7" ry="9.5" />
                  <circle className="m-glint" cx="92.5" cy="96" r="2.6" />
                </g>
                <g className="m-eye">
                  <ellipse cx="130" cy="100" rx="7" ry="9.5" />
                  <circle className="m-glint" cx="132.5" cy="96" r="2.6" />
                </g>
              </g>
              <g className="m-eyes m-eyes-happy">
                <path d="M82 103q8 -11 16 0" />
                <path d="M122 103q8 -11 16 0" />
              </g>
              <g className="m-eyes m-eyes-dizzy">
                <path className="m-spiral" d={espiral(90, 100)} />
                <path className="m-spiral" d={espiral(130, 100)} />
              </g>
              <g className="m-eyes m-eyes-sad">
                <path d="M82 99q8 6 16 0" />
                <path d="M122 99q8 6 16 0" />
              </g>
              <g className="m-shades">
                <rect x="73" y="88" width="32" height="21" rx="8" />
                <rect x="115" y="88" width="32" height="21" rx="8" />
                <path d="M104 96h12M73 94l-9 -4M147 94l9 -4" />
                <path className="m-shades-glint" d="M80 93h9M122 93h9" />
              </g>
            </g>
            <path className="m-tear" d="M86 112q5 7 5 10a5 5 0 0 1 -10 0q0 -3 5 -10z" />
            <path className="m-mouth m-mouth-smile" d="M98 117q12 13 24 0" />
            <path className="m-mouth m-mouth-open" d="M95 115h30q0 20 -15 20t-15 -20z" />
            <ellipse className="m-mouth m-mouth-o" cx="110" cy="124" rx="6" ry="7" />
            <path className="m-mouth m-mouth-flat" d="M100 128q10 -8 20 0" />
          </g>
          <Brazo lado="l" x0={52} cx={36} x1={26} />
          <Brazo lado="r" x0={168} cx={184} x1={194} />
          <path className="m-drop" d="M166 64q8 11 8 16a8 8 0 0 1 -16 0q0 -5 8 -16z" />
          <g className="m-dots">
            <circle cx="150" cy="44" r="6" />
            <circle cx="170" cy="30" r="7.5" />
            <circle cx="193" cy="14" r="9" />
          </g>
        </g>
      </svg>
      <div ref={fx} className="sol-fx" />
    </div>
  );
}
