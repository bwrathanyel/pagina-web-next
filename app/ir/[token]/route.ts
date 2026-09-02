import { resolverContactoDirecto } from "@/lib/contacto-directo";

// Legacy: links /ir/<uuid> ya entregados (TTL 48h). El link nuevo que la IA
// manda hoy es /whatsapp/<codigo> — ver app/whatsapp/[codigo]/route.ts.
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  ctx: { params: Promise<{ token: string }> },
): Promise<Response> {
  const { token } = await ctx.params;
  return resolverContactoDirecto(request, token);
}
