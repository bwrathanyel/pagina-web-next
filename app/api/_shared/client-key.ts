export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  // cf-connecting-ip primero: Cloudflare lo fija y el cliente no puede falsearlo. x-nf-client-connection-ip
  // (Netlify) llega tal cual lo mande el visitante, así que solo vale como respaldo si no hay cabecera de Cloudflare.
  const key = request.headers.get("cf-connecting-ip")
    ?? request.headers.get("x-nf-client-connection-ip")
    ?? forwarded
    ?? "";
  return /^[0-9a-fA-F:.]{3,160}$/.test(key) ? key : "";
}
