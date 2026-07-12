import { TicketCard } from "@/components/catalogo/TicketCard";
import { fotosDe } from "@/lib/supabase/fotos";
import type { Producto } from "@/types/supabase";

export const BADGE_POR_TIPO: Record<Producto["tipo"], string> = {
  hotel: "Hotel",
  paquete: "Paquete",
  destino: "Guía / Tour",
  info: "Info",
};

export function ProductoCard({ producto }: { producto: Producto }) {
  const foto = fotosDe(producto.producto_fotos)[0] ?? null;
  const tarifaVigente = producto.tarifas.find((t) => t.vigente);

  return (
    <TicketCard
      href={`/producto/${producto.id}`}
      badge={BADGE_POR_TIPO[producto.tipo]}
      nombre={producto.nombre}
      destino={producto.destino}
      fotoUrl={foto}
      precioLabel={tarifaVigente?.precio_texto ?? "Consultar disponibilidad"}
      precioMuted={!tarifaVigente}
    />
  );
}
