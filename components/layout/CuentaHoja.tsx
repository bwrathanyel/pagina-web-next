"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { FormularioLogin } from "@/components/cuenta/FormularioLogin";
import { FormularioRegistro } from "@/components/cuenta/FormularioRegistro";
import { MenuCuenta } from "@/components/cuenta/MenuCuenta";
import { Aviso } from "@/components/ui/Aviso";
import { Esqueleto } from "@/components/ui/Esqueleto";
import { Hoja } from "@/components/ui/Hoja";
import { usePaneles } from "@/lib/layout/paneles";
import { rutaInterna } from "@/lib/utils/rutaInterna";

const sinSuscripcion = () => () => {};
// Google vuelve a la página donde se abrió el panel, no a /cuenta.
const leerAqui = () => rutaInterna(location.pathname + location.search);

type Pestana = "entrar" | "crear";

function SinSesion({ alEntrar }: { alEntrar: () => void }) {
  const siguiente = useSyncExternalStore(sinSuscripcion, leerAqui, () => "/cuenta");
  const cerrar = usePaneles((s) => s.cerrarCuenta);
  const [pestana, setPestana] = useState<Pestana>("entrar");
  const [porConfirmar, setPorConfirmar] = useState(false);

  return (
    <>
      <p className="mb-5 text-ink-soft">Guarde sus favoritos y su carrito entre visitas.</p>

      <div role="tablist" aria-label="Acceso" className="mb-6 grid grid-cols-2 gap-1 rounded-control bg-sand-2 p-1">
        {([["entrar", "Entrar"], ["crear", "Crear cuenta"]] as const).map(([valor, etiqueta]) => (
          <button
            key={valor}
            type="button"
            role="tab"
            aria-selected={pestana === valor}
            onClick={() => setPestana(valor)}
            className={
              "min-h-11 rounded-control text-sm font-semibold transition-colors duration-150 " +
              (pestana === valor ? "bg-acento text-sobre-acento" : "text-ink-soft hover:text-ink")
            }
          >
            {etiqueta}
          </button>
        ))}
      </div>

      {pestana === "entrar" ? (
        <>
          {porConfirmar ? (
            <Aviso tono="ok" className="mb-6">
              Cuenta creada. Le enviamos un correo: abra el enlace para confirmarla y luego inicie sesión aquí.
            </Aviso>
          ) : null}
          <FormularioLogin siguiente={siguiente} onEntrar={alEntrar} onNavegar={cerrar} />
        </>
      ) : (
        <FormularioRegistro
          siguiente={siguiente}
          onCreada={alEntrar}
          onPorConfirmar={() => {
            setPorConfirmar(true);
            setPestana("entrar");
          }}
        />
      )}
    </>
  );
}

/** Cuenta sin salir de la página: sin sesión, entrar o crear cuenta; con
 * sesión, el mismo menú de /cuenta. Las páginas /cuenta/* siguen existiendo
 * (RequiereSesion, ?error=google y los enlaces de los correos las usan). */
export function CuentaHoja() {
  const abierta = usePaneles((s) => s.cuentaAbierta);
  const cerrar = usePaneles((s) => s.cerrarCuenta);
  const { user, cargando } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Atrás del teléfono, el buscador o cualquier link fuera del panel: la hoja
  // no debe quedar abierta sobre la página nueva.
  useEffect(() => {
    cerrar();
  }, [pathname, cerrar]);

  const cerrarYRefrescar = () => {
    cerrar();
    router.refresh();
  };

  return (
    <Hoja abierta={abierta} onCerrar={cerrar} titulo="Mi cuenta" escritorio="lateral">
      {cargando ? (
        <div aria-busy="true" className="flex flex-col gap-4">
          <span className="sr-only">Cargando su cuenta…</span>
          <Esqueleto className="h-14" />
          <Esqueleto className="h-48" />
        </div>
      ) : user ? (
        <MenuCuenta
          onNavegar={cerrar}
          onSalir={() => {
            // Igual que el botón de /cuenta: desde una página de cuenta, a la home.
            if (pathname.startsWith("/cuenta")) router.push("/");
            cerrarYRefrescar();
          }}
        />
      ) : (
        <SinSesion alEntrar={cerrarYRefrescar} />
      )}
    </Hoja>
  );
}
