import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CotizacionOpcionForm } from "@/components/cotizador/CotizacionOpcionForm";
import { fotosDe } from "@/lib/supabase/fotos";
import { getProductoPorId } from "@/lib/supabase/queries";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const producto = await getProductoPorId(Number(id));
  if (!producto) return {};
  return {
    title: `Cotizar ${producto.nombre}`,
    description: `Solicita disponibilidad y tarifa para ${producto.nombre}.`,
  };
}

export default async function CotizarProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const producto = await getProductoPorId(Number(id));
  if (!producto) notFound();
  const tarifa = producto.tarifas.find((item) => item.vigente);

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 md:py-14">
      <CotizacionOpcionForm
        opcion={{
          clase: "producto",
          id: producto.id,
          nombre: producto.nombre,
          destino: producto.destino,
          precio: tarifa?.precio_texto ?? "Consultar disponibilidad",
          precioUnitarioUsd: tarifa?.precio_desde_usd ?? null,
          calculoPrecio: tarifa?.precio_desde_usd != null && /por persona por noche/i.test(tarifa.precio_texto) ? "persona_noche" : null,
          ninosGratis: 0,
          vigenciaTexto: tarifa?.vigencia_texto ?? null,
          vigenciaFin: null,
          foto: fotosDe(producto.producto_fotos)[0] ?? null,
          esHotel: producto.tipo === "hotel",
          volverHref: `/producto/${producto.id}`,
        }}
      />
    </main>
  );
}
