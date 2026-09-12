import { resolverBioCotizador } from "@/lib/bio-cotizador";

// Enlace de bio de TikTok al cotizador IA. Crea el lead (canal 'Tiktok') y
// la sesión del asistente en el clic, y manda a la home con el chat abierto.
// Ver app/tiktok/whatsapp/route.ts para el hermano que va a WhatsApp.
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  return resolverBioCotizador(request, "tiktok");
}
