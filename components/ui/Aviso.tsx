import type { ReactNode } from "react";
import { Icono } from "@/components/ui/Icono";

const TONOS = {
  error: { clases: "bg-peligro-suave text-peligro", icono: "alerta" },
  ok: { clases: "bg-seafoam-bg text-seafoam-text", icono: "check" },
  info: { clases: "bg-sand-2 text-ink-soft", icono: "alerta" },
} as const;

/** Mensaje en línea de un formulario (error de envío, confirmación, aviso).
 * Los errores se anuncian solos (role=alert); el resto, como estado. */
export function Aviso({
  tono = "error",
  children,
  className = "",
}: {
  tono?: keyof typeof TONOS;
  children: ReactNode;
  className?: string;
}) {
  const { clases, icono } = TONOS[tono];
  return (
    <p
      role={tono === "error" ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-control px-4 py-3 text-sm font-semibold ${clases} ${className}`}
    >
      <Icono nombre={icono} tamano={18} className="mt-0.5" />
      <span>{children}</span>
    </p>
  );
}
