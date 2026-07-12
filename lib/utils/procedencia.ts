export function detectarProcedencia(): string {
  if (typeof navigator === "undefined") return "No detectada";
  const ua = navigator.userAgent || "";
  if (ua.indexOf("Instagram") > -1 || ua.indexOf("FBAN") > -1 || ua.indexOf("FBAV") > -1)
    return "Instagram";
  if (ua.indexOf("FB") > -1) return "Facebook";
  if (document.referrer.indexOf("instagram.com") > -1) return "Instagram (Web)";
  if (document.referrer.indexOf("facebook.com") > -1) return "Facebook (Web)";
  return "Link Directo";
}

/** Instagram/Facebook's in-app browser strips emoji rendering reliably
 * enough that the current site sends a plain-text WhatsApp message
 * variant there instead of the emoji one. Same check, ported as-is. */
export function esInstagramInApp(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return ua.indexOf("Instagram") > -1 || ua.indexOf("FBAN") > -1 || ua.indexOf("FBAV") > -1;
}
