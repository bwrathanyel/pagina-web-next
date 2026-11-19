import type { Metadata } from "next";
import { VistaCotizar, type Consulta } from "./_vista";

const DESCRIPCION =
  "Arme su viaje en un solo lugar: hospedaje, vuelo, full day y tours. Indique destino, fechas y viajeros, y un asesor le responde por WhatsApp con el precio confirmado.";

export const metadata: Metadata = {
  title: "Arme su viaje: cotice hospedaje, vuelo y tours en Venezuela",
  description: DESCRIPCION,
  alternates: { canonical: "/cotizar" },
  openGraph: { title: "Arme su viaje", description: DESCRIPCION, url: "/cotizar" },
};

export default async function CotizarPage({ searchParams }: { searchParams: Promise<Consulta> }) {
  return <VistaCotizar sp={await searchParams} />;
}
