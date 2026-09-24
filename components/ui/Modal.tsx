"use client";

import { useState } from "react";
import { Hoja } from "@/components/ui/Hoja";

// Diálogo centrado en escritorio, hoja inferior en el teléfono. La API es la
// de siempre (se monta abierto y avisa con onClose); por dentro cierra con
// animación y recién al terminarla llama a onClose, así el padre puede seguir
// desmontándolo con un simple `{abierto && <Modal …/>}`.
export function Modal({
  titulo,
  onClose,
  children,
  icono,
  acentoClassName,
}: {
  titulo: string;
  onClose: () => void;
  children: React.ReactNode;
  /** Badge circular junto al título (ej. ícono de WhatsApp). Opcional: sin
   * esto el modal va neutro -- lo usan también formularios de admin y de
   * postulación que no deben heredar ningún acento de marca. */
  icono?: React.ReactNode;
  /** Clases de degradé del badge, ej. "from-whatsapp to-…". Sin efecto si no
   * viene `icono`. */
  acentoClassName?: string;
}) {
  const [abierta, setAbierta] = useState(true);

  return (
    <Hoja
      abierta={abierta}
      onCerrar={() => setAbierta(false)}
      onSalida={onClose}
      titulo={titulo}
      escritorio="centrado"
      icono={
        icono ? (
          <span
            aria-hidden="true"
            className={
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-pill bg-gradient-to-br text-white " +
              (acentoClassName ?? "")
            }
          >
            {icono}
          </span>
        ) : undefined
      }
    >
      {children}
    </Hoja>
  );
}
