import { notFound, redirect } from "next/navigation";
import { getPromocionPorId } from "@/lib/supabase/queries";

// Enlace viejo "Cotizar esta promoción": ahora todo cotiza en /cotizar, con el
// hotel y la tarifa ya elegidos.
export default async function CotizarPromocionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const promocion = await getPromocionPorId(Number(id));
  if (!promocion) notFound();
  redirect(promocion.producto ? `/cotizar?hotel=${promocion.producto.id}&tarifa=${promocion.id}` : "/cotizar");
}
