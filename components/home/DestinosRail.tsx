import Image from "next/image";
import Link from "next/link";
import { Seccion } from "@/components/ui/Seccion";
import { Carrusel } from "@/components/ui/Carrusel";
import { PrecioMostrado } from "@/components/ui/PrecioMostrado";
import { CLASE_ETIQUETA_SECCION, CLASE_TITULO_SECCION, EncabezadoSeccion } from "@/components/ui/EncabezadoSeccion";
import type { DestinoConOfertas } from "@/lib/promociones/hotSales";

/** Tiras por destino (reemplaza a la vitrina de 4 ofertas): foto a sangre,
 * el nombre como un cartel de puerta de embarque y, tras la perforación, el
 * conteo y el piso de precio en mono. Cada tira abre Hot Sales ya filtrado
 * (`?destino=`, lo lee HotSalesGrid). Con menos de 3 destinos no hay nada que
 * recorrer y la sección no se monta. */
export function DestinosRail({ destinos }: { destinos: DestinoConOfertas[] }) {
  if (destinos.length < 3) return null;

  return (
    <Seccion ritmo="densa">
      <EncabezadoSeccion
        titulo={<h2 className={CLASE_TITULO_SECCION + " text-ink"}>Destinos con ofertas</h2>}
        etiqueta={
          <p className={CLASE_ETIQUETA_SECCION + " text-acento"}>
            {destinos.length} destinos con promos vigentes
          </p>
        }
      />

      <Carrusel
        anchoItem="62%"
        maxItem="252px"
        gap="gap-3 sm:gap-4"
        flechas
        items={destinos.map((d) => (
          <Link
            key={d.destino}
            href={`/catalogo/hot-sales?destino=${encodeURIComponent(d.destino)}`}
            className="group relative flex aspect-3/4 flex-col justify-end overflow-hidden rounded-card bg-dusk-2 text-dusk-text transition-transform duration-150 ease-salida active:scale-[0.985]"
          >
            <Image
              src={d.foto}
              alt=""
              fill
              sizes="(min-width: 640px) 252px, 62vw"
              className="object-cover transition-[scale] duration-700 ease-salida group-hover:scale-[1.04]"
            />
            <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-dusk from-20% via-dusk/70 to-transparent" />
            <span className="relative p-4">
              <span className="block text-balance font-display text-2xl font-bold leading-none tracking-[-0.01em] sm:text-3xl">
                {d.destino}
              </span>
              <span className="mt-3 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1 border-t-2 border-dashed border-dusk-text/30 pt-2.5 font-mono text-xs font-bold">
                <span className="uppercase tracking-[0.14em] text-dusk-text-soft">
                  {d.ofertas} {d.ofertas === 1 ? "oferta" : "ofertas"}
                </span>
                {d.desde ? (
                  <span className="text-sm text-gold tabular-nums">
                    desde <PrecioMostrado texto={d.desde} />
                    {d.nota ? <span className="font-normal text-dusk-text-soft"> {d.nota}</span> : null}
                  </span>
                ) : null}
              </span>
            </span>
          </Link>
        ))}
      />
    </Seccion>
  );
}
