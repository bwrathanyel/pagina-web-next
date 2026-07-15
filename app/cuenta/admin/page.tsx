"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { RequiereSesion } from "@/components/cuenta/RequiereSesion";
import { useAuth } from "@/components/providers/AuthProvider";
import { AdminFotoManager } from "@/components/admin/AdminFotoManager";
import { EditarProductoModal, type CambiosProducto } from "@/components/admin/EditarProductoModal";
import { EditarPromocionModal, type CambiosPromocion } from "@/components/admin/EditarPromocionModal";
import { supabaseBrowser } from "@/lib/supabase/client";
import { PRODUCTO_SELECT, PROMOCION_SELECT } from "@/lib/supabase/queries";
import type { Producto, Promocion } from "@/types/supabase";

type ProductoAdmin = Producto & { activo: boolean };
type PromocionAdmin = Promocion & { revisado: boolean };
type Tab = "productos" | "promociones";

async function consultarCatalogoAdmin() {
  const sb = supabaseBrowser();
  const [{ data: productos, error: errorProductos }, { data: promociones, error: errorPromociones }] = await Promise.all([
    sb.from("productos").select(`${PRODUCTO_SELECT},activo`).order("nombre"),
    sb.from("promociones").select(`${PROMOCION_SELECT},revisado`).order("titulo"),
  ]);
  if (errorProductos || errorPromociones) throw new Error("catalogo-no-disponible");
  return { productos: (productos ?? []) as unknown as ProductoAdmin[], promociones: (promociones ?? []) as unknown as PromocionAdmin[] };
}

function PanelAdmin() {
  const [productos, setProductos] = useState<ProductoAdmin[]>([]);
  const [promociones, setPromociones] = useState<PromocionAdmin[]>([]);
  const [tab, setTab] = useState<Tab>("productos");
  const [busqueda, setBusqueda] = useState("");
  const [editandoProducto, setEditandoProducto] = useState<ProductoAdmin | null>(null);
  const [editandoPromocion, setEditandoPromocion] = useState<PromocionAdmin | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function cargar() {
    setCargando(true);
    setError(null);
    try {
      const resultado = await consultarCatalogoAdmin();
      setProductos(resultado.productos);
      setPromociones(resultado.promociones);
    } catch {
      setError("No se pudo cargar el catálogo completo.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    let vigente = true;
    consultarCatalogoAdmin()
      .then((resultado) => {
        if (!vigente) return;
        setProductos(resultado.productos);
        setPromociones(resultado.promociones);
      })
      .catch(() => { if (vigente) setError("No se pudo cargar el catálogo completo."); })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, []);
  const filtro = busqueda.trim().toLocaleLowerCase("es");
  const productosFiltrados = useMemo(() => productos.filter((item) => !filtro || `${item.nombre} ${item.destino ?? ""} ${item.tipo}`.toLocaleLowerCase("es").includes(filtro)), [filtro, productos]);
  const promocionesFiltradas = useMemo(() => promociones.filter((item) => !filtro || `${item.titulo} ${item.producto?.destino ?? ""}`.toLocaleLowerCase("es").includes(filtro)), [filtro, promociones]);

  async function toggleProducto(item: ProductoAdmin) {
    const { data } = await supabaseBrowser().rpc("web_toggle_producto_activo", { p_id: item.id });
    if (data?.ok) setProductos((actual) => actual.map((producto) => producto.id === item.id ? { ...producto, activo: data.activo } : producto));
  }
  async function togglePromocion(item: PromocionAdmin) {
    const { data } = await supabaseBrowser().rpc("web_toggle_promocion_visible", { p_id: item.id });
    if (data?.ok) setPromociones((actual) => actual.map((promocion) => promocion.id === item.id ? { ...promocion, revisado: data.revisado } : promocion));
  }
  function aplicarProducto(id: number, cambios: CambiosProducto) {
    setProductos((actual) => actual.map((item) => item.id === id ? { ...item, nombre: cambios.nombre, tipo: cambios.tipo, destino: cambios.destino || null, descripcion: cambios.descripcion, requisitos: cambios.requisitos, tarifas: item.tarifas.length ? item.tarifas.map((tarifa, index) => index === 0 ? { ...tarifa, precio_texto: cambios.precioTexto, vigencia_texto: cambios.vigenciaTexto || null } : tarifa) : [{ precio_texto: cambios.precioTexto, precio_desde_usd: null, vigencia_texto: cambios.vigenciaTexto || null, vigente: true }] } : item));
  }
  function aplicarPromocion(id: number, cambios: CambiosPromocion) {
    setPromociones((actual) => actual.map((item) => item.id === id ? { ...item, titulo: cambios.titulo, precio_texto: cambios.precioTexto || null, vigencia_texto: cambios.vigenciaTexto || null, ninos_gratis_cantidad: cambios.ninosGratis, incluye_tags: cambios.tags } : item));
  }

  if (cargando) return <div className="rounded-3xl bg-card p-8 text-ink-soft">Cargando catálogo…</div>;
  if (error) return <div className="rounded-3xl border border-coral/25 bg-card p-8"><p className="text-coral">{error}</p><button type="button" onClick={() => void cargar()} className="mt-4 rounded-full bg-coral px-5 py-2.5 text-sm font-bold text-white">Reintentar</button></div>;

  return (
    <>
      <div className="mb-7 grid gap-3 rounded-3xl border border-ink/10 bg-card p-4 shadow-sm md:grid-cols-[1fr_auto] md:items-center">
        <input value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Buscar por nombre, destino o tipo…" className="min-h-12 rounded-2xl border border-ink/12 bg-sand px-4 text-ink outline-none focus:border-coral" />
        <div className="grid grid-cols-2 rounded-2xl bg-sand-2 p-1">
          <button type="button" onClick={() => setTab("productos")} className={`min-h-10 rounded-xl px-4 text-sm font-bold ${tab === "productos" ? "bg-card text-ink shadow-sm" : "text-ink-soft"}`}>Productos · {productos.length}</button>
          <button type="button" onClick={() => setTab("promociones")} className={`min-h-10 rounded-xl px-4 text-sm font-bold ${tab === "promociones" ? "bg-card text-ink shadow-sm" : "text-ink-soft"}`}>Promos · {promociones.length}</button>
        </div>
      </div>

      <div className="space-y-5">
        {tab === "productos" ? productosFiltrados.map((item) => (
          <article key={item.id} className={`rounded-3xl border border-ink/10 bg-card p-5 shadow-sm ${!item.activo ? "opacity-65" : ""}`}>
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div><div className="mb-2 flex flex-wrap gap-2"><span className="rounded-full bg-seafoam-bg px-3 py-1 font-mono text-[0.65rem] font-bold uppercase text-seafoam-text">{item.tipo}</span><span className={`rounded-full px-3 py-1 font-mono text-[0.65rem] font-bold uppercase ${item.activo ? "bg-seafoam-bg text-seafoam-text" : "bg-coral/10 text-coral"}`}>{item.activo ? "Visible" : "Oculto"}</span></div><h2 className="font-display text-2xl font-semibold text-ink">{item.nombre}</h2><p className="mt-1 text-sm text-ink-soft">{item.destino ?? "Sin destino"} · {item.tarifas.find((tarifa) => tarifa.vigente)?.precio_texto ?? "Sin tarifa visible"}</p></div>
              <div className="flex gap-2"><button type="button" onClick={() => setEditandoProducto(item)} className="min-h-11 rounded-full bg-dusk px-5 text-sm font-bold text-dusk-text">Editar datos</button><button type="button" onClick={() => void toggleProducto(item)} className="min-h-11 rounded-full border border-ink/15 px-5 text-sm font-bold text-ink">{item.activo ? "Ocultar" : "Mostrar"}</button></div>
            </div>
            <AdminFotoManager key={`producto-${item.id}-${item.producto_fotos.length}`} fotos={item.producto_fotos} tabla="producto" productoId={item.id} />
          </article>
        )) : promocionesFiltradas.map((item) => (
          <article key={item.id} className={`rounded-3xl border border-ink/10 bg-card p-5 shadow-sm ${!item.revisado ? "opacity-65" : ""}`}>
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div><div className="mb-2 flex flex-wrap gap-2"><span className="rounded-full bg-gold/15 px-3 py-1 font-mono text-[0.65rem] font-bold uppercase text-ink">Promoción</span><span className={`rounded-full px-3 py-1 font-mono text-[0.65rem] font-bold uppercase ${item.revisado ? "bg-seafoam-bg text-seafoam-text" : "bg-coral/10 text-coral"}`}>{item.revisado ? "Visible" : "Oculta"}</span></div><h2 className="font-display text-2xl font-semibold text-ink">{item.titulo}</h2><p className="mt-1 text-sm text-ink-soft">{item.producto?.destino ?? "Sin destino"} · {item.precio_texto ?? "Sin precio visible"}</p></div>
              <div className="flex gap-2"><button type="button" onClick={() => setEditandoPromocion(item)} className="min-h-11 rounded-full bg-dusk px-5 text-sm font-bold text-dusk-text">Editar datos</button><button type="button" onClick={() => void togglePromocion(item)} className="min-h-11 rounded-full border border-ink/15 px-5 text-sm font-bold text-ink">{item.revisado ? "Ocultar" : "Mostrar"}</button></div>
            </div>
            <AdminFotoManager key={`promocion-${item.id}-${item.promocion_fotos.length}`} fotos={item.promocion_fotos} tabla="promocion" productoId={item.id} />
          </article>
        ))}
      </div>
      {(tab === "productos" ? productosFiltrados : promocionesFiltradas).length === 0 ? <p className="rounded-3xl bg-card p-8 text-center text-ink-soft">No encontramos resultados con esa búsqueda.</p> : null}

      {editandoProducto ? <EditarProductoModal producto={editandoProducto} onClose={() => setEditandoProducto(null)} onGuardado={(cambios) => aplicarProducto(editandoProducto.id, cambios)} /> : null}
      {editandoPromocion ? <EditarPromocionModal promocion={editandoPromocion} onClose={() => setEditandoPromocion(null)} onGuardado={(cambios) => aplicarPromocion(editandoPromocion.id, cambios)} /> : null}
    </>
  );
}

function PanelAdminGate() {
  const { rol, cargando } = useAuth();
  if (cargando) return <p className="text-ink-soft">Cargando…</p>;
  if (rol !== "admin") return <p className="rounded-3xl bg-card p-8 text-ink-soft">Esta sección es solo para administradores.</p>;
  return <PanelAdmin />;
}

export default function AdminPage() {
  return (
    <RequiereSesion>
      <main className="mx-auto max-w-6xl px-5 py-12">
        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="mb-2 font-mono text-xs font-bold uppercase tracking-[0.16em] text-coral">Modo administrador</p><h1 className="font-display text-4xl font-semibold text-ink md:text-5xl">Catálogo, tarifas y galerías</h1><p className="mt-3 max-w-2xl text-ink-soft">Edita los datos comerciales, controla qué se publica y administra todas las fotos desde un solo lugar.</p></div><Link href="/" className="inline-flex min-h-11 items-center justify-center rounded-full border border-ink/15 px-5 text-sm font-bold text-ink">Volver al sitio</Link></div>
        <PanelAdminGate />
      </main>
    </RequiereSesion>
  );
}
