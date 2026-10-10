import { whatsappDesdeRedes } from "@/lib/whatsapp-empresa";

// Link que el bot pone en los DM de Instagram/Facebook para pasar al WhatsApp
// de la empresa: /wa?o=ig o /wa?o=fb (el origen va en el prefill).
export function GET(request: Request): Response {
  const origen = new URL(request.url).searchParams.get("o");
  return whatsappDesdeRedes(request.headers.get("user-agent") ?? "", origen);
}
