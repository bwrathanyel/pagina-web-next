import { Esqueleto, EsqueletoTarjeta } from "@/components/ui/Esqueleto";

// Respaldo genérico mientras llega una ruta sin loading propio: título y una
// grilla de tarjetas con la proporción real, para que nada salte al llegar.
export default function Cargando() {
  return (
    <div role="status" className="px-5 py-8 md:py-16">
      <span className="sr-only">Cargando…</span>
      <div className="mx-auto max-w-[var(--ancho-contenido)]">
        <Esqueleto className="h-10 w-2/3 max-w-md md:h-14" />
        <Esqueleto className="mt-4 h-5 w-1/2 max-w-sm" />
        <div className="mt-8 grid grid-cols-2 gap-3 md:mt-12 md:gap-6 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <EsqueletoTarjeta key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
