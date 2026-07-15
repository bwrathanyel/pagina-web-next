"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { Promocion } from "@/types/supabase";

export type CambiosPromocion = { titulo: string; precioTexto: string; vigenciaTexto: string; ninosGratis: number; tags: string[] };
const inputClass = "w-full rounded-xl border border-ink/15 bg-sand px-4 py-3 text-base text-ink outline-none focus:border-coral";

export function EditarPromocionModal({ promocion, onClose, onGuardado }: { promocion: Promocion; onClose: () => void; onGuardado: (cambios: CambiosPromocion) => void }) {
  const [titulo, setTitulo] = useState(promocion.titulo);
  const [precioTexto, setPrecioTexto] = useState(promocion.precio_texto ?? "");
  const [vigenciaTexto, setVigenciaTexto] = useState(promocion.vigencia_texto ?? "");
  const [ninosGratis, setNinosGratis] = useState(promocion.ninos_gratis_cantidad ?? 0);
  const [tags, setTags] = useState(promocion.incluye_tags.join(", "));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar(event: React.FormEvent) {
    event.preventDefault();
    if (!titulo.trim()) return setError("El título no puede quedar vacío.");
    const listaTags = tags.split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 20);
    setGuardando(true);
    setError(null);
    const { data, error: rpcError } = await supabaseBrowser().rpc("web_actualizar_promocion_completa", {
      p_id: promocion.id,
      p_titulo: titulo,
      p_precio_texto: precioTexto,
      p_vigencia_texto: vigenciaTexto,
      p_ninos_gratis: ninosGratis,
      p_incluye_tags: listaTags,
    });
    setGuardando(false);
    if (rpcError || !data?.ok) return setError("No se pudo guardar. Revisa los datos e inténtalo de nuevo.");
    onGuardado({ titulo, precioTexto, vigenciaTexto, ninosGratis, tags: listaTags });
    onClose();
  }

  return (
    <Modal titulo="Editar promoción" onClose={onClose}>
      <form onSubmit={guardar} className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-ink sm:col-span-2">Título<input value={titulo} onChange={(e) => setTitulo(e.target.value)} className={`${inputClass} mt-1.5`} /></label>
        <label className="text-sm font-semibold text-ink">Precio visible<input value={precioTexto} onChange={(e) => setPrecioTexto(e.target.value)} placeholder="Ej: $95 por persona" className={`${inputClass} mt-1.5`} /></label>
        <label className="text-sm font-semibold text-ink">Vigencia<input value={vigenciaTexto} onChange={(e) => setVigenciaTexto(e.target.value)} placeholder="Ej: Hasta el 30 de agosto" className={`${inputClass} mt-1.5`} /></label>
        <label className="text-sm font-semibold text-ink">Niños gratis<input type="number" min={0} max={20} value={ninosGratis} onChange={(e) => setNinosGratis(Number(e.target.value))} className={`${inputClass} mt-1.5`} /></label>
        <label className="text-sm font-semibold text-ink sm:col-span-2">Incluye / etiquetas<textarea rows={3} value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Desayuno, traslado, piscina" className={`${inputClass} mt-1.5`} /><span className="mt-1 block text-xs font-normal text-ink-soft">Separa cada elemento con una coma.</span></label>
        {error ? <p className="text-sm text-coral sm:col-span-2">{error}</p> : null}
        <button type="submit" disabled={guardando} className="min-h-12 rounded-full bg-coral px-5 font-semibold text-white disabled:opacity-60 sm:col-span-2">{guardando ? "Guardando…" : "Guardar cambios"}</button>
      </form>
    </Modal>
  );
}
