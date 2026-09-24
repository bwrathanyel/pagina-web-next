import { Hero } from "@/components/home/Hero";
import { HotSalesSection } from "@/components/home/HotSalesSection";
import { promosHotSales } from "@/lib/promociones/hotSales";
import { fotosHeroDeHotSales } from "@/lib/promociones/fotosHero";
import { AcompanamientoSection } from "@/components/home/AcompanamientoSection";
import { MasDeLotus } from "@/components/home/MasDeLotus";
import { fotosDe } from "@/lib/supabase/fotos";
import { getProductosPorCategoria, getPromociones } from "@/lib/supabase/queries";

export default async function Home() {
  // Si Supabase falla acá, mejor una home con menos fotos que una home
  // rota entera — [] es un fallback seguro para todo lo que sigue.
  const [hoteles, promociones] = await Promise.all([
    getProductosPorCategoria("hoteles").catch(() => []),
    getPromociones().catch(() => []),
  ]);

  const hotSales = promosHotSales(promociones);

  // Fotos del hero: salen de las Hot Sales vigentes y van rotando (pedido del
  // dueño, 2026-07-26), cada una con su promo como "pase destacado". El
  // filtrado (descartar flyers, referenciales y fotos chicas) y el armado del
  // pase viven en fotosHeroDeHotSales.
  const heroFotos = fotosHeroDeHotSales(hotSales);

  // Respaldo si todavía no hay Hot Sales con foto propia -- la portada nunca
  // se queda sin imagen (sin pase: no hay promo detrás).
  const heroFallback = [hoteles[0], hoteles[1], hoteles[2]]
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .map((p) => ({ url: fotosDe(p.producto_fotos)[0], alt: p.nombre, destino: p.destino }))
    .filter((f) => f.url);

  // Orden (comp B aprobado, 2026-09-24): Hot Sales asoma bajo el hero, con el
  // precio a la vista; la vitrina de 4 ofertas y la afordancia de búsqueda
  // salieron: el pase destacado y el cotizador rápido hacen ese trabajo.
  return (
    <main>
      <Hero fotos={heroFotos.length > 0 ? heroFotos : heroFallback} />

      <HotSalesSection pool={hotSales} />

      <AcompanamientoSection />

      <MasDeLotus />
    </main>
  );
}
