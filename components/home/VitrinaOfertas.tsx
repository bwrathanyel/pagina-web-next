import Image from "next/image";
import Link from "next/link";
import { formatearPrecioDesde } from "@/lib/utils/formatoPrecio";
import { fotosDeLaPromo } from "@/lib/promociones/hotSales";
import { Revelar } from "@/components/ui/Revelar";
import { Boleto, TalonPrecio } from "@/components/ui/Boleto";
import type { Promocion } from "@/types/supabase";

/** Vitrina que monta sobre el borde inferior del Hero (-mt negativo) -- ancla
 * la transición foto-a-sangre -> contenido. Son 4 ofertas reales, la más
 * barata de cada destino, cada una como un pase de abordar: foto arriba y en
 * el talón el destino (como código de vuelo) y el precio desde. Un solo árbol
 * responsive: scroll horizontal con snap en móvil, fila a ancho completo
 * desde lg. */
export function VitrinaOfertas({ ofertas }: { ofertas: Promocion[] }) {
  if (ofertas.length < 2) return null;

  return (
    <div className="relative z-10 -mt-6 sm:-mt-8 lg:-mt-10">
      <div className="mx-auto max-w-[var(--ancho-contenido)] px-5">
        <Revelar
          escalonar
          className="-mx-5 flex snap-x snap-proximity gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-4 lg:overflow-visible lg:snap-none"
        >
          {ofertas.map((p) => {
            const foto = fotosDeLaPromo(p)[0];
            const precio = formatearPrecioDesde(p.precio_desde_usd, p.precio_texto);
            const destino = p.producto!.destino ?? p.producto!.nombre;
            return (
              <Link
                key={p.id}
                href={`/producto/${p.producto!.id}`}
                className="group w-[168px] shrink-0 snap-start rounded-card transition-transform duration-300 ease-salida hover:-translate-y-1 active:scale-[0.985] sm:w-[200px] lg:w-auto lg:flex-1"
              >
                <Boleto
                  tamanoTalon="4.25rem"
                  talon={<TalonPrecio codigo={destino} precio={precio ? `desde ${precio}` : null} />}
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={foto}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 22vw, (min-width: 640px) 200px, 168px"
                      className="object-cover transition-[scale] duration-700 ease-salida group-hover:scale-[1.06]"
                    />
                  </div>
                </Boleto>
              </Link>
            );
          })}
        </Revelar>
      </div>
    </div>
  );
}
