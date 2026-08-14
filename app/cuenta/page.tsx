"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RequiereSesion } from "@/components/cuenta/RequiereSesion";
import { useAuth } from "@/components/providers/AuthProvider";
import { useCarritoStore } from "@/lib/carrito/store";
import { supabaseBrowser } from "@/lib/supabase/client";

function MenuItem({ href, label, count }: { href: string; label: string; count?: number }) {
  return (
    <Link
      href={href}
      className="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-ink/10 bg-card px-4 font-semibold text-ink"
    >
      <span>{label}{count !== undefined ? ` (${count})` : ""}</span>
      <span aria-hidden="true" className="text-ink-soft">›</span>
    </Link>
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
    <main className="mx-auto max-w-md px-5 py-8 md:py-12">
      <div className="mb-6 flex items-center gap-4">
        <span
          aria-hidden="true"
          className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-coral to-gold font-display text-xl font-bold text-btn-ink"
        >
          {inicial}
        </span>
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl font-semibold text-ink">Mi cuenta</h1>
          <p className="truncate text-sm text-ink-soft">
            {user?.email}
            {rol === "admin" ? (
              <span className="ml-2 rounded-full bg-gradient-to-br from-coral to-gold px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-wide text-btn-ink">
                Admin
              </span>
            ) : null}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <MenuItem href="/cuenta/favoritos" label="Mis favoritos" count={favoritosCount ?? undefined} />
        <MenuItem href="/carrito" label="Mi carrito" count={items.length} />
        <MenuItem href="/cuenta/configuracion" label="Configuración" />
        {rol === "admin" ? <MenuItem href="/cuenta/admin" label="Panel de administración" /> : null}
        <button
          type="button"
          onClick={async () => {
            await signOut();
            router.push("/");
            router.refresh();
          }}
          className="mt-3 flex min-h-11 items-center justify-center rounded-full border border-ink/20 px-4 font-semibold text-ink"
        >
          Cerrar sesión
        </button>
      </div>
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
