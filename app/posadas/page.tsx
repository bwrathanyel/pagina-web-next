import { PropuestaPosadas } from "@/components/posadas/PropuestaPosadas";

// Página comercial dirigida a las posadas y apartamentos con los que ya
// trabajamos: se les ofrece la misma atención automática que usamos nosotros.
//
// Fuera del menú y fuera del sitemap a propósito: llega quien recibe el link.
// No es secreta --el chat tiene que funcionar de verdad, así que vive en la web
// pública-- pero no queremos que un cliente de viajes se tope con una propuesta
// dirigida a proveedores.
export const metadata = {
  title: "Atención automática para tu posada | Destino y Eventos Lotus 360",
  description:
    "El 45% de tus clientes escribe cuando ya cerraste. Una asistente que responde a cualquier hora con tus fotos y tus precios, y te pasa el cliente listo por WhatsApp.",
  robots: { index: false, follow: false },
};

export default function PosadasPage() {
  return <PropuestaPosadas />;
}
