import { useId, type ComponentProps, type ReactNode } from "react";

// Antes la misma cadena de clases de input estaba copiada en 8 formularios,
// varias con `outline-none` sin reemplazo (el foco desaparecía). El anillo de
// foco va acá, una vez. text-base = 16px: por debajo iOS hace zoom al enfocar.
export const CLASE_CONTROL =
  "block w-full rounded-control border border-linea-fuerte bg-card px-4 text-base text-ink " +
  "placeholder:text-ink-soft transition-[border-color,box-shadow] duration-150 ease-salida " +
  "hover:border-ink/35 focus:border-acento focus:outline-none focus:ring-4 focus:ring-acento/20 " +
  "aria-[invalid=true]:border-peligro aria-[invalid=true]:focus:ring-peligro/20 " +
  "disabled:cursor-not-allowed disabled:opacity-60";

const ALTO_LINEA = "min-h-12 py-2.5";

/** Envoltorio de un control: etiqueta, ayuda y error ligados por id. El hijo
 * recibe los ids por render-prop para que sirva con cualquier control. */
export function Campo({
  etiqueta,
  ayuda,
  error,
  requerido,
  className = "",
  children,
}: {
  etiqueta: ReactNode;
  ayuda?: ReactNode;
  error?: string | null;
  requerido?: boolean;
  className?: string;
  children: (a11y: { id: string; "aria-describedby"?: string; "aria-invalid"?: boolean; required?: boolean }) => ReactNode;
}) {
  const id = useId();
  const idAyuda = ayuda ? `${id}-ayuda` : undefined;
  const idError = error ? `${id}-error` : undefined;
  const describedBy = [idAyuda, idError].filter(Boolean).join(" ") || undefined;

  return (
    <div className={"flex flex-col gap-1.5 " + className}>
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {etiqueta}
        {requerido ? (
          <span className="ml-0.5 text-acento" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {children({ id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined, required: requerido })}
      {ayuda && !error ? (
        <p id={idAyuda} className="text-sm text-ink-soft">
          {ayuda}
        </p>
      ) : null}
      {error ? (
        <p id={idError} role="alert" className="text-sm font-medium text-peligro">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function Entrada({ className = "", ...props }: ComponentProps<"input">) {
  return <input className={`${CLASE_CONTROL} ${ALTO_LINEA} ${className}`} {...props} />;
}

export function AreaTexto({ className = "", rows = 4, ...props }: ComponentProps<"textarea">) {
  return <textarea rows={rows} className={`${CLASE_CONTROL} min-h-28 py-3 leading-relaxed ${className}`} {...props} />;
}

export function Selector({ className = "", children, ...props }: ComponentProps<"select">) {
  return (
    <select className={`${CLASE_CONTROL} ${ALTO_LINEA} cursor-pointer pr-10 ${className}`} {...props}>
      {children}
    </select>
  );
}
