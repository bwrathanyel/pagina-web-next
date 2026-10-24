"use client";

import { useState } from "react";
import { Hoja } from "@/components/ui/Hoja";

// Política de cambios y cancelaciones (texto aprobado, intacto). Escritorio: completa, con
// id="politica" para el enlace de la aceptación. Teléfono (decisión del dueño): el primer
// párrafo literal y «Leer completa» abre el resto en una Hoja, sin salir del formulario.
export function PoliticaPlegable({ parrafos }: { parrafos: string[] }) {
  const [abierta, setAbierta] = useState(false);
  return (
    <section id="politica" aria-labelledby="r-politica" className="scroll-mt-24 rounded-card border border-linea bg-card p-5">
      <h2 id="r-politica" className="font-display text-xl font-bold text-ink">
        Cambios y cancelaciones
      </h2>
      {parrafos.map((p, i) => (
        <p key={i} className={"mt-2 text-sm text-ink-soft" + (i > 0 ? " max-lg:hidden" : "")}>
          {p}
        </p>
      ))}
      {parrafos.length > 1 ? (
        <button
          type="button"
          onClick={() => setAbierta(true)}
          aria-haspopup="dialog"
          className="mt-1 min-h-11 text-sm font-semibold text-acento underline-offset-4 hover:underline lg:hidden"
        >
          Leer completa
        </button>
      ) : null}
      <Hoja abierta={abierta} onCerrar={() => setAbierta(false)} titulo="Cambios y cancelaciones">
        <div className="flex flex-col gap-3">
          {parrafos.map((p, i) => (
            <p key={i} className="text-sm text-ink-soft">
              {p}
            </p>
          ))}
        </div>
      </Hoja>
    </section>
  );
}
