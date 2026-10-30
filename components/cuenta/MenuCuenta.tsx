"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { Boton } from "@/components/ui/Boton";
import { Icono, type NombreIcono } from "@/components/ui/Icono";
import { Etiqueta } from "@/components/ui/Insignia";
import { useCarritoStore } from "@/lib/carrito/store";
import { supabaseBrowser } from "@/lib/supabase/client";

function FilaMenu({
  href,
  icono,
  label,
  cuenta,
  onNavegar,
}: {
  href: string;
  icono: NombreIcono;
  label: string;
  cuenta?: number;
  onNavegar?: () => void;
}) {
  return (
    <li className="border-b border-linea last:border-b-0">
      <Link
        href={href}
        onClick={onNavegar}
        className="flex min-h-14 items-center gap-4 px-4 font-semibold text-ink transition-colors duration-150 hover:bg-sand-2"
      >
        <Icono nombre={icono} className="text-ink-soft" />
        <span className="flex-1">{label}</span>
        {cuenta !== undefined ? (
          <span className="font-mono text-sm font-bold tabular-nums text-ink-soft">
            {cuenta}
            <span className="sr-only"> {cuenta === 1 ? "elemento" : "elementos"}</span>
          </span>
        ) : null}
        <Icono nombre="flecha-der" tamano={18} className="text-ink-soft" />
      </Link>
    </li>
  );
}

/** Avatar, accesos y cerrar sesión. Lo usan /cuenta (con `titulo` como h1) y
 * el panel de cuenta del header (el título ya lo pone la hoja). */
export function MenuCuenta({
  titulo,
  onNavegar,
  onSalir,
}: {
  titulo?: string;
  onNavegar?: () => void;
  /** Corre después de cerrar la sesión. */
  onSalir: () => void;
}) {
  const { user, rol, signOut } = useAuth();
  const cantidadCarrito = useCarritoStore((s) => s.items.length);
  const [favoritosCount, setFavoritosCount] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    let vigente = true;
    supabaseBrowser()
      .from("web_favoritos")
      .select("*", { count: "exact", head: true })
      .eq("usuario_id", user.id)
      .then(({ count }) => {
        if (vigente) setFavoritosCount(count ?? 0);
      });
    return () => {
      vigente = false;
    };
  }, [user]);

  const inicial = (user?.email?.[0] ?? "?").toUpperCase();
  const insigniaAdmin = rol === "admin" ? <Etiqueta tono="dusk">Admin</Etiqueta> : null;

  return (
    <>
      <div className={`flex items-center gap-4 ${titulo ? "mb-8" : "mb-6"}`}>
        <span
          aria-hidden="true"
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-pill bg-dusk font-display text-2xl font-bold text-dusk-text"
        >
          {inicial}
        </span>
        <div className="min-w-0">
          {titulo ? (
            <>
              <h1 className="font-display text-4xl font-bold leading-none text-ink">{titulo}</h1>
              <p className="mt-2 flex min-w-0 items-center gap-2 text-sm text-ink-soft">
                <span className="truncate">{user?.email}</span>
                {insigniaAdmin}
              </p>
            </>
          ) : (
            <p className="flex min-w-0 items-center gap-2 font-semibold text-ink">
              <span className="truncate">{user?.email}</span>
              {insigniaAdmin}
            </p>
          )}
        </div>
      </div>

      <ul className="overflow-hidden rounded-card border border-linea bg-card">
        <FilaMenu href="/cuenta/favoritos" icono="corazon" label="Mis favoritos" cuenta={favoritosCount ?? undefined} onNavegar={onNavegar} />
        <FilaMenu href="/carrito" icono="carrito" label="Mi carrito" cuenta={cantidadCarrito} onNavegar={onNavegar} />
        <FilaMenu href="/cuenta/configuracion" icono="ajustes" label="Configuración" onNavegar={onNavegar} />
        {rol === "admin" ? (
          <FilaMenu href="/cuenta/admin" icono="maletin" label="Panel de administración" onNavegar={onNavegar} />
        ) : null}
      </ul>

      <Boton
        variante="secundario"
        ancho
        className="mt-6"
        onClick={async () => {
          await signOut();
          onSalir();
        }}
      >
        Cerrar sesión
      </Boton>
    </>
  );
}
