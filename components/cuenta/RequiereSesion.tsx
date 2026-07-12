"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";

export function RequiereSesion({ children }: { children: React.ReactNode }) {
  const { user, cargando } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!cargando && !user) router.replace("/cuenta/login");
  }, [cargando, user, router]);

  if (cargando || !user) {
    return <main className="mx-auto max-w-md px-5 py-12 text-ink-soft">Cargando…</main>;
  }

  return <>{children}</>;
}
