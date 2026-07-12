"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { Producto } from "@/types/supabase";

export function EditarProductoModal({
  producto,
  onClose,
  onGuardado,
}: {
  producto: Producto;
  onClose: () => void;
  onGuardado: (cambios: { nombre: string; descripcion: string; requisitos: string }) => void;
}) {
  const [nombre, setNombre] = useState(producto.nombre);
  const [descripcion, setDescripcion] = useState(producto.descripcion ?? "");
  const [requisitos, setRequisitos] = useState(producto.requisitos ?? "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) {
      setError("El nombre no puede quedar vacío.");
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabaseBrowser().rpc("web_actualizar_producto_contenido", {
        p_id: producto.id,
        p_nombre: nombre,
        p_descripcion: descripcion,
        p_requisitos: requisitos,
      });
      if (rpcError || !data?.ok) {
        setError("No se pudo guardar. Probá de nuevo.");
        return;
      }
      onGuardado({ nombre, descripcion, requisitos });
      onClose();
    } catch {
      setError("No se pudo guardar. Revisá tu conexión.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal titulo="Editar producto" onClose={onClose}>
      <form onSubmit={guardar} className="flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">Nombre</label>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full rounded-xl border border-ink/15 bg-sand px-4 py-3 text-base text-ink"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">Descripción</label>
          <textarea
            rows={5}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="w-full rounded-xl border border-ink/15 bg-sand px-4 py-3 text-base text-ink"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">Requisitos</label>
          <textarea
            rows={3}
            value={requisitos}
            onChange={(e) => setRequisitos(e.target.value)}
            className="w-full rounded-xl border border-ink/15 bg-sand px-4 py-3 text-base text-ink"
          />
        </div>
        {error ? <p className="text-sm text-coral">{error}</p> : null}
        <button
          type="submit"
          disabled={guardando}
          className="min-h-11 rounded-full bg-gradient-to-br from-coral to-gold px-4 font-semibold text-btn-ink disabled:opacity-60"
        >
          {guardando ? "Guardando…" : "Guardar cambios"}
        </button>
      </form>
    </Modal>
  );
}
