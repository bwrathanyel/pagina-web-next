"use client";

import { useEffect, useRef, useState } from "react";
import { fechaHoraVenezuela, plazoRestante } from "@/lib/checkout/formato";

const MEDIA_HORA = 30 * 60;

/** «Cupo retenido · 23 h 41 min». Ámbar; con menos de 30 min, en peligro. Al llegar a cero
 * avisa una vez (`onVencer`): el estado real lo decide el servidor, no este reloj. */
export function ChipPlazo({ hasta, onVencer }: { hasta: string; onVencer?: () => void }) {
  const [ahora, setAhora] = useState<number | null>(null);
  const avisado = useRef(false);

  useEffect(() => {
    setAhora(Date.now());
    const t = window.setInterval(() => setAhora(Date.now()), 15_000);
    return () => window.clearInterval(t);
  }, []);

  const seg = ahora === null ? null : Math.floor((Date.parse(hasta) - ahora) / 1000);
  useEffect(() => {
    if (seg !== null && Number.isFinite(seg) && seg <= 0 && !avisado.current) {
      avisado.current = true;
      onVencer?.();
    }
  }, [seg, onVencer]);

  if (seg === null || !Number.isFinite(seg)) return null;
  const urgente = seg < MEDIA_HORA;
  return (
    <p
      role="timer"
      title={`Vence el ${fechaHoraVenezuela(hasta)} (hora de Venezuela)`}
      className={
        "inline-flex min-h-8 items-center gap-1.5 rounded-pill px-3 text-sm font-semibold " +
        (urgente ? "bg-peligro-suave text-peligro" : "bg-ambar-suave text-ambar")
      }
    >
      {seg > 0 ? (
        <>
          Cupo retenido · <span className="font-mono tabular-nums">{plazoRestante(seg)}</span>
        </>
      ) : (
        "Se acabó el tiempo para pagar"
      )}
    </p>
  );
}
