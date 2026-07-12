import Image from "next/image";
import Link from "next/link";
import { CATEGORIAS } from "@/types/supabase";

export function CategoriasDestacadas({ fotos }: { fotos: Record<string, string | null> }) {
  return (
    <section className="mx-auto max-w-6xl px-5 py-14">
      <h2 className="mb-6 font-display text-2xl font-semibold text-ink">Explora el catálogo</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {CATEGORIAS.map(({ slug, label }) => {
          const foto = fotos[slug];
          return (
            <Link
              key={slug}
              href={`/catalogo/${slug}`}
              className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-sand-2"
            >
              {foto ? (
                <Image
                  src={foto}
                  alt={label}
                  fill
                  sizes="(min-width: 768px) 25vw, 50vw"
                  className="object-cover transition-transform group-hover:scale-105"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-dusk/80 via-dusk/0 to-dusk/0" />
              <span className="absolute bottom-3 left-3 font-display text-lg font-semibold text-dusk-text">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
