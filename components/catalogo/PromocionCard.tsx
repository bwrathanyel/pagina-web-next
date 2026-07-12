import { TicketCard } from "@/components/catalogo/TicketCard";
import { fotosDe } from "@/lib/supabase/fotos";
import type { Promocion } from "@/types/supabase";

export function PromocionCard({ promocion }: { promocion: Promocion }) {
  // Own photos first, hotel's photos as fallback, never invented — same
  // rule as the current site's fotosDe() priority.
  const fotoPropia = fotosDe(promocion.promocion_fotos)[0];
  const fotoHeredada = fotosDe(promocion.producto?.producto_fotos)[0];
  const foto = fotoPropia ?? fotoHeredada ?? null;

  return (
    <TicketCard
      href={promocion.producto ? `/producto/${promocion.producto.id}` : null}
      badge="Promoción"
      nombre={promocion.titulo}
      destino={promocion.producto?.destino ?? null}
      fotoUrl={foto}
      precioLabel={promocion.precio_texto ?? "Consultar disponibilidad"}
      precioMuted={!promocion.precio_texto}
    />
  );
}
