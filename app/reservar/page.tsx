import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { entero, VistaReservar, type Consulta } from "./_vista";

// Compra directa de hospedaje (Plan 1), fuera de buscadores. Se entra desde la ficha o el cotizador:
// /reservar?hotel=<id>&tarifa=<id>&desde=AAAA-MM-DD&hasta=AAAA-MM-DD&adultos=2&edades=5,8&bebes=1,
// más el vuelo pedido en el cotizador (origen, vuelo, vuelo_ida, vuelo_vuelta, equipaje, flex).
// Al montar, la barra de direcciones pasa a /reservar/<slug> (ver LimpiarUrl y [slug]/page.tsx).
export const metadata: Metadata = {
  title: "Reservar y pagar",
  robots: { index: false, follow: false },
};

// El hotel y el tarifario cambian a diario: nada de caché de página.
export const dynamic = "force-dynamic";

export default async function ReservarPage({ searchParams }: { searchParams: Promise<Consulta> }) {
  const q = await searchParams;
  const productoId = entero(q.hotel);
  if (!productoId) notFound();
  return <VistaReservar productoId={productoId} q={q} />;
}
