import { CategoriaTabs } from "@/components/catalogo/CategoriaTabs";
import type { Categoria } from "@/types/supabase";

/** Header propio de Catálogo en mobile: título simple + tabs, sticky --
 * reemplaza al CatalogHeader grande (caja dusk redondeada) ahí, que sigue
 * viéndose en desktop. Cada pantalla del tab bar tiene su propio header en
 * el diseño mobile, no el pill de Home. Ver capturas reales 2026-07-23. */
export function CatalogoMobileHeader({ activa }: { activa: Categoria }) {
  return (
    <div className="sticky top-0 z-30 -mx-5 mb-6 bg-sand px-5 pb-3 pt-4 lg:hidden">
      <h1 className="mb-4 font-display text-3xl font-semibold text-ink">Catálogo</h1>
      <CategoriaTabs activa={activa} />
    </div>
  );
}
