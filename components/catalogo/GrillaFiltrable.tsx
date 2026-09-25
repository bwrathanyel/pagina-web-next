"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { CatalogoGrid } from "@/components/catalogo/CatalogoGrid";
import { DestinoChips } from "@/components/catalogo/DestinoChips";

export type EntradaGrilla = {
  id: string | number;
  destino: string;
  /** Número de montoOrden(); null = sin precio comparable, va al final. */
  monto: number | null;
  tarjeta: React.ReactNode;
};

type Orden = "recomendadas" | "precio";

// El destino inicial sale de `?destino=` (las tiras de destino de la home
// enlazan así). La página sigue estática: el servidor pinta "Todos" y el
// cliente toma el parámetro al hidratar, sin useSearchParams (que sacaría la
// grilla del HTML del servidor). Elegir un chip reescribe el parámetro con
// replaceState para que el enlace se pueda compartir.
const suscribirUrl = (aviso: () => void) => {
  window.addEventListener("popstate", aviso);
  return () => window.removeEventListener("popstate", aviso);
};
const destinoDeUrl = () => new URLSearchParams(window.location.search).get("destino");

/** Grilla con chips de destino y orden "Recomendadas / Menor precio". Las
 * tarjetas llegan ya pintadas (del servidor o del padre); acá solo se filtran
 * y se reordenan. `fijo` pega los chips bajo la barra: solo donde no hay otra
 * fila fija (en las categorías ya están las pestañas). */
export function GrillaFiltrable({
  entradas,
  destinos,
  fijo = false,
  nombre = ["opción", "opciones"],
  vacio,
}: {
  entradas: EntradaGrilla[];
  destinos: string[];
  fijo?: boolean;
  nombre?: [string, string];
  vacio: string;
}) {
  const desdeUrl = useSyncExternalStore(suscribirUrl, destinoDeUrl, () => null);
  const [elegido, setElegido] = useState<string | null | undefined>(undefined);
  const [orden, setOrden] = useState<Orden>("recomendadas");
  const destino = elegido !== undefined ? elegido : desdeUrl && destinos.includes(desdeUrl) ? desdeUrl : null;
  const raizRef = useRef<HTMLDivElement>(null);

  const filtradas = destino ? entradas.filter((e) => e.destino === destino) : entradas;
  const visibles =
    orden === "precio"
      ? [...filtradas].sort((a, b) => (a.monto ?? Infinity) - (b.monto ?? Infinity))
      : filtradas;

  // Si se filtra con la fila ya pegada arriba, la lista nueva puede ser más
  // corta que el scroll actual y dejaría al usuario mirando el pie: vuelve al
  // comienzo de la lista (suave o no según scroll-behavior de globals.css).
  function volverArriba() {
    const raiz = raizRef.current;
    if (raiz && raiz.getBoundingClientRect().top < 0) raiz.scrollIntoView({ block: "start" });
  }

  function elegir(d: string | null) {
    setElegido(d);
    const url = new URL(window.location.href);
    if (d) url.searchParams.set("destino", d);
    else url.searchParams.delete("destino");
    window.history.replaceState(null, "", url);
    volverArriba();
  }

  const opcionOrden = (valor: Orden, etiqueta: string) => (
    <button
      type="button"
      aria-pressed={orden === valor}
      onClick={() => {
        setOrden(valor);
        volverArriba();
      }}
      className={
        "min-h-11 rounded-pill px-4 text-sm font-semibold transition-colors duration-150 " +
        (orden === valor ? "bg-sand-2 text-ink" : "text-ink-soft hover:text-ink")
      }
    >
      {etiqueta}
    </button>
  );

  return (
    <div ref={raizRef} className="scroll-mt-(--alto-barra)">
      {destinos.length > 1 ? <DestinoChips destinos={destinos} activo={destino} onChange={elegir} fijo={fijo} /> : null}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="font-mono text-xs text-ink-soft" aria-live="polite">
          {visibles.length} {visibles.length === 1 ? nombre[0] : nombre[1]}
        </p>
        <div role="group" aria-label="Ordenar" className="flex rounded-pill border border-linea-fuerte p-0.5">
          {opcionOrden("recomendadas", "Recomendadas")}
          {opcionOrden("precio", "Menor precio")}
        </div>
      </div>

      {visibles.length === 0 ? (
        <p className="text-ink-soft">{vacio}</p>
      ) : (
        <CatalogoGrid>
          {visibles.map((e) => (
            <div key={e.id} className="h-full">
              {e.tarjeta}
            </div>
          ))}
        </CatalogoGrid>
      )}
    </div>
  );
}
