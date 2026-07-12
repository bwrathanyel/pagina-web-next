"use client";

import type { CampoDef, Respuestas } from "@/components/cotizador/types";

interface Props {
  campo: CampoDef;
  valor: Respuestas[string];
  onChange: (key: string, valor: Respuestas[string]) => void;
}

const inputClass =
  "w-full rounded-xl border border-ink/15 bg-card px-4 py-3 text-base text-ink placeholder:text-ink-soft/60";

export function CampoRenderer({ campo, valor, onChange }: Props) {
  const label = (
    <label htmlFor={campo.key} className="mb-1.5 block text-sm font-semibold text-ink">
      {campo.label}
      {campo.required ? <span className="ml-1 text-coral">*</span> : null}
    </label>
  );
  const hint = campo.hint ? <p className="mt-1.5 text-xs text-ink-soft">{campo.hint}</p> : null;

  switch (campo.tipo) {
    case "text":
    case "tel":
      return (
        <div>
          {label}
          <input
            id={campo.key}
            type={campo.tipo}
            className={inputClass}
            placeholder={campo.placeholder}
            value={(valor as string) ?? ""}
            onChange={(e) => onChange(campo.key, e.target.value)}
          />
          {hint}
        </div>
      );

    case "date":
      return (
        <div>
          {label}
          <input
            id={campo.key}
            type="date"
            min={new Date().toISOString().split("T")[0]}
            className={inputClass}
            value={(valor as string) ?? ""}
            onChange={(e) => onChange(campo.key, e.target.value)}
          />
          {hint}
        </div>
      );

    case "number":
      return (
        <div>
          {label}
          <input
            id={campo.key}
            type="number"
            inputMode="numeric"
            min={campo.min}
            max={campo.max}
            className={inputClass}
            value={(valor as number) ?? ""}
            onChange={(e) => onChange(campo.key, e.target.value === "" ? "" : Number(e.target.value))}
          />
          {hint}
        </div>
      );

    case "textarea":
      return (
        <div>
          {label}
          <textarea
            id={campo.key}
            rows={3}
            className={inputClass}
            placeholder={campo.placeholder}
            value={(valor as string) ?? ""}
            onChange={(e) => onChange(campo.key, e.target.value)}
          />
          {hint}
        </div>
      );

    case "select":
      return (
        <div>
          {label}
          <select
            id={campo.key}
            className={inputClass}
            value={(valor as string) ?? ""}
            onChange={(e) => onChange(campo.key, e.target.value)}
          >
            {campo.opciones?.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {hint}
        </div>
      );

    case "checkbox":
      return (
        <label className="flex min-h-11 items-center gap-3 rounded-xl border border-ink/15 bg-card px-4 py-3">
          <input
            type="checkbox"
            checked={Boolean(valor)}
            onChange={(e) => onChange(campo.key, e.target.checked)}
            className="h-5 w-5 accent-coral"
          />
          <span className="text-sm text-ink">{campo.label}</span>
        </label>
      );

    case "slider": {
      const v = Number(valor ?? campo.default ?? campo.min ?? 0);
      const esMax = campo.max != null && v >= campo.max;
      return (
        <div>
          {label}
          <input
            id={campo.key}
            type="range"
            min={campo.min}
            max={campo.max}
            step={campo.step}
            value={v}
            onChange={(e) => onChange(campo.key, Number(e.target.value))}
            className="w-full accent-coral"
          />
          <p className="mt-1 font-mono text-sm text-ink-soft">
            {esMax ? "Sin límite — lo mejor" : `Hasta $${v} USD`}
          </p>
          {hint}
        </div>
      );
    }

    case "cards":
      return (
        <div>
          {label}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {campo.opciones?.map((o) => {
              const sel = valor === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => onChange(campo.key, o.value)}
                  className={
                    "flex min-h-11 items-start gap-3 rounded-xl border-2 px-4 py-3 text-left " +
                    (sel ? "border-coral bg-coral/10" : "border-ink/10 bg-card")
                  }
                >
                  {o.emoji ? <span className="text-xl">{o.emoji}</span> : null}
                  <span>
                    <span className="block text-sm font-semibold text-ink">{o.label}</span>
                    {o.desc ? <span className="block text-xs text-ink-soft">{o.desc}</span> : null}
                  </span>
                </button>
              );
            })}
          </div>
          {hint}
        </div>
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
        <div>
          {label}
          <div className="flex flex-wrap gap-2">
            {campo.opciones?.map((o) => {
              const sel = seleccionadas.includes(o.value);
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => toggle(o.value)}
                  className={
                    "inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-medium " +
                    (sel ? "border-transparent bg-gradient-to-br from-coral to-gold text-btn-ink" : "border-ink/15 bg-card text-ink")
                  }
                >
                  {o.label}
                </button>
              );
            })}
          </div>
          {hint}
        </div>
      );
    }

    default:
      return null;
  }
}
