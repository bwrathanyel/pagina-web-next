import { Hero } from "@/components/home/Hero";
import { VitrinaOfertas } from "@/components/home/VitrinaOfertas";
import { BuscarAfordancia } from "@/components/home/BuscarAfordancia";
import { HotSalesSection } from "@/components/home/HotSalesSection";
import { promosHotSales, ofertasVitrina } from "@/lib/promociones/hotSales";
import { fotosHeroDeHotSales } from "@/lib/promociones/fotosHero";
import { AcompanamientoSection } from "@/components/home/AcompanamientoSection";
import { MasDeLotus } from "@/components/home/MasDeLotus";
import { fotosDe } from "@/lib/supabase/fotos";
import { getProductosPorCategoria, getPromociones } from "@/lib/supabase/queries";

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

  // Las 4 de la vitrina salen del mismo pool que la seccion Hot Sales, asi que
  // hay que sacarlas de ahi: si no, la misma promo aparece dos veces en la
  // misma pantalla, separada por 300px.
  const ofertas = ofertasVitrina(hotSales);
  const idsVitrina = new Set(ofertas.map((p) => p.id));
  const hotSalesRestantes = hotSales.filter((p) => !idsVitrina.has(p.id));

  return (
    <main>
      <Hero fotos={heroFotos.length > 0 ? heroFotos : heroFallback} />

      <VitrinaOfertas ofertas={ofertas} />

      <BuscarAfordancia productos={[...hoteles, ...paquetes, ...guiasTours]} promociones={promociones} />

      <HotSalesSection pool={hotSalesRestantes} />

      <AcompanamientoSection />

      <MasDeLotus />
    </main>
  );
}
