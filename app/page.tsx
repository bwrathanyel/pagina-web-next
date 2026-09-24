import { Hero } from "@/components/home/Hero";
import { HotSalesSection } from "@/components/home/HotSalesSection";
import { DestinosRail } from "@/components/home/DestinosRail";
import { destinosConOfertas, ordenDelDia, soloDestinosHome } from "@/lib/promociones/hotSales";
import { fotosHeroDeHotSales } from "@/lib/promociones/fotosHero";
import { ninosGratisEn } from "@/lib/promociones/ninosGratis";
import { NinosGratisBanda } from "@/components/home/NinosGratisBanda";
import { AcompanamientoSection } from "@/components/home/AcompanamientoSection";
import { MasDeLotus } from "@/components/home/MasDeLotus";
import { fotosDe } from "@/lib/supabase/fotos";
import { getHotSales, getProductosPorCategoria } from "@/lib/supabase/queries";

export default async function Home() {
  // Si Supabase falla acá, mejor una home con menos fotos que una home
  // rota entera — [] es un fallback seguro para todo lo que sigue.
  const [hoteles, hotSales] = await Promise.all([
    getProductosPorCategoria("hoteles").catch(() => []),
    getHotSales().catch(() => []),
  ]);

  // Fotos del hero: un destino por cada uno con Hot Sales vigentes, rotando
  // (pedido del dueño, 2026-07-26), con la foto del lugar (2026-09-24) y su
  // mejor promo como "pase destacado". La curaduría de fotos por destino, el
  // respaldo a la foto del hotel y el armado del pase viven en fotosHeroDeHotSales.
  // Hero, banda, Hot Sales y destinos leen solo los 5 destinos de la home
  // (pedido del dueño, 2026-09-24); /catalogo/hot-sales conserva el resto.
  const deLaHome = soloDestinosHome(hotSales);
  const heroFotos = fotosHeroDeHotSales(deLaHome);

  // Respaldo si todavía no hay Hot Sales con foto propia -- la portada nunca
  // se queda sin imagen (sin pase: no hay promo detrás).
  const heroFallback = [hoteles[0], hoteles[1], hoteles[2]]
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .map((p) => ({ url: fotosDe(p.producto_fotos)[0], alt: p.nombre, destino: p.destino }))
    .filter((f) => f.url);

  // Orden (comp B aprobado, 2026-09-24): Hot Sales asoma bajo el hero, con el
  // precio a la vista, y Destinos va después (el plan los ponía al revés); la
  // vitrina de 4 ofertas y la afordancia de búsqueda salieron: el pase
  // destacado y el cotizador rápido hacen ese trabajo. El hero y los destinos
  // leen el pool por ranking; solo la grilla rota con el orden del día.
  return (
    <main>
      <Hero fotos={heroFotos.length > 0 ? heroFotos : heroFallback} />

      {/* Opción C aprobada (2026-09-24): la banda de niños gratis abre las
          ofertas; sin regalos vigentes no se monta y Hot Sales sube. */}
      <NinosGratisBanda bloque={ninosGratisEn(deLaHome, "Margarita")} />

      <HotSalesSection pool={ordenDelDia(deLaHome)} />

      <DestinosRail destinos={destinosConOfertas(deLaHome)} />

      <AcompanamientoSection />

      <MasDeLotus />
    </main>
  );
}
