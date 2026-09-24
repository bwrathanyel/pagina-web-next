import { Esqueleto, EsqueletoTarjeta } from "@/components/ui/Esqueleto";

// Cubre /catalogo, /catalogo/[categoria] y /catalogo/hot-sales: título, fila de
// pestañas y una fila de tarjetas con el ancho real del carrusel.
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
      <Esqueleto className="mb-5 h-8 w-48" />
      <div className="flex gap-3 overflow-hidden sm:gap-6">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="w-[46%] max-w-[330px] shrink-0">
            <EsqueletoTarjeta />
          </div>
        ))}
      </div>
    </div>
  );
}
