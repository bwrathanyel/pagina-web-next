const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verificarTurnstile(token: unknown, request: Request): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET;
  const respuesta = typeof token === "string" ? token.trim() : "";
  if (!secret || !respuesta || respuesta.length > 4096) return false;
  const ip = request.headers.get("x-nf-client-connection-ip")
    ?? request.headers.get("cf-connecting-ip")
    ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const cuerpo = new URLSearchParams({ secret, response: respuesta });
  if (ip) cuerpo.set("remoteip", ip);
  try {
    const res = await fetch(VERIFY_URL, { method: "POST", body: cuerpo, signal: AbortSignal.timeout(8_000) });
    const data = await res.json().catch(() => null) as { success?: boolean; hostname?: string } | null;
    return Boolean(res.ok && data?.success && data.hostname === "destinoyeventoslotus360.com");
  } catch {
    return false;
  }
}
