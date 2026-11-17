"use client";

import { useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Aviso } from "@/components/ui/Aviso";
import { useAuth } from "@/components/providers/AuthProvider";
import { FormularioLogin } from "@/components/cuenta/FormularioLogin";
import { rutaInterna } from "@/lib/utils/rutaInterna";

const sinSuscripcion = () => () => {};
const leerQuery = () => window.location.search;

export default function LoginPage() {
  const router = useRouter();
  // /cuenta/registro manda acá con ?confirmar=1 cuando Supabase pide
  // confirmar el correo antes de abrir sesión.
  const query = new URLSearchParams(useSyncExternalStore(sinSuscripcion, leerQuery, () => ""));
  const porConfirmar = query.has("confirmar");
  const falloGoogle = query.get("error") === "google";
  const sesionVencida = query.get("aviso") === "vencida";
  const siguiente = rutaInterna(query.get("next"));
  const { user } = useAuth();
  // Con sesión abierta el formulario no sirve: se sale sin dejarlo en el historial.
  useEffect(() => {
    if (user) router.replace(siguiente);
  }, [user, siguiente, router]);

  return (
    <main className="mx-auto max-w-md px-5 py-10 md:py-16">
      <h1 className="font-display text-4xl font-bold leading-none text-ink">Iniciar sesión</h1>
      <p className="mb-8 mt-3 text-ink-soft">Acceda a sus favoritos y a su carrito guardado.</p>

      {porConfirmar ? (
        <Aviso tono="ok" className="mb-6">
          Cuenta creada. Le enviamos un correo: abra el enlace para confirmarla y luego inicie sesión aquí.
        </Aviso>
      ) : null}

      {sesionVencida ? (
        <Aviso tono="info" className="mb-6">
          Su sesión venció. Inicie sesión para continuar.
        </Aviso>
      ) : null}

      {falloGoogle ? (
        <Aviso className="mb-6">No pudimos iniciar sesión con Google. Inténtelo de nuevo o entre con su correo.</Aviso>
      ) : null}

      <FormularioLogin
        siguiente={siguiente}
        onEntrar={() => {
          router.replace(siguiente);
          router.refresh();
        }}
      />

      <p className="mt-8 border-t border-linea pt-6 text-ink-soft">
        ¿No tiene cuenta?{" "}
        <Link href={`/cuenta/registro?next=${encodeURIComponent(siguiente)}`} className="font-semibold text-acento underline-offset-4 hover:underline">
          Regístrese
        </Link>
      </p>
    </main>
  );
}
