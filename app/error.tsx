"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Boton } from "@/components/ui/Boton";
import { Icono } from "@/components/ui/Icono";
import { WhatsAppIcon } from "@/components/ui/icons/WhatsAppIcon";
import { whatsappHref } from "@/lib/whatsapp";

// En Next 16.3 el reintento es `retry` (vuelve a pedir los datos del segmento
// y lo re-renderiza); `reset` solo limpia el estado sin volver a pedir nada.
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const ruta = usePathname();

  // Una pestaña abierta desde antes de un deploy pide chunks que ya no existen
  // (pasó el 2026-09-24 al tocar Cuenta): se recarga UNA vez por ruta y solo
  // si vuelve a fallar se muestra esta pantalla.
  useEffect(() => {
    console.error(error);
    if (!/ChunkLoadError|Loading (CSS )?chunk|dynamically imported module/i.test(`${error.name} ${error.message}`)) return;
    try {
      const clave = `recarga-chunk:${ruta}`;
      if (sessionStorage.getItem(clave)) return;
      sessionStorage.setItem(clave, "1");
    } catch {
      return;
    }
    window.location.reload();
  }, [error, ruta]);

  const mensaje =
    `Hola, la página ${ruta} de la web me dio un error al cargar.` +
    (error.digest ? ` Referencia: ${error.digest}` : "");

  return (
    <section className="px-5 py-16 md:py-28">
      <div className="mx-auto max-w-[var(--ancho-medio)]">
        <span className="flex h-12 w-12 items-center justify-center rounded-pill bg-peligro-suave text-peligro">
          <Icono nombre="alerta" tamano={24} />
        </span>
        <h1 className="mt-6 max-w-[18ch] font-display text-4xl font-extrabold leading-[1.02] tracking-tight text-balance text-ink md:text-5xl">
          Esta página no terminó de cargar
        </h1>
        <p className="mt-5 max-w-[56ch] text-lg leading-relaxed text-ink-soft">
          Puede ser la conexión o un error de nuestro lado. Intente de nuevo; si sigue igual,
          escríbanos por WhatsApp y un asesor le atiende.
        </p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Boton onClick={() => retry()} tamano="lg">
            Intentar de nuevo
          </Boton>
          <Boton href={whatsappHref(mensaje)} variante="whatsapp" tamano="lg" iconoInicio={<WhatsAppIcon />}>
            Escribir por WhatsApp
          </Boton>
        </div>
        {error.digest ? (
          <p className="mt-12 font-mono text-sm text-ink-soft">Referencia: {error.digest}</p>
        ) : null}
      </div>
    </section>
  );
}
