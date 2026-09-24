"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { Esqueleto } from "@/components/ui/Esqueleto";

export function RequiereSesion({ children }: { children: React.ReactNode }) {
  const { user, cargando } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!cargando && !user) router.replace("/cuenta/login");
  }, [cargando, user, router]);

  if (cargando || !user) {
    return (
      <main className="mx-auto max-w-md px-5 py-10 md:py-16" aria-busy="true">
        <span className="sr-only">Cargando su cuenta…</span>
        <Esqueleto className="h-10 w-2/3" />
        <Esqueleto className="mt-8 h-44 rounded-card" />
      </main>
    );
  }

  return <>{children}</>;
}
