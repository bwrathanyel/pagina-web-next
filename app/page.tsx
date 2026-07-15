import { Hero } from "@/components/home/Hero";
import { ServiciosGrid } from "@/components/home/ServiciosGrid";
import { PromocionesDestacadas } from "@/components/home/PromocionesDestacadas";
import { CategoriasDestacadas } from "@/components/home/CategoriasDestacadas";
import { PlanesCorporativos } from "@/components/home/PlanesCorporativos";
import { fotosDe } from "@/lib/supabase/fotos";
import { getProductosPorCategoria, getPromociones } from "@/lib/supabase/queries";
import type { Categoria } from "@/types/supabase";

export const revalidate = 300;

export default async function Home() {
  // Si Supabase falla acá, mejor una home con menos fotos que una home
  // rota entera — [] es un fallback seguro para todo lo que sigue.
  const [hoteles, promociones] = await Promise.all([
    getProductosPorCategoria("hoteles").catch(() => []),
    getPromociones().catch(() => []),
  ]);

  const heroFotos = [hoteles[0], hoteles[1], hoteles[2]]
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .map((p) => ({ url: fotosDe(p.producto_fotos)[0], alt: p.nombre }))
    .filter((f) => f.url);

  const fotosPorCategoria: Record<Categoria, string | null> = {
    hoteles: fotosDe(hoteles[0]?.producto_fotos)[0] ?? null,
    paquetes: null,
    "guias-tours": null,
    promociones: fotosDe(promociones[0]?.promocion_fotos)[0] ?? null,
  };

  return (
    <>
      <Hero fotos={heroFotos} />

      <section className="mx-auto max-w-6xl px-5 py-16 md:py-24">
        <ServiciosGrid />
      </section>

      <section className="bg-coral px-5 py-12 text-white">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[1.3fr_1fr] md:items-center">
          <h2 className="max-w-[18ch] text-balance font-display text-3xl font-semibold leading-tight md:text-5xl">
            Viajar bien comienza con sentirte acompañado.
          </h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              ["Asesoría", "humana"],
              ["Atención", "personalizada"],
              ["Destinos", "sin fronteras"],
            ].map(([titulo, detalle]) => (
              <div key={titulo} className="border-l border-white/25 px-2 first:border-l-0">
                <p className="font-display text-lg font-semibold md:text-2xl">{titulo}</p>
                <p className="mt-1 text-xs text-white/75 md:text-sm">{detalle}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PromocionesDestacadas promociones={promociones} />

      <CategoriasDestacadas fotos={fotosPorCategoria} />

      <PlanesCorporativos />
    </>
  );
}
