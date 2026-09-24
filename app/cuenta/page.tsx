"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RequiereSesion } from "@/components/cuenta/RequiereSesion";
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
}: {
  href: string;
  icono: NombreIcono;
  label: string;
  cuenta?: number;
}) {
  return (
    <li className="border-b border-linea last:border-b-0">
      <Link
        href={href}
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

function CuentaDashboard() {
  const { user, rol, signOut } = useAuth();
  const router = useRouter();
  const { items } = useCarritoStore();
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

  return (
    <main className="mx-auto max-w-md px-5 py-10 md:py-16">
      <div className="mb-8 flex items-center gap-4">
        <span
          aria-hidden="true"
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-pill bg-dusk font-display text-2xl font-bold text-dusk-text"
        >
          {inicial}
        </span>
        <div className="min-w-0">
          <h1 className="font-display text-4xl font-bold leading-none text-ink">Mi cuenta</h1>
          <p className="mt-2 flex min-w-0 items-center gap-2 text-sm text-ink-soft">
            <span className="truncate">{user?.email}</span>
            {rol === "admin" ? <Etiqueta tono="dusk">Admin</Etiqueta> : null}
          </p>
        </div>
      </div>

      <ul className="overflow-hidden rounded-card border border-linea bg-card">
        <FilaMenu href="/cuenta/favoritos" icono="corazon" label="Mis favoritos" cuenta={favoritosCount ?? undefined} />
        <FilaMenu href="/carrito" icono="carrito" label="Mi carrito" cuenta={items.length} />
        <FilaMenu href="/cuenta/configuracion" icono="ajustes" label="Configuración" />
        {rol === "admin" ? <FilaMenu href="/cuenta/admin" icono="maletin" label="Panel de administración" /> : null}
      </ul>

      <Boton
        variante="secundario"
        ancho
        className="mt-6"
        onClick={async () => {
          await signOut();
          router.push("/");
          router.refresh();
        }}
      >
        Cerrar sesión
      </Boton>
    </main>
  );
}

export default function CuentaPage() {
  return (
    <RequiereSesion>
      <CuentaDashboard />
    </RequiereSesion>
  );
}
