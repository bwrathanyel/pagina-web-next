"use client";

import { useState } from "react";
import { Icono } from "@/components/ui/Icono";

/** Corazón de favorito sobre una foto. Latido solo cuando la persona lo toca:
 * al cargar la página los que ya eran favoritos aparecen quietos. `activo`
 * null = sesión no iniciada (se ve igual; el llamador manda a iniciar sesión). */
export function BotonFavorito({
  activo,
  nombre,
  onToggle,
  className = "",
}: {
  activo: boolean | null;
  nombre: string;
  onToggle: () => void | Promise<void>;
  className?: string;
}) {
  const [latido, setLatido] = useState(0);
  const encendido = activo === true;

  return (
    <button
      type="button"
      onClick={() => {
        if (!encendido) setLatido((n) => n + 1);
        void onToggle();
      }}
      aria-label={encendido ? `Quitar ${nombre} de favoritos` : `Guardar ${nombre} en favoritos`}
      aria-pressed={encendido}
      className={
        "flex h-11 w-11 items-center justify-center rounded-pill bg-dusk/85 backdrop-blur-sm transition-colors duration-150 " +
        (encendido ? "text-coral-bright" : "text-dusk-text hover:text-coral-bright") +
        " " +
        className
      }
    >
      <span key={latido} className={latido > 0 && encendido ? "animate-corazon-latido" : ""}>
        <Icono nombre="corazon" tamano={20} relleno={encendido} />
      </span>
    </button>
  );
}
