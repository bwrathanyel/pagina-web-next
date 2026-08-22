import Image from "next/image";
import Link from "next/link";
import { CATEGORIAS, type Categoria } from "@/types/supabase";
import { Revelar } from "@/components/ui/Revelar";

const FOTO_EDITORIAL: Record<Categoria, string> = {
  hoteles: "/images/editorial/escapada-caribe.png",
  paquetes: "/images/editorial/escapada-caribe.png",
  "guias-tours": "/images/editorial/tour-tropical.png",
  promociones: "/images/editorial/vuelo-a-tu-medida.png",
};

/** Fichas de categoría que montan sobre el borde inferior del Hero (-mt
 * negativo) -- ancla la transición foto-a-sangre -> contenido y elimina el
 * hueco muerto que dejaban los avatares circulares flotando en vacío
 * (auditoría redesign desktop 2026-08-22). Un solo árbol responsive: scroll
 * horizontal con snap en móvil, fila a ancho completo desde lg. */
export function CategoriaAvatares({ fotos }: { fotos: Record<string, string | null> }) {
  return (
    <div className="relative z-10 -mt-6 sm:-mt-8 lg:-mt-10">
      <div className="mx-auto max-w-[var(--ancho-contenido)] px-5">
        <div className="-mx-5 flex snap-x snap-proximity gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-4 lg:overflow-visible lg:px-5 lg:snap-none">
          {CATEGORIAS.map(({ slug, label }, i) => {
            const foto = fotos[slug] ?? FOTO_EDITORIAL[slug];
            return (
              <Revelar key={slug} retraso={i * 70} className="shrink-0 snap-start lg:flex-1">
                <Link
                  href={`/catalogo/${slug}`}
                  className="group relative block aspect-[4/3] w-[150px] overflow-hidden rounded-[var(--radius-media)] shadow-lift transition-transform hover:-translate-y-1 sm:w-[190px] lg:w-full"
                >
                  <Image
                    src={foto}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 22vw, (min-width: 640px) 190px, 150px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dusk/85 via-dusk/15 to-transparent" />
                  <span className="absolute inset-x-3 bottom-3 font-display text-base font-semibold text-white sm:text-lg">
                    {label}
                  </span>
                </Link>
              </Revelar>
            );
          })}
        </div>
      </div>
    </div>
  );
}
