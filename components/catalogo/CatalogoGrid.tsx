/** Grilla del catálogo (etapa 3 del plan, 2026-09-25): reemplaza al carrusel
 * horizontal del 2026-08-22. Dos columnas en el teléfono, el mismo ancho que
 * tenía cada tarjeta en el carrusel (46%), así TicketCard no cambia de forma;
 * sus filas de alto fijo dejan las columnas alineadas. */
export function CatalogoGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-6 sm:gap-y-8 md:grid-cols-3 xl:grid-cols-4">
      {children}
    </div>
  );
}
