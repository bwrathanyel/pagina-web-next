import { resolverContactoDirecto } from "@/lib/contacto-directo";

// Redirección medida al WhatsApp de un asesor. Ver lib/contacto-directo.ts.
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  ctx: { params: Promise<{ codigo: string }> },
): Promise<Response> {
  const { codigo } = await ctx.params;
  return resolverContactoDirecto(request, codigo);
}
