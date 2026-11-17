"use client";

import { Icono } from "@/components/ui/Icono";

/** Campo de búsqueda en píldora, compartido por /buscar y Hot Sales. */
export function CampoBusqueda({
  valor,
  onChange,
  autoFocus = false,
  className = "",
}: {
  valor: string;
  onChange: (valor: string) => void;
  autoFocus?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`flex min-h-12 items-center gap-3 rounded-pill border border-linea-fuerte bg-card px-5 transition-[border-color,box-shadow] duration-[var(--dur-rapida)] ease-salida focus-within:border-acento focus-within:ring-2 focus-within:ring-acento/30 ${className}`}
    >
      <Icono nombre="buscar" tamano={20} className="text-ink-soft" />
      <input
        type="search"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Buscar destinos, hoteles, paquetes…"
        aria-label="Buscar destinos, hoteles, paquetes"
        className="min-h-12 w-full bg-transparent text-ink placeholder:text-ink-soft focus:outline-none"
        autoFocus={autoFocus}
      />
    </div>
  );
}
