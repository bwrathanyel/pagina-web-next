import { selloDestino } from "@/lib/arte";

/* Detalle animado propio de cada destino sobre la foto del hero (pedido del
   dueño, 2026-11-19): viento en Mérida, sol en Margarita... Capa decorativa
   bajo los velos (el texto conserva su contraste), solo transform, opacity y
   stroke-dashoffset; CSS en globals.css («Clima del destino»). */

const CLIMAS = new Set(["merida", "margarita"]);

export function climaDe(destino: string | undefined): string | undefined {
  const slug = destino ? selloDestino(destino) : undefined;
  return slug && CLIMAS.has(slug) ? slug : undefined;
}

// Ráfagas cruzando de lado a lado: dos a la altura del tablero, tres a la del
// titular y el pase. Las marcadas `lejos` no van en el teléfono.
const RAFAGAS = [
  { d: "M-40 190 C 180 150, 360 230, 600 185 S 1000 140, 1240 200", lejos: false },
  { d: "M-40 245 C 220 215, 420 280, 660 240 S 1020 205, 1240 250", lejos: true },
  { d: "M-40 430 C 200 395, 400 470, 640 425 S 1010 385, 1240 440", lejos: false },
  { d: "M-40 485 C 240 455, 460 525, 700 480 S 1040 445, 1240 495", lejos: true },
  { d: "M-40 560 C 180 530, 420 600, 660 555 S 1000 520, 1240 570", lejos: false },
];

function Merida() {
  return (
    <>
      <div className="clima-niebla clima-niebla-1" />
      <div className="clima-niebla clima-niebla-2" />
      <svg className="clima-viento absolute inset-0 size-full" viewBox="0 0 1200 800" preserveAspectRatio="none">
        {RAFAGAS.map((r) => (
          <path
            key={r.d}
            d={r.d}
            pathLength={1000}
            vectorEffect="non-scaling-stroke"
            className={"clima-rafaga" + (r.lejos ? " clima-lejos" : "")}
          />
        ))}
      </svg>
    </>
  );
}

function Margarita() {
  return (
    <div className="clima-sol">
      <div className="clima-sol-rayos" />
      <div className="clima-sol-halo" />
    </div>
  );
}

export function ClimaDestino({ clima }: { clima: string }) {
  if (clima === "merida") return <Merida />;
  if (clima === "margarita") return <Margarita />;
  return null;
}
