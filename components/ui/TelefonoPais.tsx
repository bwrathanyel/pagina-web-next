"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CLASE_CONTROL, Entrada } from "@/components/ui/Campo";
import { PAISES, buscarPais } from "@/lib/paises";

// Las banderas emoji no se dibujan en Windows (salen como "VE"), así que van
// como imagen. Alto fijo para que el layout no salte al cargar.
function Bandera({ iso }: { iso: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/w40/${iso}.png`}
      srcSet={`https://flagcdn.com/w80/${iso}.png 2x`}
      width={24}
      height={18}
      alt=""
      loading="lazy"
      className="h-[18px] w-6 shrink-0 rounded-[3px] object-cover shadow-[0_0_0_1px_rgb(0_0_0/0.12)]"
    />
  );
}

/** Teléfono con selector de país (bandera + código). El país por defecto lo
 * manda el padre; el número se edita como texto libre. */
export function TelefonoPais({
  id,
  iso,
  onIso,
  valor,
  onValor,
  ...a11y
}: {
  id: string;
  iso: string;
  onIso: (iso: string) => void;
  valor: string;
  onValor: (valor: string) => void;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  required?: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const idLista = useId();
  const pais = buscarPais(iso);

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: PointerEvent) => {
      if (!raiz.current?.contains(e.target as Node)) setAbierto(false);
    };
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setAbierto(false);
      }
    };
    document.addEventListener("pointerdown", fuera);
    document.addEventListener("keydown", tecla, true);
    return () => {
      document.removeEventListener("pointerdown", fuera);
      document.removeEventListener("keydown", tecla, true);
    };
  }, [abierto]);

  return (
    <div ref={raiz} className="relative flex gap-2">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-controls={abierto ? idLista : undefined}
        aria-label={`País: ${pais.nombre} +${pais.codigo}. Cambiar`}
        className={`${CLASE_CONTROL.replace("w-full", "")} flex min-h-12 shrink-0 cursor-pointer items-center gap-2 py-2.5 pl-3 pr-2.5`}
      >
        <Bandera iso={pais.iso} />
        <span className="font-mono text-sm tabular-nums">+{pais.codigo}</span>
        <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 text-ink-soft" fill="currentColor">
          <path d="M5.5 7.5 10 12l4.5-4.5-1.06-1.06L10 9.88 6.56 6.44z" />
        </svg>
      </button>
      <Entrada
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        placeholder={pais.iso === "ve" ? "0412 1234567" : "Número de teléfono"}
        value={valor}
        onChange={(e) => onValor(e.target.value)}
        className="min-w-0 flex-1"
        {...a11y}
      />
      {abierto ? (
        <ul
          id={idLista}
          role="listbox"
          aria-label="Código de país"
          className="absolute left-0 top-full z-20 mt-1.5 max-h-60 w-full min-w-64 overflow-y-auto rounded-control border border-linea-fuerte bg-card p-1 shadow-lg"
        >
          {PAISES.map((p) => (
            <li key={p.iso} role="option" aria-selected={p.iso === iso}>
              <button
                type="button"
                onClick={() => {
                  onIso(p.iso);
                  setAbierto(false);
                }}
                className={
                  "flex min-h-11 w-full items-center gap-3 rounded-control px-3 text-left text-base text-ink hover:bg-sand-2 focus-visible:bg-sand-2 focus-visible:outline-none " +
                  (p.iso === iso ? "bg-sand-2 font-semibold" : "")
                }
              >
                <Bandera iso={p.iso} />
                <span className="flex-1 truncate">{p.nombre}</span>
                <span className="font-mono text-sm tabular-nums text-ink-soft">+{p.codigo}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
