"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { supabaseBrowser } from "@/lib/supabase/client";
import { revalidarSitioPublico } from "@/lib/admin/revalidate";
import type { Producto, ProductoTipo } from "@/types/supabase";

export type CambiosProducto = {
  nombre: string;
  tipo: ProductoTipo;
  destino: string;
  descripcion: string;
  requisitos: string;
  precioTexto: string;
  vigenciaTexto: string;
};

const inputClass = "w-full rounded-xl border border-ink/15 bg-sand px-4 py-3 text-base text-ink outline-none focus:border-coral";

export function EditarProductoModal({ producto, onClose, onGuardado }: { producto: Producto; onClose: () => void; onGuardado: (cambios: CambiosProducto) => void }) {
  const tarifa = producto.tarifas.find((item) => item.vigente) ?? producto.tarifas[0];
  const [campos, setCampos] = useState<CambiosProducto>({
    nombre: producto.nombre,
    tipo: producto.tipo,
    destino: producto.destino ?? "",
    descripcion: producto.descripcion ?? "",
    requisitos: producto.requisitos ?? "",
    precioTexto: tarifa?.precio_texto ?? "",
    vigenciaTexto: tarifa?.vigencia_texto ?? "",
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function cambiar<K extends keyof CambiosProducto>(clave: K, valor: CambiosProducto[K]) {
    setCampos((actual) => ({ ...actual, [clave]: valor }));
  }

  async function guardar(event: React.FormEvent) {
    event.preventDefault();
    if (!campos.nombre.trim()) return setError("El nombre no puede quedar vacío.");
    setGuardando(true);
    setError(null);
    const { data, error: rpcError } = await supabaseBrowser().rpc("web_actualizar_producto_completo", {
      p_id: producto.id,
      p_nombre: campos.nombre,
      p_tipo: campos.tipo,
      p_destino: campos.destino,
      p_descripcion: campos.descripcion,
      p_requisitos: campos.requisitos,
      p_precio_texto: campos.precioTexto,
      p_vigencia_texto: campos.vigenciaTexto,
    });
    if (rpcError || !data?.ok) {
      setGuardando(false);
      return setError("No se pudo guardar. Revisa los datos e inténtalo de nuevo.");
    }
    try {
      await revalidarSitioPublico();
      onGuardado(campos);
      onClose();
    } catch {
      setError("Los datos se guardaron, pero no se pudo actualizar la web pública. Inténtalo nuevamente.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal titulo="Editar producto y tarifa" onClose={onClose}>
      <form onSubmit={guardar} className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-ink sm:col-span-2">Nombre<input value={campos.nombre} onChange={(e) => cambiar("nombre", e.target.value)} className={`${inputClass} mt-1.5`} /></label>
        <label className="text-sm font-semibold text-ink">Tipo<select value={campos.tipo} onChange={(e) => cambiar("tipo", e.target.value as ProductoTipo)} className={`${inputClass} mt-1.5`}><option value="hotel">Hotel</option><option value="paquete">Paquete</option><option value="destino">Guía / tour</option><option value="info">Información</option></select></label>
        <label className="text-sm font-semibold text-ink">Destino<input value={campos.destino} onChange={(e) => cambiar("destino", e.target.value)} className={`${inputClass} mt-1.5`} /></label>
        <label className="text-sm font-semibold text-ink sm:col-span-2">Descripción<textarea rows={5} value={campos.descripcion} onChange={(e) => cambiar("descripcion", e.target.value)} className={`${inputClass} mt-1.5`} /></label>
        <label className="text-sm font-semibold text-ink sm:col-span-2">Requisitos<textarea rows={3} value={campos.requisitos} onChange={(e) => cambiar("requisitos", e.target.value)} className={`${inputClass} mt-1.5`} /></label>
        <label className="text-sm font-semibold text-ink">Precio visible<input value={campos.precioTexto} onChange={(e) => cambiar("precioTexto", e.target.value)} placeholder="Ej: Desde $120 por persona" className={`${inputClass} mt-1.5`} /></label>
        <label className="text-sm font-semibold text-ink">Vigencia<input value={campos.vigenciaTexto} onChange={(e) => cambiar("vigenciaTexto", e.target.value)} placeholder="Ej: Hasta el 30 de agosto" className={`${inputClass} mt-1.5`} /></label>
        {error ? <p className="text-sm text-coral sm:col-span-2">{error}</p> : null}
        <button type="submit" disabled={guardando} className="min-h-12 rounded-full bg-coral px-5 font-semibold text-white disabled:opacity-60 sm:col-span-2">{guardando ? "Guardando…" : "Guardar cambios"}</button>
      </form>
    </Modal>
  );
}
