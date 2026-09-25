"use client";

import Image from "next/image";
import Link from "next/link";
import { Boleto } from "@/components/ui/Boleto";
import { Icono } from "@/components/ui/Icono";
import { PrecioMostrado, usePrecioMostrado } from "@/components/ui/PrecioMostrado";
import type { PaseHero } from "@/lib/promociones/fotosHero";
import { separarMonto } from "@/lib/tarifas";

// El monto grande del talón se achica hasta que su palabra más larga entre en
// el ancho del talón: en Bs ("Bs 1.155.160,00") el número triplica el largo
// del de USD/EUR y a tamaño fijo se cortaba. 0,62em = ancho de un glifo mono;
// el tope es el tamaño de siempre (text-xl / lg:text-3xl).
function MontoAjustado({ texto }: { texto: string | undefined }) {
  const mostrado = usePrecioMostrado(texto) ?? "";
  const glifos = Math.max(4, ...mostrado.split(/\s+/).map((p) => p.length)) * 0.62;
  return (
    <div className="@container">
      <p
        style={{ "--glifos": glifos } as React.CSSProperties}
        className={
          "font-mono font-bold leading-none tabular-nums text-ink " +
          "[font-size:max(0.75rem,min(1.25rem,calc(100cqi/var(--glifos))))] " +
          "lg:[font-size:max(0.75rem,min(1.875rem,calc(100cqi/var(--glifos))))]"
        }
      >
        {mostrado}
      </p>
    </div>
  );
}

// El "pase destacado" del hero: la promo de la foto que está en pantalla,
// como un boleto con el precio en el talón. Un solo árbol: en el teléfono es
// una tira compacta (hotel + precio) bajo el titular; desde lg crece a la
// columna derecha con plan, lo que incluye, la vigencia y "Ver oferta".
export function PaseDestacado({ pase, destino }: { pase: PaseHero; destino?: string | null }) {
  const lugar = [destino, pase.plan].filter(Boolean).join(" · ");
  const incluye = pase.incluye.length > 0 ? `Incluye ${pase.incluye.join(", ").toLocaleLowerCase("es")}` : null;
  const precio = pase.precio;
  const { monto, unidad, grande } = separarMonto(precio);

  return (
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
                  <MontoAjustado texto={monto} />
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
            {incluye ? <p className="mt-3 hidden text-sm leading-snug text-ink-soft lg:line-clamp-2">{incluye}</p> : null}
          </div>
        </div>
      </Boleto>
    </Link>
  );
}
