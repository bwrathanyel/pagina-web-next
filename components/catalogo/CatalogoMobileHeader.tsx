import { CategoriaTabs } from "@/components/catalogo/CategoriaTabs";
import type { Categoria } from "@/types/supabase";

/** Título y pestañas de categoría del catálogo en móvil. Ya no lleva header
 * propio: la barra superior del sitio (Navbar) sale en todas las rutas y la
 * caja sticky que había acá pelearía con ella por el mismo `top-0`. Las
 * pestañas no se pegan: la barra del móvil se oculta por inactividad y una
 * fila fija debajo quedaría flotando (pendiente de compartir su estado). */
export function CatalogoMobileHeader({ activa }: { activa: Categoria }) {
  return (
    <div className="mb-6 lg:hidden">
      <h1 className="mb-4 font-display text-3xl font-bold text-ink">Catálogo</h1>
      <CategoriaTabs activa={activa} />
    </div>
  );
}
