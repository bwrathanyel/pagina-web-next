"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormularioRegistro } from "@/components/cuenta/FormularioRegistro";
import { rutaInterna } from "@/lib/utils/rutaInterna";

const sinSuscripcion = () => () => {};
const leerNext = () => new URLSearchParams(window.location.search).get("next");

export default function RegistroPage() {
  const router = useRouter();
  const siguiente = rutaInterna(useSyncExternalStore(sinSuscripcion, leerNext, () => null));
  const nextLogin = `next=${encodeURIComponent(siguiente)}`;

  return (
    <main className="mx-auto max-w-md px-5 py-10 md:py-16">
      <h1 className="font-display text-4xl font-bold leading-none text-ink">Crear cuenta</h1>
      <p className="mb-8 mt-3 text-ink-soft">Guarde sus favoritos y su carrito entre visitas.</p>

      <FormularioRegistro
        siguiente={siguiente}
        onCreada={() => {
          router.push(siguiente);
          router.refresh();
        }}
        onPorConfirmar={() => router.push(`/cuenta/login?confirmar=1&${nextLogin}`)}
      />

      <p className="mt-8 border-t border-linea pt-6 text-ink-soft">
        ¿Ya tiene cuenta?{" "}
        <Link href={`/cuenta/login?${nextLogin}`} className="font-semibold text-acento underline-offset-4 hover:underline">
          Inicie sesión
        </Link>
      </p>
    </main>
  );
}
