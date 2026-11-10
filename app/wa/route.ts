import { whatsappDesdeRedes } from "@/lib/whatsapp-empresa";

// Link que el bot pone en los DM de Instagram/Facebook para pasar al WhatsApp
// de la empresa: /wa?o=ig o /wa?o=fb (el origen va en el prefill), con
// &c=<codigo> cuando viene del seguimiento (puente con la sesión del DM).
export function GET(request: Request): Response {
  const params = new URL(request.url).searchParams;
  return whatsappDesdeRedes(request.headers.get("user-agent") ?? "", params.get("o"), params.get("c"));
}
