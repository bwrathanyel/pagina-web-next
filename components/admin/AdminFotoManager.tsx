"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { fotoUrl } from "@/lib/supabase/fotos";
import { supabaseBrowser } from "@/lib/supabase/client";
import { revalidarSitioPublico } from "@/lib/admin/revalidate";
import type { Foto } from "@/types/supabase";

type Tabla = "producto" | "promocion";

async function dimensiones(file: File): Promise<{ width: number | null; height: number | null }> {
  try {
    const bitmap = await createImageBitmap(file);
    const result = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return result;
  } catch {
    return { width: null, height: null };
  }
}

export function AdminFotoManager({ fotos, tabla, productoId }: { fotos: Foto[]; tabla: Tabla; productoId: number }) {
  const [estado, setEstado] = useState(fotos);
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ordenadas = useMemo(() => [...estado].sort((a, b) => a.orden - b.orden), [estado]);

  async function toggleActivo(foto: Foto) {
    setError(null);
    const rpc = tabla === "producto" ? "web_toggle_producto_foto_activo" : "web_toggle_promocion_foto_activo";
    const { data, error: rpcError } = await supabaseBrowser().rpc(rpc, { p_foto_id: foto.id });
    if (rpcError || !data?.ok) return setError("No se pudo cambiar la visibilidad de la foto.");
    try {
      await revalidarSitioPublico();
      setEstado((actual) => actual.map((item) => item.id === foto.id ? { ...item, activo: data.activo } : item));
    } catch { setError("La foto se guardó, pero la web pública no pudo actualizarse."); }
  }

  async function hacerPrincipal(foto: Foto) {
    setError(null);
    const rpc = tabla === "producto" ? "web_set_producto_foto_principal" : "web_set_promocion_foto_principal";
    const params = tabla === "producto"
      ? { p_foto_id: foto.id, p_producto_id: productoId }
      : { p_foto_id: foto.id, p_promocion_id: productoId };
    const { data, error: rpcError } = await supabaseBrowser().rpc(rpc, params);
    if (rpcError || !data?.ok) return setError("No se pudo elegir esa portada.");
    try {
      await revalidarSitioPublico();
      setEstado((actual) => actual.map((item) => ({ ...item, es_principal: item.id === foto.id, activo: item.id === foto.id ? true : item.activo })));
    } catch { setError("La portada se guardó, pero la web pública no pudo actualizarse."); }
  }

  async function mover(index: number, direccion: -1 | 1) {
    const destino = index + direccion;
    if (destino < 0 || destino >= ordenadas.length) return;
    const siguiente = [...ordenadas];
    [siguiente[index], siguiente[destino]] = [siguiente[destino], siguiente[index]];
    setTrabajando(true);
    setError(null);
    const { data, error: rpcError } = await supabaseBrowser().rpc("web_reordenar_fotos", {
      p_tabla: tabla,
      p_item_id: productoId,
      p_foto_ids: siguiente.map((foto) => foto.id),
    });
    setTrabajando(false);
    if (rpcError || !data?.ok) return setError("No se pudo guardar el nuevo orden.");
    try {
      await revalidarSitioPublico();
      setEstado(siguiente.map((foto, orden) => ({ ...foto, orden })));
    } catch { setError("El orden se guardó, pero la web pública no pudo actualizarse."); }
  }

  async function subir(file: File) {
    if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) {
      setError("Usa JPG, PNG, WebP o AVIF de hasta 10 MB.");
      return;
    }
    setTrabajando(true);
    setError(null);
    const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const storagePath = `web-admin/${tabla}-${productoId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const sb = supabaseBrowser();
    const { error: uploadError } = await sb.storage.from("tarifario-fotos").upload(storagePath, file, { upsert: false });
    if (uploadError) {
      setTrabajando(false);
      setError("No se pudo subir la imagen.");
      return;
    }
    const size = await dimensiones(file);
    const rpc = tabla === "producto" ? "web_agregar_producto_foto" : "web_agregar_promocion_foto";
    const params = tabla === "producto"
      ? { p_producto_id: productoId, p_storage_path: storagePath, p_width: size.width, p_height: size.height }
      : { p_promocion_id: productoId, p_storage_path: storagePath, p_width: size.width, p_height: size.height };
    const { data, error: rpcError } = await sb.rpc(rpc, params);
    setTrabajando(false);
    if (rpcError || !data?.ok) return setError("La imagen subió, pero no se pudo asociar a esta opción.");
    try {
      await revalidarSitioPublico();
      setEstado((actual) => [...actual, {
        id: Number(data.id), storage_path: storagePath, orden: actual.length,
        es_principal: Boolean(data.es_principal), activo: true, width: size.width, height: size.height,
      }]);
    } catch { setError("La imagen se asoció, pero la web pública no pudo actualizarse."); }
  }

  return (
    <div className="mt-4 rounded-2xl border border-dashed border-ink/20 bg-sand/40 p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div><p className="font-mono text-xs font-bold uppercase tracking-wide text-ink-soft">Galería · {estado.length} fotos</p><p className="mt-1 text-xs text-ink-soft">Sube, ordena, oculta o elige la portada.</p></div>
        <label className="inline-flex min-h-10 cursor-pointer items-center rounded-full bg-coral px-4 text-xs font-bold text-white">
          {trabajando ? "Procesando…" : "Añadir foto"}
          <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={trabajando} className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void subir(file); event.currentTarget.value = ""; }} />
        </label>
      </div>
      {error ? <p className="mb-3 rounded-xl bg-coral/10 px-3 py-2 text-xs text-coral">{error}</p> : null}
      {ordenadas.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{ordenadas.map((foto, index) => (
        <div key={foto.id} className="rounded-xl border border-ink/10 bg-card p-2">
          <div className={`relative aspect-square overflow-hidden rounded-lg bg-sand-2 ${!foto.activo ? "opacity-40" : ""}`}>
            <Image src={fotoUrl(foto.storage_path)} alt="" fill sizes="160px" className="object-cover" />
            {foto.es_principal ? <span className="absolute left-1.5 top-1.5 rounded-full bg-coral px-2 py-1 font-mono text-[0.58rem] font-bold uppercase text-white">Portada</span> : null}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1">
            <button type="button" onClick={() => void toggleActivo(foto)} className="min-h-8 rounded-lg border border-ink/15 text-[0.65rem] font-bold text-ink">{foto.activo ? "Ocultar" : "Mostrar"}</button>
            {!foto.es_principal ? <button type="button" onClick={() => void hacerPrincipal(foto)} className="min-h-8 rounded-lg border border-ink/15 text-[0.65rem] font-bold text-ink">Portada</button> : <span />}
            <button type="button" disabled={index === 0 || trabajando} onClick={() => void mover(index, -1)} className="min-h-8 rounded-lg bg-sand-2 text-xs font-bold text-ink disabled:opacity-30" aria-label="Mover antes">←</button>
            <button type="button" disabled={index === ordenadas.length - 1 || trabajando} onClick={() => void mover(index, 1)} className="min-h-8 rounded-lg bg-sand-2 text-xs font-bold text-ink disabled:opacity-30" aria-label="Mover después">→</button>
          </div>
        </div>
      ))}</div> : <p className="rounded-xl bg-card p-4 text-sm text-ink-soft">Todavía no hay fotos. Añade la primera para crear la galería.</p>}
    </div>
  );
}
