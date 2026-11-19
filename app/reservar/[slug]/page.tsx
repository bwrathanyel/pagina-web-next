import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { slugsDeHoteles } from "@/lib/checkout/datos";
import { VistaReservar, type Consulta } from "../_vista";

// URL limpia de la compra directa: /reservar/margarita-village. Fechas, viajeros, habitación y boleto
// viven en sessionStorage (borrador por hotel); un enlace viejo con query se sigue leyendo aquí también.
export const metadata: Metadata = {
  title: "Reservar y pagar",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ReservarHotelPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Consulta>;
}) {
  const [{ slug }, q] = await Promise.all([params, searchParams]);
  const productoId = (await slugsDeHoteles().catch(() => null))?.porSlug.get(decodeURIComponent(slug).toLowerCase());
  if (!productoId) notFound();
  return <VistaReservar productoId={productoId} q={q} />;
}
