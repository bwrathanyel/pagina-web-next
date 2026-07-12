import { Hero } from "@/components/home/Hero";
import { ServiciosGrid } from "@/components/home/ServiciosGrid";
import { CategoriasDestacadas } from "@/components/home/CategoriasDestacadas";
import { PlanesCorporativos } from "@/components/home/PlanesCorporativos";
import { fotosDe } from "@/lib/supabase/fotos";
import { getProductosPorCategoria, getPromociones } from "@/lib/supabase/queries";
import type { Categoria } from "@/types/supabase";

export const revalidate = 300;

export default async function Home() {
  const [hoteles, promociones] = await Promise.all([
    getProductosPorCategoria("hoteles"),
    getPromociones(),
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

      <section className="mx-auto -mt-6 max-w-6xl px-5 md:-mt-10">
        <ServiciosGrid />
      </section>

      <CategoriasDestacadas fotos={fotosPorCategoria} />

      <PlanesCorporativos />
    </>
  );
}
