/** 2 columnas ya desde mobile (antes 1) -- duplica lo que se ve sin
 * scrollear en el catálogo (rediseño 2026-08-14). TicketCard achica su
 * botón principal a solo ícono por debajo de `sm` para tolerar el ancho
 * angosto de esa primera columna doble. */
export function CatalogoGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-7 lg:grid-cols-3">{children}</div>
  );
}
