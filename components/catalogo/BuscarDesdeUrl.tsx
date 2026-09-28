"use client";

import { useSearchParams } from "next/navigation";
import { BuscarClient } from "@/components/catalogo/BuscarClient";
import type { HotSale, Producto, Promocion } from "@/types/supabase";

/** /buscar sigue siendo una página estática: la consulta (?q=, la que manda el
 * buscador global) se lee acá, en el cliente. Va dentro de <Suspense>. El `key`
 * reinicia el campo si el buscador global lanza otra consulta estando ya en
 * /buscar. */
export function BuscarDesdeUrl({
  productos,
  promociones,
  hotSales,
}: {
  productos: Producto[];
  promociones: Promocion[];
  hotSales: HotSale[];
}) {
  const q = useSearchParams().get("q") ?? "";
  return <BuscarClient key={q} productos={productos} promociones={promociones} hotSales={hotSales} consultaInicial={q} />;
}
