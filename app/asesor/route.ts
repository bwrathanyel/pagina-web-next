import { resolverBioWhatsapp } from "@/lib/bio-whatsapp";

// Desvío desde el WhatsApp Business de la jefa: el mensaje de bienvenida/
// ausencia manda al cliente acá (destinoyeventoslotus360.com/asesor) en vez
// de dejarlo esperando en su número personal. Mismo motor que /ig|fb|tiktok/
// whatsapp (cookie de 180 días, reparto con turno/pausa/ráfaga/cliente-que-
// vuelve) -- acá el canal es "whatsapp" y el origen siempre "jefa".
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  return resolverBioWhatsapp(request, "whatsapp");
}
