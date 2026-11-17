"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { huboSalidaVoluntaria, marcarSalidaVoluntaria, urlLoginConRetorno } from "@/lib/utils/rutaInterna";
import { useAuth } from "@/components/providers/AuthProvider";
import { Esqueleto } from "@/components/ui/Esqueleto";

export function RequiereSesion({ children }: { children: React.ReactNode }) {
  const { user, cargando } = useAuth();
  const router = useRouter();
  const huboSesion = useRef(false);

  useEffect(() => {
    if (user) {
      huboSesion.current = true;
      marcarSalidaVoluntaria(false);
      return;
    }
    if (cargando) return;
    // Cerrar sesión: quien cierra ya navega (a la home); aquí no se navega
    // otra vez. Si la sesión venció, login con retorno y aviso.
    if (huboSalidaVoluntaria()) return;
    router.replace(urlLoginConRetorno(huboSesion.current ? "vencida" : undefined));
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
