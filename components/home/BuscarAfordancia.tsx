import { BuscarClient } from "@/components/catalogo/BuscarClient";
import type { Producto, Promocion } from "@/types/supabase";

export function BuscarAfordancia({ productos, promociones }: { productos: Producto[]; promociones: Promocion[] }) {
  return (
    <div className="px-5 pb-4 lg:hidden">
      <BuscarClient productos={productos} promociones={promociones} autoFocus={false} compacto />
    </div>
  );
}
