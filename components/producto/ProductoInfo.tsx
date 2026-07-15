"use client";

import { useState } from "react";
import Link from "next/link";
import { BADGE_POR_TIPO } from "@/components/catalogo/ProductoCard";
import { useAuth } from "@/components/providers/AuthProvider";
import { EditarProductoModal } from "@/components/admin/EditarProductoModal";
import { AdminFotoManager } from "@/components/admin/AdminFotoManager";
import type { Producto } from "@/types/supabase";

export function ProductoInfo({ producto }: { producto: Producto }) {
  const { rol, modoEdicion } = useAuth();
  const [nombre, setNombre] = useState(producto.nombre);
  const [descripcion, setDescripcion] = useState(producto.descripcion);
  const [requisitos, setRequisitos] = useState(producto.requisitos);
  const [editando, setEditando] = useState(false);

  const tarifaVigente = producto.tarifas.find((t) => t.vigente);
  const puedeEditar = rol === "admin" && modoEdicion;

  return (
    <div>
      <span className="mb-2 inline-block rounded-full bg-dusk/85 px-2.5 py-1 font-mono text-[0.68rem] uppercase tracking-wide text-dusk-text">
        {BADGE_POR_TIPO[producto.tipo]}
      </span>
      <h1 className="mb-1 font-display text-3xl font-semibold text-ink">{nombre}</h1>
      {producto.destino ? <p className="mb-4 text-ink-soft">{producto.destino}</p> : null}

      <span
        className={
          "mb-5 inline-block rounded-full px-3 py-1.5 font-mono text-sm " +
          (tarifaVigente ? "bg-gradient-to-br from-coral to-gold text-btn-ink" : "bg-seafoam-bg text-seafoam-text")
        }
      >
        {tarifaVigente?.precio_texto ?? "Consultar disponibilidad"}
      </span>
      {tarifaVigente?.vigencia_texto ? (
        <p className="mb-5 -mt-3 text-sm text-ink-soft">{tarifaVigente.vigencia_texto}</p>
      ) : null}

      {descripcion ? <p className="mb-4 whitespace-pre-line text-ink">{descripcion}</p> : null}
      {requisitos ? (
        <div className="mb-5">
          <p className="mb-1 font-mono text-xs uppercase tracking-wide text-ink-soft">Requisitos</p>
          <p className="whitespace-pre-line text-ink">{requisitos}</p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/cotizar/producto/${producto.id}`}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-gradient-to-br from-coral to-gold px-6 font-semibold text-btn-ink"
        >
          Cotizar
        </Link>
        {puedeEditar ? (
          <button
            type="button"
            onClick={() => setEditando(true)}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-ink/20 px-6 font-semibold text-ink"
          >
            Editar
          </button>
        ) : null}
      </div>

      {puedeEditar ? (
        <AdminFotoManager fotos={producto.producto_fotos} tabla="producto" productoId={producto.id} />
      ) : null}

      {editando ? (
        <EditarProductoModal
          producto={{ ...producto, nombre, descripcion, requisitos }}
          onClose={() => setEditando(false)}
          onGuardado={(c) => {
            setNombre(c.nombre);
            setDescripcion(c.descripcion);
            setRequisitos(c.requisitos);
          }}
        />
      ) : null}
    </div>
  );
}
