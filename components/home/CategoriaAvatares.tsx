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

/** Avatares circulares de acceso rápido a categorías -- versión compacta del
 * mockup ("category avatars"), distinta de CategoriasDestacadas (tiles
 * grandes, más abajo en la página). Mobile-first pero visible en todos los
 * tamaños, no aporta desorden en desktop. */
export function CategoriaAvatares({ fotos }: { fotos: Record<string, string | null> }) {
  return (
    <div className="mx-auto max-w-6xl px-5 pb-5 pt-4">
      <div className="-mx-5 flex snap-x snap-proximity gap-4 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CATEGORIAS.map(({ slug, label }, i) => {
          const foto = fotos[slug] ?? FOTO_EDITORIAL[slug];
          return (
            <Revelar key={slug} retraso={i * 70} className="shrink-0 snap-start">
              <Link href={`/catalogo/${slug}`} className="flex flex-col items-center gap-2 transition-transform active:scale-95">
                <span className="rounded-full bg-gradient-to-br from-coral to-gold p-[2.5px]">
                  <span className="block overflow-hidden rounded-full border-2 border-card">
                    <span className="relative block h-[60px] w-[60px]">
                      <Image src={foto} alt="" fill sizes="60px" className="object-cover" />
                    </span>
                  </span>
                </span>
                <span className="max-w-[72px] text-center text-xs font-semibold leading-tight text-ink">{label}</span>
              </Link>
            </Revelar>
          );
        })}
      </div>
    </div>
  );
}
