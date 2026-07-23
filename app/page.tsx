import { Hero } from "@/components/home/Hero";
import { CategoriaAvatares } from "@/components/home/CategoriaAvatares";
import { BuscarAfordancia } from "@/components/home/BuscarAfordancia";
import { ServiciosGrid } from "@/components/home/ServiciosGrid";
import { HotSalesSection } from "@/components/home/HotSalesSection";
import { promosHotSales } from "@/lib/promociones/hotSales";
import { CategoriasDestacadas } from "@/components/home/CategoriasDestacadas";
import { PlanesCorporativos } from "@/components/home/PlanesCorporativos";
import { ComoFunciona } from "@/components/home/ComoFunciona";
import { AcompanamientoSection } from "@/components/home/AcompanamientoSection";
import { fotosDe } from "@/lib/supabase/fotos";
import { getProductosPorCategoria, getPromociones } from "@/lib/supabase/queries";
import type { Categoria } from "@/types/supabase";

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
    <main>
      <Hero fotos={heroFotos} />

      <CategoriaAvatares fotos={fotosPorCategoria} />

      <BuscarAfordancia />

      <HotSalesSection pool={promosHotSales(promociones)} />

      <AcompanamientoSection />

      <section className="mx-auto max-w-6xl px-5 py-16 md:py-24">
        <ServiciosGrid fotoHotel={fotosDe(hoteles[0]?.producto_fotos)[0] ?? null} />
      </section>

      <CategoriasDestacadas fotos={fotosPorCategoria} />

      <ComoFunciona />

      <PlanesCorporativos />
    </main>
  );
}
