"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { urlLoginConRetorno } from "@/lib/utils/rutaInterna";
import { useAuth } from "@/components/providers/AuthProvider";
import { Esqueleto } from "@/components/ui/Esqueleto";

export function RequiereSesion({ children }: { children: React.ReactNode }) {
  const { user, cargando } = useAuth();
  const router = useRouter();
  // Tras cerrar sesión no se guarda el retorno: en un equipo compartido el
  // siguiente usuario caería en la página del anterior.
  const huboSesion = useRef(false);

  useEffect(() => {
    if (user) huboSesion.current = true;
    if (!cargando && !user) router.replace(huboSesion.current ? "/cuenta/login" : urlLoginConRetorno());
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
