import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { slugsDeHoteles } from "@/lib/checkout/datos";
import { VistaCotizar, type Consulta } from "../_vista";

// URL limpia del cotizador con un hotel elegido: /cotizar/hesperia-isla-margarita. Fechas, viajeros y
// servicios siguen en la query; `?hotel=` ya no hace falta (el slug lo fija).
export const metadata: Metadata = {
  title: "Arme su viaje: cotice hospedaje, vuelo y tours en Venezuela",
  alternates: { canonical: "/cotizar" },
};

export default async function CotizarHotelPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Consulta>;
}) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const slugs = await slugsDeHoteles().catch(() => null);
  const hotelId = slugs?.porSlug.get(decodeURIComponent(slug).toLowerCase());
  if (!hotelId) notFound();
  return <VistaCotizar sp={sp} hotelId={hotelId} slugs={slugs} />;
}
