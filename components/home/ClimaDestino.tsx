import type { CSSProperties } from "react";
import { selloDestino } from "@/lib/arte";

/* Detalle animado propio de cada destino sobre la foto del hero (pedido del
   dueño, 2026-11-19): viento en Mérida, sol en Margarita... Capa decorativa
   bajo los velos (el texto conserva su contraste), solo transform, opacity y
   stroke-dashoffset; CSS en globals.css («Clima del destino»). Las piezas
   marcadas `clima-lejos` no van en el teléfono. */

const CLIMAS = new Set([
  "merida",
  "margarita",
  "los-roques",
  "morrocoy",
  "coche",
  "canaima",
  "catatumbo",
  "colonia-tovar",
  "caracas",
  "extranjero",
]);

export function climaDe(destino: string | undefined): string | undefined {
  const slug = destino ? selloDestino(destino) : undefined;
  return slug && CLIMAS.has(slug) ? slug : undefined;
}

const orden = (n: number) => ({ "--n": n }) as CSSProperties;
const lugar = (x: number, y: number, n: number) => ({ left: `${x}%`, top: `${y}%`, "--n": n }) as CSSProperties;

// Ráfagas cruzando de lado a lado: dos a la altura del tablero, tres a la del
// titular y el pase.
const RAFAGAS = [
  { d: "M-40 190 C 180 150, 360 230, 600 185 S 1000 140, 1240 200", lejos: false },
  { d: "M-40 245 C 220 215, 420 280, 660 240 S 1020 205, 1240 250", lejos: true },
  { d: "M-40 430 C 200 395, 400 470, 640 425 S 1010 385, 1240 440", lejos: false },
  { d: "M-40 485 C 240 455, 460 525, 700 480 S 1040 445, 1240 495", lejos: true },
  { d: "M-40 560 C 180 530, 420 600, 660 555 S 1000 520, 1240 570", lejos: false },
];

function Viento({ rafagas, suave = false }: { rafagas: typeof RAFAGAS; suave?: boolean }) {
  return (
    <svg className="clima-viento absolute inset-0 size-full" viewBox="0 0 1200 800" preserveAspectRatio="none">
      {rafagas.map((r) => (
        <path
          key={r.d}
          d={r.d}
          pathLength={1000}
          vectorEffect="non-scaling-stroke"
          className={"clima-rafaga" + (suave ? " clima-brisa" : "") + (r.lejos ? " clima-lejos" : "")}
        />
      ))}
    </svg>
  );
}

function Niebla({ capas }: { capas: number }) {
  return (
    <>
      {Array.from({ length: capas }, (_, n) => (
        <div key={n} className={`clima-niebla clima-niebla-${n + 1}`} />
      ))}
    </>
  );
}

const DESTELLOS = [
  [10, 58], [19, 64], [28, 55], [37, 67], [46, 52], [55, 61], [63, 69], [72, 56], [81, 63], [90, 58],
];

function LosRoques() {
  return (
    <>
      <div className="clima-cenit" />
      {DESTELLOS.map(([x, y], n) => (
        <span key={n} className={"clima-destello" + (n % 2 ? " clima-lejos" : "")} style={lugar(x, y, n)} />
      ))}
    </>
  );
}

function Morrocoy() {
  return (
    <>
      {[0, 1, 2, 3].map((n) => (
        <div key={n} className={"clima-reflejo" + (n > 1 ? " clima-lejos" : "")} style={orden(n)} />
      ))}
      <Viento rafagas={[RAFAGAS[0], RAFAGAS[2]]} suave />
    </>
  );
}

function Coche() {
  return (
    <>
      {[0, 1, 2, 3, 4].map((n) => (
        <div key={n} className={"clima-ola" + (n % 2 ? " clima-lejos" : "")} style={orden(n)} />
      ))}
      <Viento rafagas={[RAFAGAS[2]]} suave />
    </>
  );
}

function Canaima() {
  return (
    <>
      <div className="clima-arcoiris" />
      <div className="clima-bruma" />
      <div className="clima-bruma clima-bruma-2 clima-lejos" />
    </>
  );
}

function Catatumbo() {
  return (
    <>
      <div className="clima-relampago" />
      <div className="clima-relampago clima-relampago-2 clima-lejos" />
    </>
  );
}

function Caracas() {
  return (
    <>
      {[0, 1, 2].map((n) => (
        <div key={n} className={"clima-nube" + (n === 2 ? " clima-lejos" : "")} style={orden(n)} />
      ))}
    </>
  );
}

function Extranjero() {
  return (
    <svg className="absolute inset-0 size-full" viewBox="0 0 1200 800" preserveAspectRatio="none">
      <path d="M-60 560 C 300 420, 700 250, 1260 90" pathLength={1000} vectorEffect="non-scaling-stroke" className="clima-estela" />
    </svg>
  );
}

export function ClimaDestino({ clima }: { clima: string }) {
  switch (clima) {
    case "merida":
      return (
        <>
          <Niebla capas={2} />
          <Viento rafagas={RAFAGAS} />
        </>
      );
    case "margarita":
      return (
        <div className="clima-sol">
          <div className="clima-sol-rayos" />
          <div className="clima-sol-halo" />
        </div>
      );
    case "los-roques":
      return <LosRoques />;
    case "morrocoy":
      return <Morrocoy />;
    case "coche":
      return <Coche />;
    case "canaima":
      return <Canaima />;
    case "catatumbo":
      return <Catatumbo />;
    case "colonia-tovar":
      return <Niebla capas={3} />;
    case "caracas":
      return <Caracas />;
    case "extranjero":
      return <Extranjero />;
    default:
      return null;
  }
}
