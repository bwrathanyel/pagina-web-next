"use client";

import { useState } from "react";
import Image from "next/image";
import { fotoUrl } from "@/lib/supabase/fotos";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { Foto } from "@/types/supabase";

type Tabla = "producto" | "promocion";

/** Gestión de fotos existentes en Modo Edición: mostrar/ocultar y elegir
 * portada. No sube archivos nuevos — eso sigue siendo tarea del Tarifario
 * interno (el bucket/carpeta por producto ya tiene una convención propia
 * que ese flujo respeta). */
export function AdminFotoManager({
  fotos,
  tabla,
  productoId,
}: {
  fotos: Foto[];
  tabla: Tabla;
  productoId: number;
}) {
  const [estado, setEstado] = useState(fotos);
  const ordenadas = [...estado].sort(
    (a, b) => Number(b.es_principal) - Number(a.es_principal) || a.orden - b.orden,
  );

  async function toggleActivo(foto: Foto) {
    const sb = supabaseBrowser();
    const rpc = tabla === "producto" ? "web_toggle_producto_foto_activo" : "web_toggle_promocion_foto_activo";
    const { data } = await sb.rpc(rpc, { p_foto_id: foto.id });
    if (data?.ok) {
      setEstado((s) => s.map((f) => (f.id === foto.id ? { ...f, activo: data.activo } : f)));
    }
  }

  async function hacerPrincipal(foto: Foto) {
    if (tabla !== "producto") return; // RPC de principal solo existe para producto_fotos hoy
    const { data } = await supabaseBrowser().rpc("web_set_producto_foto_principal", {
      p_foto_id: foto.id,
      p_producto_id: productoId,
    });
    if (data?.ok) {
      setEstado((s) => s.map((f) => ({ ...f, es_principal: f.id === foto.id, activo: f.id === foto.id ? true : f.activo })));
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-dashed border-ink/20 p-4">
      <p className="mb-3 font-mono text-xs uppercase tracking-wide text-ink-soft">
        Fotos ({estado.length}) — modo edición
      </p>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {ordenadas.map((foto) => (
          <div key={foto.id} className="flex flex-col gap-1.5">
            <div className={"relative aspect-square overflow-hidden rounded-lg bg-sand-2 " + (!foto.activo ? "opacity-40" : "")}>
              <Image src={fotoUrl(foto.storage_path)} alt="" fill sizes="120px" className="object-cover" />
              {foto.es_principal ? (
                <span className="absolute left-1 top-1 rounded bg-coral px-1.5 py-0.5 font-mono text-[0.6rem] text-white">
                  Portada
                </span>
              ) : null}
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => toggleActivo(foto)}
                className="flex-1 rounded border border-ink/15 py-1 text-[0.65rem] font-semibold text-ink"
              >
                {foto.activo ? "Ocultar" : "Mostrar"}
              </button>
              {tabla === "producto" && !foto.es_principal ? (
                <button
                  type="button"
                  onClick={() => hacerPrincipal(foto)}
                  className="flex-1 rounded border border-ink/15 py-1 text-[0.65rem] font-semibold text-ink"
                >
                  Portada
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
