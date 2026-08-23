import Image from "next/image";
import Link from "next/link";
import { formatearPrecioDesde } from "@/lib/utils/formatoPrecio";
import { fotosDeLaPromo } from "@/lib/promociones/hotSales";
import { Revelar } from "@/components/ui/Revelar";
import type { Promocion } from "@/types/supabase";

/** Vitrina que monta sobre el borde inferior del Hero (-mt negativo) -- ancla
 * la transición foto-a-sangre -> contenido, igual que las fichas de categoría
 * que había antes acá. La diferencia es qué muestra: antes eran 4 puertas a
 * /catalogo que repetían el header y llevaban fotos editoriales fijas (dos de
 * las cuatro ni siquiera consultaban Supabase); ahora son 4 ofertas reales, la
 * más barata de cada destino, con su foto y su precio. Un solo árbol
 * responsive: scroll horizontal con snap en móvil, fila a ancho completo
 * desde lg. */
export function VitrinaOfertas({ ofertas }: { ofertas: Promocion[] }) {
  if (ofertas.length < 2) return null;

  return (
    <div className="relative z-10 -mt-6 sm:-mt-8 lg:-mt-10">
      <div className="mx-auto max-w-[var(--ancho-contenido)] px-5">
        <div className="-mx-5 flex snap-x snap-proximity gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-4 lg:overflow-visible lg:px-5 lg:snap-none">
          {ofertas.map((p, i) => {
            const foto = fotosDeLaPromo(p)[0];
            const precio = formatearPrecioDesde(p.precio_desde_usd, p.precio_texto);
            return (
              <Revelar key={p.id} retraso={i * 70} className="shrink-0 snap-start lg:flex-1">
                <Link
                  href={`/producto/${p.producto!.id}`}
                  className="group relative block aspect-[4/3] w-[150px] overflow-hidden rounded-[var(--radius-media)] shadow-lift transition-[transform,scale,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 hover:shadow-chrome active:scale-[0.985] sm:w-[190px] lg:w-full"
                >
                  <Image
                    src={foto}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 22vw, (min-width: 640px) 190px, 150px"
                    className="object-cover transition-[transform,scale,filter] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.09] group-hover:brightness-[1.05]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dusk/90 via-dusk/25 to-transparent" />
                  <div className="absolute inset-x-3 bottom-3">
                    <span className="block truncate font-display text-base font-semibold text-white sm:text-lg">
                      {p.producto!.destino}
                    </span>
                    {precio ? (
                      <span className="mt-0.5 block font-mono text-xs font-bold uppercase tracking-[0.08em] text-gold">
                        desde {precio}
                      </span>
                    ) : null}
                  </div>
                </Link>
              </Revelar>
            );
          })}
        </div>
      </div>
    </div>
  );
}
