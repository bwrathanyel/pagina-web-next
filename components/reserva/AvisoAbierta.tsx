"use client";

import { useState } from "react";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { ChipPlazo } from "@/components/checkout/ChipPlazo";

/** Reserva ya creada esperando pago: «Continuar al pago» o «Descartar». Descartar pide confirmación aquí
 * mismo (no `confirm()`): suelta el cupo en la base y el link de pago deja de servir. */
export function AvisoAbierta({
  abierta,
  hotelActual,
  onDescartar,
}: {
  abierta: { token: string; codigo: string; expira_en: string; hotel: string };
  hotelActual: string;
  onDescartar: () => Promise<string | null>;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function descartar() {
    setEnviando(true);
    setError(null);
    const err = await onDescartar();
    // Con éxito el aviso desaparece (el padre limpia `abierta`); solo queda algo que hacer si falló.
    if (err) {
      setError(err);
      setEnviando(false);
    }
  }

  return (
    <Aviso tono="info">
      <span className="flex flex-wrap items-center gap-2">
        <span>
          Tiene la reserva <span className="font-mono font-bold">{abierta.codigo}</span>
          {abierta.hotel && abierta.hotel !== hotelActual ? ` (${abierta.hotel})` : ""} esperando pago.
        </span>
        <ChipPlazo hasta={abierta.expira_en} />
      </span>
      {confirmando ? (
        <span role="group" aria-labelledby="descartar-pregunta" className="mt-2 flex flex-col gap-2">
          <span id="descartar-pregunta" className="text-sm">
            ¿Descartar la reserva {abierta.codigo}? Se libera la habitación y el link de pago deja de servir.
          </span>
          <span className="flex flex-wrap gap-2">
            <Boton variante="secundario" tamano="sm" cargando={enviando} onClick={() => void descartar()}>
              Sí, descartar
            </Boton>
            <Boton variante="fantasma" tamano="sm" disabled={enviando} onClick={() => { setConfirmando(false); setError(null); }}>
              No, conservarla
            </Boton>
          </span>
        </span>
      ) : (
        <span className="mt-2 flex flex-wrap gap-2">
          <Boton href={`/pagar/${abierta.token}`} variante="secundario" tamano="sm">
            Continuar al pago
          </Boton>
          <Boton variante="fantasma" tamano="sm" onClick={() => setConfirmando(true)}>
            Descartar
          </Boton>
        </span>
      )}
      {error ? (
        <span role="alert" className="mt-2 block text-sm text-peligro">
          {error}
        </span>
      ) : null}
    </Aviso>
  );
}
