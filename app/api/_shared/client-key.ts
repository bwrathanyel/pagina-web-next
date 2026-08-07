export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const key = request.headers.get("x-nf-client-connection-ip")
    ?? request.headers.get("cf-connecting-ip")
    ?? forwarded
    ?? "";
  return /^[0-9a-fA-F:.]{3,160}$/.test(key) ? key : "";
}
