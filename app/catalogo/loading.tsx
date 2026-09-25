import { CatalogoGrid } from "@/components/catalogo/CatalogoGrid";
import { Esqueleto, EsqueletoTarjeta } from "@/components/ui/Esqueleto";

// Cubre /catalogo, /catalogo/[categoria] y /catalogo/hot-sales: título, fila de
// pestañas, contador con orden y la primera fila de la grilla.
export default function CargandoCatalogo() {
  return (
    <div role="status" className="mx-auto max-w-7xl px-5 py-4 md:py-14">
      <span className="sr-only">Cargando el catálogo…</span>
      <Esqueleto className="mb-4 h-9 w-40 lg:hidden" />
      <Esqueleto className="mb-7 hidden h-52 rounded-card lg:block" />
      <div className="mb-8 flex gap-2 overflow-hidden">
        {Array.from({ length: 4 }, (_, i) => (
          <Esqueleto key={i} className="h-11 w-28 shrink-0 rounded-control" />
        ))}
      </div>
      <div className="mb-5 flex items-center justify-between gap-4">
        <Esqueleto className="h-4 w-24" />
        <Esqueleto className="h-12 w-64 rounded-pill" />
      </div>
      <CatalogoGrid>
        {Array.from({ length: 4 }, (_, i) => (
          <EsqueletoTarjeta key={i} />
        ))}
      </CatalogoGrid>
    </div>
  );
}
