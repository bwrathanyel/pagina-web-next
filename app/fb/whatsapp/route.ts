import { resolverBioWhatsapp } from "@/lib/bio-whatsapp";

// Link fijo de WhatsApp en bio de Facebook. Rota a un asesor distinto en
// cada clic. Ver app/whatsapp/[codigo]/route.ts (contacto directo por
// conversación, con fila pendiente) para el patrón hermano.
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  return resolverBioWhatsapp(request, "facebook", {
    json: new URL(request.url).searchParams.get("json") === "1",
  });
}

