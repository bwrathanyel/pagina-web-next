import { resolverBioWhatsapp, resolverBioWhatsappForm } from "@/lib/bio-whatsapp";

// Link fijo de WhatsApp en bio de Instagram. Rota a un asesor distinto en
// cada clic. Ver app/whatsapp/[codigo]/route.ts (contacto directo por
// conversación, con fila pendiente) para el patrón hermano.
export const dynamic = "force-dynamic";

// GET: fallback <noscript> del botón de PaginaEnlaces (o cualquier visita
// sin JS) -- sigue redirigiendo de una, sin pedir nada. No se toca.
export async function GET(request: Request): Promise<Response> {
  return resolverBioWhatsapp(request, "instagram");
}

// POST: lo llama el modal de la página puente después de pedir nombre y
// destino. Devuelve JSON, no un 302 -- quien redirige es el cliente.
export async function POST(request: Request): Promise<Response> {
  const body = await request.json().catch(() => null) as { nombre?: string; destino?: string } | null;
  const nombre = String(body?.nombre ?? "").trim();
  const destino = String(body?.destino ?? "").trim();
  if (!nombre || !destino) {
    return Response.json({ ok: false, motivo: "faltan_datos" }, { status: 400 });
  }
  return resolverBioWhatsappForm(request, "instagram", { nombre, destino });
}
