"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { RequiereSesion } from "@/components/cuenta/RequiereSesion";
import { useAuth } from "@/components/providers/AuthProvider";

function CuentaDashboard() {
  const { user, rol, signOut } = useAuth();
  const router = useRouter();

  return (
    <main className="mx-auto max-w-md px-5 py-12">
      <h1 className="mb-1 font-display text-3xl font-semibold text-ink">Mi cuenta</h1>
      <p className="mb-6 text-ink-soft">
        {user?.email}
        {rol === "admin" ? (
          <span className="ml-2 rounded-full bg-gradient-to-br from-coral to-gold px-2.5 py-0.5 font-mono text-[0.7rem] uppercase tracking-wide text-btn-ink">
            Admin
          </span>
        ) : null}
      </p>

      <div className="flex flex-col gap-3">
        <Link
          href="/cuenta/favoritos"
          className="flex min-h-11 items-center rounded-xl border border-ink/10 bg-card px-4 font-semibold text-ink"
        >
          Mis favoritos
        </Link>
        <Link
          href="/carrito"
          className="flex min-h-11 items-center rounded-xl border border-ink/10 bg-card px-4 font-semibold text-ink"
        >
          Mi carrito
        </Link>
        <Link
          href="/cuenta/configuracion"
          className="flex min-h-11 items-center rounded-xl border border-ink/10 bg-card px-4 font-semibold text-ink"
        >
          Configuración
        </Link>
        {rol === "admin" ? (
          <Link
            href="/cuenta/admin"
            className="flex min-h-11 items-center rounded-xl border border-ink/10 bg-card px-4 font-semibold text-ink"
          >
            Panel de administración
          </Link>
        ) : null}
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
