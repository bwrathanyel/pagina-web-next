"use client";

import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { Icono } from "@/components/ui/Icono";
import { WhatsAppIcon } from "@/components/ui/icons/WhatsAppIcon";
import type { Reserva } from "./useReserva";

type Accion = Pick<Reserva, "fueraDeHorario" | "wa" | "enviando" | "config">;

/** Botón de crear (o WhatsApp fuera de horario): ancho al final del cierre en escritorio, compacto en la barra móvil. */
export function AccionReserva({ r, ancho }: { r: Accion; ancho: boolean }) {
  return r.fueraDeHorario ? (
    <Boton variante="whatsapp" ancho={ancho} className={ancho ? "" : "shrink-0"} iconoInicio={<WhatsAppIcon size={18} />} {...r.wa("fuera_de_horario")}>
      Reservar por WhatsApp
    </Boton>
  ) : (
    <Boton type="submit" ancho={ancho} className={ancho ? "" : "shrink-0"} cargando={r.enviando || !r.config}>
      Reservar y pagar
    </Boton>
  );
}

type Props = {
  r: Accion & Pick<Reserva, "error" | "acepta" | "setAcepta" | "errorDe" | "esEscritorio">;
  /** Boleto aéreo agregado: se pide junto con la reserva. */
  boleto?: string | null;
};

// La aceptación existe UNA sola vez, al final de la columna de pago.
export function CierreReserva({ r, boleto = null }: Props) {
  const { error, fueraDeHorario, acepta, setAcepta } = r;
  const errorAcepta = r.errorDe("acepta");
  return (
    <div className="flex flex-col gap-3">
      {error ? (
        <div data-campo="error">
          <Aviso tono={error.tono}>{error.texto}</Aviso>
        </div>
      ) : null}
      {fueraDeHorario ? null : (
        <>
          <div data-campo="acepta">
            <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm text-ink">
              <input
                type="checkbox"
                checked={acepta}
                onChange={(e) => setAcepta(e.target.checked)}
                aria-invalid={errorAcepta ? true : undefined}
                aria-describedby={errorAcepta ? "r-acepta-error" : undefined}
                className="mt-0.5 h-5 w-5 shrink-0 accent-acento"
              />
              <span>
                Acepto los{" "}
                <a className="underline underline-offset-2" href="/terminos#compra-directa" target="_blank" rel="noopener">
                  términos de servicio
                </a>{" "}
                y la{" "}
                <a className="underline underline-offset-2" href="#politica">
                  política de cambios y cancelaciones
                </a>
                .
              </span>
            </label>
            {errorAcepta ? (
              <p id="r-acepta-error" role="alert" className="mt-1 text-sm font-medium text-peligro">
                {errorAcepta}
              </p>
            ) : null}
          </div>
          <p className="text-sm text-ink-soft">Aún no se le cobra nada: en el siguiente paso verá los datos para pagar.</p>
          {boleto ? (
            // Una línea: el detalle del vuelo ya está en la franja de arriba; con 4 líneas el botón quedaba bajo el pliegue (1366×695, dueño 2026-11-18).
            <p className="flex items-center gap-2 text-xs text-ink-soft" title={boleto}>
              <Icono nombre="avion" tamano={14} className="shrink-0" />
              <span className="truncate">Boleto aéreo incluido en el pedido: se lo cotiza boletería por WhatsApp.</span>
            </p>
          ) : null}
        </>
      )}
      {/* Escritorio: la acción va al final, después de aceptar y verificar; en el teléfono la lleva la barra fija. */}
      {r.esEscritorio ? <AccionReserva r={r} ancho /> : null}
    </div>
  );
}
