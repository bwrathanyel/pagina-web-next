"use client";

import { CLASE_CONTROL, Entrada } from "@/components/ui/Campo";
import { PAISES, buscarPais } from "@/lib/paises";

// Sin banderas (B-23): el CDN de banderas era un tercero en cada formulario y las banderas emoji no se dibujan en
// Windows. El país se muestra por su código ISO y el prefijo en mono; debajo hay un <select> nativo
// transparente, así el teléfono abre su propio selector y el teclado funciona sin código propio.

/** Teléfono con selector de país (código + prefijo). El país por defecto lo
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
  const pais = buscarPais(iso);

  return (
    <div className="flex gap-2">
      <span
        className={`${CLASE_CONTROL.replace("w-full", "")} relative flex min-h-12 shrink-0 items-center gap-1.5 py-2.5 pl-3 pr-2.5 has-[:focus-visible]:border-acento has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-acento/20`}
      >
        <span aria-hidden="true" className="font-mono text-xs font-bold uppercase text-ink-soft">
          {pais.iso}
        </span>
        <span aria-hidden="true" className="font-mono text-sm tabular-nums text-ink">
          +{pais.codigo}
        </span>
        <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 text-ink-soft" fill="currentColor">
          <path d="M5.5 7.5 10 12l4.5-4.5-1.06-1.06L10 9.88 6.56 6.44z" />
        </svg>
        <select
          value={pais.iso}
          onChange={(e) => onIso(e.target.value)}
          aria-label={`Código de país: ${pais.nombre} +${pais.codigo}`}
          className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0"
        >
          {PAISES.map((p) => (
            <option key={p.iso} value={p.iso}>
              {p.nombre} +{p.codigo}
            </option>
          ))}
        </select>
      </span>
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
    </div>
  );
}
