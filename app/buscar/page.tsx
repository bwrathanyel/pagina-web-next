import { BuscarClient } from "@/components/catalogo/BuscarClient";
import { getProductosPorCategoria, getPromociones } from "@/lib/supabase/queries";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Buscar" };

export default async function BuscarPage() {
  const [hoteles, paquetes, guiasTours, promociones] = await Promise.all([
    getProductosPorCategoria("hoteles").catch(() => []),
    getProductosPorCategoria("paquetes").catch(() => []),
    getProductosPorCategoria("guias-tours").catch(() => []),
    getPromociones().catch(() => []),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 md:py-14">
      <BuscarClient productos={[...hoteles, ...paquetes, ...guiasTours]} promociones={promociones} />
    </main>
  );
}
