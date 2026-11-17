"use client";

import { Campo, Entrada } from "@/components/ui/Campo";
import { TelefonoPais } from "@/components/ui/TelefonoPais";
import type { Reserva } from "./useReserva";

type Props = { r: Pick<Reserva, "f" | "poner" | "errorDe" | "esEscritorio" | "deCuenta" | "noSoyYo"> };

// El título lo pone su Tramo («Sus datos»).
export function TramoDatos({ r }: Props) {
  const { f, poner, errorDe, esEscritorio } = r;
  return (
    <div className="flex flex-col gap-4 lg:gap-3">
      {r.deCuenta ? (
        <p className="flex flex-wrap items-center gap-x-2 text-sm text-ink-soft">
          <span className="min-w-0 truncate">
            Datos de su cuenta: <span className="font-medium text-ink">{r.deCuenta}</span>
          </span>
          <button type="button" onClick={r.noSoyYo} className="min-h-11 font-semibold text-acento underline underline-offset-2">
            No soy yo
          </button>
        </p>
      ) : null}
      <div data-campo="nombre">
        <Campo etiqueta="Nombre y apellido" error={errorDe("nombre")} requerido>
          {(a) => <Entrada {...a} value={f.nombre} onChange={(e) => poner({ nombre: e.target.value })} autoComplete="name" maxLength={80} />}
        </Campo>
      </div>
      {/* Un campo por renglón: en xl la columna de datos es angosta (tres columnas) y el teléfono lleva
          selector de país (a partes iguales su placeholder «0412 1234567» se cortaba). */}
      <div className="grid gap-4 lg:gap-3">
        <div data-campo="telefono">
          <Campo etiqueta="Teléfono (WhatsApp)" error={errorDe("telefono")} requerido>
            {(a) => (
              <TelefonoPais {...a} iso={f.iso} onIso={(iso) => poner({ iso })} valor={f.telefono} onValor={(v) => poner({ telefono: v })} />
            )}
          </Campo>
        </div>
        <div data-campo="email">
          {/* En escritorio la ayuda desalinea la fila Teléfono | Correo: allí va de placeholder. */}
          <Campo etiqueta="Correo" ayuda={esEscritorio ? undefined : "Para contactarle sobre su reserva."} error={errorDe("email")} requerido>
            {(a) => (
              <Entrada
                {...a}
                type="email"
                inputMode="email"
                placeholder={esEscritorio ? "Para contactarle sobre su reserva" : undefined}
                value={f.email}
                onChange={(e) => poner({ email: e.target.value })}
                autoComplete="email"
                maxLength={120}
              />
            )}
          </Campo>
        </div>
      </div>
    </div>
  );
}
