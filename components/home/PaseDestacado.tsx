"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useReducedMotion } from "motion/react";
import { Boleto } from "@/components/ui/Boleto";
import { Boton } from "@/components/ui/Boton";
import { Icono } from "@/components/ui/Icono";
import { useReservarTarjeta } from "@/components/producto/ReservarCta";
import { MontoAjustado, PrecioMostrado } from "@/components/ui/PrecioMostrado";
import type { PaseHero } from "@/lib/promociones/fotosHero";
import { separarMonto, type PrecioTarjeta } from "@/lib/tarifas";

// --dur-lenta y --ease-salida de globals.css.
const CONTEO_MS = 600;
const salida = (t: number) => 1 - Math.pow(1 - t, 3);

// Solo montos de montoConMoneda ("$286", "€1250.50"): el texto libre del
// tarifario no se cuenta.
function leerMonto(texto: string | undefined) {
  const m = texto ? /^([$€])(\d+(?:\.\d+)?)$/.exec(texto) : null;
  return m ? { signo: m[1], valor: Number(m[2]), decimales: m[2].includes(".") } : null;
}

// El monto del pase nuevo cuenta desde el del anterior. Se cuenta el texto
// nativo (USD/EUR) y PrecioMostrado convierte cada cuadro, así en Bs también
// cuenta. Entre monedas distintas no: pasar de €286 a $450 contando
// insinuaría que el mismo precio subió.
function useMontoContado(texto: string | undefined, desde: string | undefined) {
  const reducido = useReducedMotion();
  const de = leerMonto(desde);
  const a = leerMonto(texto);
  const cuenta = !reducido && !!de && !!a && de.signo === a.signo && de.valor !== a.valor;
  const [cuadro, setCuadro] = useState<string | null>(cuenta ? desde! : null);

  useEffect(() => {
    if (!cuenta || !de || !a) return;
    const inicio = performance.now();
    let id = requestAnimationFrame(function paso(ahora) {
      const t = Math.min(1, (ahora - inicio) / CONTEO_MS);
      if (t === 1) return setCuadro(null);
      const v = de.valor + (a.valor - de.valor) * salida(t);
      setCuadro(a.signo + (a.decimales ? v.toFixed(2) : String(Math.round(v))));
      id = requestAnimationFrame(paso);
    });
    return () => cancelAnimationFrame(id);
    // Una sola cuenta por montaje: el pase se vuelve a montar con cada promo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return cuenta ? (cuadro ?? texto) : texto;
}

// El "pase destacado" del hero: la promo de la foto que está en pantalla,
// como un boleto con el precio en el talón. Un solo árbol: en el teléfono es
// una tira compacta (hotel + precio) bajo el titular; desde lg crece a la
// columna derecha con plan, lo que incluye, la vigencia y "Ver oferta".
// Con compra directa (Margarita, sin stop sale, checkout en horario) suma
// debajo «Reservar y pagar ahora»: hermano del enlace, no hijo (nada de <a> en <a>).
export function PaseDestacado({
  pase,
  destino,
  precioAnterior,
}: {
  pase: PaseHero;
  destino?: string | null;
  precioAnterior?: PrecioTarjeta | null;
}) {
  const lugar = [destino, pase.plan].filter(Boolean).join(" · ");
  const incluye = pase.incluye.length > 0 ? `Incluye ${pase.incluye.join(", ").toLocaleLowerCase("es")}` : null;
  const precio = pase.precio;
  const { monto: montoFinal, unidad, grande } = separarMonto(precio);
  const monto = useMontoContado(montoFinal, separarMonto(precioAnterior ?? null).monto);
  const reservar = useReservarTarjeta(pase.productoId, pase.promoId, "hero", pase.destino);

  return (
    <>
      <Link
        href={pase.href}
        aria-label={`Ver oferta: ${pase.hotel}`}
        className="group block rounded-card transition-transform duration-150 ease-salida active:scale-[0.985]"
      >
        <Boleto
          orientacion="v"
          tamanoTalon="clamp(7rem, 34%, 10.5rem)"
          talon={
            <div className="flex h-full flex-col justify-center gap-1 px-4 py-3 lg:gap-2 lg:py-5">
              {precio ? (
                <>
                  {precio.desde ? <p className="text-xs text-ink-soft">desde</p> : null}
                  {grande ? (
                    <MontoAjustado texto={monto} tope="1.25rem" topeLg="1.875rem" claseMonto="leading-none text-ink" />
                  ) : (
                    <p className="line-clamp-3 font-mono text-sm font-bold leading-none tabular-nums text-ink lg:text-base">
                      <PrecioMostrado texto={monto} />
                    </p>
                  )}
                  {unidad ? <p className="hidden text-xs leading-snug text-ink-soft lg:line-clamp-2">{unidad}</p> : null}
                </>
              ) : (
                <p className="text-sm font-semibold text-ink-soft">Precio a consultar</p>
              )}
              {pase.vigencia ? (
                <p className="mt-1 hidden font-mono text-xs uppercase tracking-wider text-ink-soft lg:line-clamp-2">
                  {pase.vigencia}
                </p>
              ) : null}
              <span className="mt-2 hidden items-center gap-1 text-sm font-semibold text-acento lg:inline-flex">
                Ver oferta
                <Icono
                  nombre="flecha-der"
                  tamano={16}
                  className="transition-transform duration-150 ease-salida group-hover:translate-x-0.5"
                />
              </span>
              <span
                aria-hidden="true"
                className="franja-marca absolute inset-y-0 right-0 w-1 opacity-0 transition-opacity duration-150 ease-salida group-hover:opacity-100 group-focus-visible:opacity-100"
              />
            </div>
          }
        >
          <div className={"flex h-full " + (pase.foto ? "flex-row lg:flex-col" : "flex-col")}>
            {/* El collage del hero: de fondo el destino, acá el alojamiento. Va
                a sangre contra el borde del boleto (el recorte redondeado y las
                muescas son del propio boleto): en el teléfono es una tira a la
                izquierda, desde lg una franja arriba del nombre. */}
            {pase.foto ? (
              <div className="relative w-[4.5rem] shrink-0 overflow-hidden lg:aspect-[16/9] lg:w-full">
                <Image
                  src={pase.foto}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 18rem, 4.5rem"
                  className="object-cover transition-transform duration-300 ease-salida motion-safe:group-hover:scale-[1.04]"
                />
              </div>
            ) : null}
            <div className="flex min-w-0 flex-1 flex-col justify-center px-4 py-3 lg:px-6 lg:py-5">
              <p
                className={
                  "line-clamp-2 font-display font-bold leading-tight text-ink lg:text-2xl " +
                  (pase.foto ? "text-base" : "text-lg")
                }
              >
                {pase.hotel}
              </p>
              {lugar ? <p className="mt-1 truncate text-sm text-ink-soft lg:text-base">{lugar}</p> : null}
              {incluye ? (
                <p className="mt-1.5 line-clamp-1 text-xs leading-snug text-ink-soft lg:mt-3 lg:line-clamp-2 lg:text-sm">
                  {incluye}
                </p>
              ) : null}
            </div>
          </div>
        </Boleto>
      </Link>
      {reservar ? (
        <div className="mt-3">
          <Boton
            variante="firma"
            ancho
            href={reservar.href}
            onClick={reservar.onClick}
            iconoFin={<Icono nombre="flecha-der" tamano={16} />}
          >
            Reservar y pagar ahora
          </Boton>
          <p className="mt-2 hidden text-center text-sm text-white/85 lg:block">
            Compre al instante desde la web: elija fechas, pague y quede confirmado.
          </p>
        </div>
      ) : null}
    </>
  );
}
