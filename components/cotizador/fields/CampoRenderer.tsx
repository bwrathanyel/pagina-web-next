"use client";

import { useId, type ReactNode } from "react";
import type { CampoDef, Respuestas } from "@/components/cotizador/types";
import { AreaTexto, Campo, Entrada, Selector } from "@/components/ui/Campo";
import { Icono } from "@/components/ui/Icono";
import { hoyCaracas } from "@/lib/cotizador/cotizacionRapida";

interface Props {
  campo: CampoDef;
  valor: Respuestas[string];
  onChange: (key: string, valor: Respuestas[string]) => void;
}

// Opciones como radios/checkbox nativos (teclado y lector de pantalla gratis)
// con el input oculto y el foco pintado en la etiqueta con has-[:focus-visible].
const FOCO_OPCION = "has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-acento/20";

/** fieldset + legend para grupos de opciones: un <label for> no sirve para
 * nombrar varios controles a la vez. */
function Grupo({ campo, children }: { campo: CampoDef; children: ReactNode }) {
  const id = useId();
  return (
    <fieldset aria-describedby={campo.hint ? `${id}-ayuda` : undefined} className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-sm font-semibold text-ink">
        {campo.label}
        {campo.required ? (
          <span className="ml-0.5 text-acento" aria-hidden="true">
            *
          </span>
        ) : null}
      </legend>
      {children}
      {campo.hint ? (
        <p id={`${id}-ayuda`} className="text-sm text-ink-soft">
          {campo.hint}
        </p>
      ) : null}
    </fieldset>
  );
}

export function CampoRenderer({ campo, valor, onChange }: Props) {
  const nombreGrupo = useId();
  const texto = (valor as string) ?? "";

  switch (campo.tipo) {
    case "text":
    case "tel":
      return (
        <Campo etiqueta={campo.label} ayuda={campo.hint} requerido={campo.required}>
          {(a11y) => (
            <Entrada
              {...a11y}
              type={campo.tipo}
              inputMode={campo.tipo === "tel" ? "tel" : undefined}
              autoComplete={campo.tipo === "tel" ? "tel" : campo.key === "nombre" ? "name" : undefined}
              placeholder={campo.placeholder}
              value={texto}
              onChange={(e) => onChange(campo.key, e.target.value)}
            />
          )}
        </Campo>
      );

    case "date":
      return (
        <Campo etiqueta={campo.label} ayuda={campo.hint} requerido={campo.required}>
          {(a11y) => (
            <Entrada
              {...a11y}
              type="date"
              min={hoyCaracas()}
              value={texto}
              onChange={(e) => onChange(campo.key, e.target.value)}
            />
          )}
        </Campo>
      );

    case "number":
      return (
        <Campo etiqueta={campo.label} ayuda={campo.hint} requerido={campo.required}>
          {(a11y) => (
            <Entrada
              {...a11y}
              type="number"
              inputMode="numeric"
              min={campo.min}
              max={campo.max}
              className="font-mono tabular-nums"
              value={(valor as number) ?? ""}
              onChange={(e) => onChange(campo.key, e.target.value === "" ? "" : Number(e.target.value))}
            />
          )}
        </Campo>
      );

    case "textarea":
      return (
        <Campo etiqueta={campo.label} ayuda={campo.hint} requerido={campo.required}>
          {(a11y) => (
            <AreaTexto
              {...a11y}
              rows={3}
              placeholder={campo.placeholder}
              value={texto}
              onChange={(e) => onChange(campo.key, e.target.value)}
            />
          )}
        </Campo>
      );

    case "select":
      return (
        <Campo etiqueta={campo.label} ayuda={campo.hint} requerido={campo.required}>
          {(a11y) => (
            <Selector {...a11y} value={texto} onChange={(e) => onChange(campo.key, e.target.value)}>
              {campo.opciones?.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Selector>
          )}
        </Campo>
      );

    case "checkbox":
      return (
        <label
          className={
            "flex min-h-12 cursor-pointer items-center gap-3 rounded-control border border-linea-fuerte bg-card px-4 py-3 " +
            "transition-colors duration-150 hover:border-ink/35 has-[:checked]:border-acento"
          }
        >
          <input
            type="checkbox"
            checked={Boolean(valor)}
            onChange={(e) => onChange(campo.key, e.target.checked)}
            className="h-5 w-5 shrink-0 accent-acento"
          />
          <span className="text-base text-ink">{campo.label}</span>
        </label>
      );

    case "slider": {
      const v = Number(valor ?? campo.default ?? campo.min ?? 0);
      const esMax = campo.max != null && v >= campo.max;
      return (
        <Campo etiqueta={campo.label} ayuda={campo.hint} requerido={campo.required}>
          {(a11y) => (
            <div className="flex flex-col gap-2">
              <output htmlFor={a11y.id} className="font-mono text-2xl font-bold tabular-nums text-ink">
                {esMax ? "Sin límite" : `Hasta $${v} USD`}
              </output>
              <input
                {...a11y}
                type="range"
                min={campo.min}
                max={campo.max}
                step={campo.step}
                value={v}
                aria-valuetext={esMax ? "Sin límite" : `Hasta ${v} dólares`}
                onChange={(e) => onChange(campo.key, Number(e.target.value))}
                className="h-11 w-full cursor-pointer accent-acento"
              />
            </div>
          )}
        </Campo>
      );
    }

    case "cards":
      return (
        <Grupo campo={campo}>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {campo.opciones?.map((o) => (
              <label
                key={o.value}
                className={
                  "group relative flex min-h-12 cursor-pointer items-start gap-3 rounded-control border border-linea-fuerte bg-card px-4 py-3 " +
                  "transition-colors duration-150 hover:border-ink/35 has-[:checked]:border-acento has-[:checked]:bg-acento-suave " +
                  FOCO_OPCION
                }
              >
                <input
                  type="radio"
                  name={nombreGrupo}
                  value={o.value}
                  checked={valor === o.value}
                  onChange={() => onChange(campo.key, o.value)}
                  className="sr-only"
                />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-ink">{o.label}</span>
                  {o.desc ? <span className="mt-0.5 block text-sm text-ink-soft">{o.desc}</span> : null}
                </span>
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-pill border border-linea-fuerte text-sobre-acento group-has-[:checked]:border-acento group-has-[:checked]:bg-acento"
                >
                  <Icono nombre="check" tamano={14} className="opacity-0 group-has-[:checked]:opacity-100" />
                </span>
              </label>
            ))}
          </div>
        </Grupo>
      );

    case "tags": {
      const seleccionadas = campo.multiple ? ((valor as string[]) ?? []) : [valor as string];
      const toggle = (v: string) => {
        if (campo.multiple) {
          const actual = (valor as string[]) ?? [];
          onChange(campo.key, actual.includes(v) ? actual.filter((x) => x !== v) : [...actual, v]);
        } else {
          onChange(campo.key, v);
        }
      };
      return (
        <Grupo campo={campo}>
          <div className="flex flex-wrap gap-2">
            {campo.opciones?.map((o) => (
              <label
                key={o.value}
                className={
                  "inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-pill border border-linea-fuerte bg-card px-4 text-sm font-semibold text-ink-soft " +
                  "transition-colors duration-150 hover:border-ink/40 hover:text-ink " +
                  "has-[:checked]:border-transparent has-[:checked]:bg-acento has-[:checked]:text-sobre-acento " +
                  FOCO_OPCION
                }
              >
                <input
                  type={campo.multiple ? "checkbox" : "radio"}
                  name={nombreGrupo}
                  value={o.value}
                  checked={seleccionadas.includes(o.value)}
                  onChange={() => toggle(o.value)}
                  className="sr-only"
                />
                {campo.multiple && seleccionadas.includes(o.value) ? <Icono nombre="check" tamano={16} /> : null}
                {o.label}
              </label>
            ))}
          </div>
        </Grupo>
      );
    }

    default:
      return null;
  }
}
