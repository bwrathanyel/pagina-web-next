"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { Promocion } from "@/types/supabase";

export function EditarPromocionModal({
  promocion,
  onClose,
  onGuardado,
}: {
  promocion: Promocion;
  onClose: () => void;
  onGuardado: (cambios: { titulo: string; vigenciaTexto: string }) => void;
}) {
  const [titulo, setTitulo] = useState(promocion.titulo);
  const [vigenciaTexto, setVigenciaTexto] = useState(promocion.vigencia_texto ?? "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) {
      setError("El título no puede quedar vacío.");
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabaseBrowser().rpc("web_actualizar_promocion_contenido", {
        p_id: promocion.id,
        p_titulo: titulo,
        p_vigencia_texto: vigenciaTexto,
      });
      if (rpcError || !data?.ok) {
        setError("No se pudo guardar. Probá de nuevo.");
        return;
      }
      onGuardado({ titulo, vigenciaTexto });
      onClose();
    } catch {
      setError("No se pudo guardar. Revisá tu conexión.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal titulo="Editar promoción" onClose={onClose}>
      <form onSubmit={guardar} className="flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">Título</label>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full rounded-xl border border-ink/15 bg-sand px-4 py-3 text-base text-ink"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">Vigencia</label>
          <input
            value={vigenciaTexto}
            onChange={(e) => setVigenciaTexto(e.target.value)}
            placeholder="Ej: Válido hasta el 30 de agosto"
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
