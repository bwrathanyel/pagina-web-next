"use client";

import { useState, type ReactNode } from "react";
import { BADGE_POR_TIPO } from "@/components/catalogo/ProductoCard";
import { useAuth } from "@/components/providers/AuthProvider";
import { EditarProductoModal } from "@/components/admin/EditarProductoModal";
import { AdminFotoManager } from "@/components/admin/AdminFotoManager";
import { CajaPrecio } from "@/components/producto/CajaPrecio";
import { Boton } from "@/components/ui/Boton";
import { Etiqueta } from "@/components/ui/Insignia";
import { resumenBullets } from "@/lib/utils/resumenBullets";
import type { Producto } from "@/types/supabase";

/** Cuerpo de la ficha. En el teléfono va en una columna (título, caja de
 * precio, texto, tarifas). Desde `lg` el título y el texto ocupan la columna
 * izquierda y la caja de precio, la derecha, pegada mientras se leen las
 * tarifas (`children`: la carpeta, que llega ya armada desde el servidor). */
export function ProductoInfo({ producto, children }: { producto: Producto; children?: ReactNode }) {
  const { rol, modoEdicion } = useAuth();
  const [nombre, setNombre] = useState(producto.nombre);
  const [descripcion, setDescripcion] = useState(producto.descripcion);
  const [requisitos, setRequisitos] = useState(producto.requisitos);
  const [editando, setEditando] = useState(false);

  const puedeEditar = rol === "admin" && modoEdicion;

  return (
    <div className="mt-5 lg:mt-8 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-x-10">
      <header className="lg:col-start-1 lg:row-start-1">
        <Etiqueta tono="dusk">{BADGE_POR_TIPO[producto.tipo]}</Etiqueta>
        <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-ink lg:text-4xl">{nombre}</h1>
        {producto.destino ? <p className="mt-1 text-lg text-ink-soft">{producto.destino}</p> : null}
      </header>

      <CajaPrecio
        producto={producto}
        className="my-6 lg:sticky lg:top-[calc(var(--offset-sticky)+1.5rem)] lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:my-0 lg:self-start"
      />

      <div className="lg:col-start-1 lg:row-start-2 lg:mt-8">
        {descripcion ? (
          <ul className="space-y-1.5 text-ink">
            {resumenBullets(descripcion).map((oracion, i) => (
              <li key={i} className="relative pl-4 before:absolute before:left-0 before:text-acento before:content-['•']">
                {oracion}
              </li>
            ))}
          </ul>
        ) : null}
        {requisitos ? (
          <div className="mt-5">
            <p className="mb-1 font-mono text-xs uppercase tracking-wide text-ink-soft">Requisitos</p>
            <p className="whitespace-pre-line text-ink">{requisitos}</p>
          </div>
        ) : null}

        {puedeEditar ? (
          <>
            <Boton variante="secundario" tamano="sm" onClick={() => setEditando(true)} className="mt-5">
              Editar
            </Boton>
            <AdminFotoManager fotos={producto.producto_fotos} tabla="producto" productoId={producto.id} />
          </>
        ) : null}
      </div>

      <div className="lg:col-start-1 lg:row-start-3">{children}</div>

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
