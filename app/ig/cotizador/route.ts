import { resolverBioCotizador } from "@/lib/bio-cotizador";

// Enlace de bio de Instagram al cotizador IA. Ver app/tiktok/cotizador/route.ts.
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  return resolverBioCotizador(request, "instagram");
}
