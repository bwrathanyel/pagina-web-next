import { Hero } from "@/components/home/Hero";
import { CategoriaAvatares } from "@/components/home/CategoriaAvatares";
import { BuscarAfordancia } from "@/components/home/BuscarAfordancia";
import { HotSalesSection } from "@/components/home/HotSalesSection";
import { promosHotSales } from "@/lib/promociones/hotSales";
import { fotosHeroDeHotSales } from "@/lib/promociones/fotosHero";
import { PlanesCorporativos } from "@/components/home/PlanesCorporativos";
import { AcompanamientoSection } from "@/components/home/AcompanamientoSection";
import { TrabajaConNosotrosBanner } from "@/components/home/TrabajaConNosotrosBanner";
import { fotosDe } from "@/lib/supabase/fotos";
import { getProductosPorCategoria, getPromociones } from "@/lib/supabase/queries";
import type { Categoria } from "@/types/supabase";

export default async function Home() {
  // Si Supabase falla acá, mejor una home con menos fotos que una home
  // rota entera — [] es un fallback seguro para todo lo que sigue.
  const [hoteles, paquetes, guiasTours, promociones] = await Promise.all([
    getProductosPorCategoria("hoteles").catch(() => []),
    getProductosPorCategoria("paquetes").catch(() => []),
    getProductosPorCategoria("guias-tours").catch(() => []),
    getPromociones().catch(() => []),
  ]);

  const hotSales = promosHotSales(promociones);

  // Fotos del hero: salen de las Hot Sales vigentes y van rotando (pedido del
  // dueño, 2026-07-26) -- así la portada muestra lo que de verdad se está
  // vendiendo ahora, en vez de la misma imagen fija siempre. El filtrado
  // (descartar flyers, referenciales y fotos chicas) vive en fotosHeroDeHotSales.
  const heroFotos = fotosHeroDeHotSales(hotSales);

  // Respaldo si todavía no hay Hot Sales con foto propia -- la portada nunca
  // se queda sin imagen.
  const heroFallback = [hoteles[0], hoteles[1], hoteles[2]]
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
      <Hero fotos={heroFotos.length > 0 ? heroFotos : heroFallback} />

      <CategoriaAvatares fotos={fotosPorCategoria} />

      <BuscarAfordancia productos={[...hoteles, ...paquetes, ...guiasTours]} promociones={promociones} />

      <HotSalesSection pool={hotSales} />

      <AcompanamientoSection />

      <TrabajaConNosotrosBanner />

      <PlanesCorporativos />
    </main>
  );
}
