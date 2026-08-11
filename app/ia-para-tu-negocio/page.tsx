import { PropuestaPosadas } from "@/components/posadas/PropuestaPosadas";

// Página comercial pública: le ofrecemos a cualquier negocio (posadas,
// restaurantes, tiendas, servicios...) la misma asistente automática que
// usamos nosotros para atender por WhatsApp/Instagram a cualquier hora.
export const metadata = {
  title: "Atención automática con IA para tu negocio | Destino y Eventos Lotus 360",
  description:
    "El 45% de tus clientes escribe cuando ya cerraste. Una asistente que responde a cualquier hora con tu info y tus precios, y te pasa el cliente listo por WhatsApp.",
};

export default function IaParaTuNegocioPage() {
  return <PropuestaPosadas />;
}
