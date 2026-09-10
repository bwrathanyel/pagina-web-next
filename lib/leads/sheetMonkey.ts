export interface LeadSheetMonkey {
  destino: string;
  servicio: string;
  pagina: string;
  nombre: string;
  procedencia: string;
  telefono: string;
  asesor: string;
}

/** Parallel report the business still uses today (confirmed with the
 * user 2026-07-11) — kept alongside the CRM ingest, not a replacement
 * for it. Fire-and-forget, same as the current site.
 *
 * The Sheet Monkey form URL used to be hardcoded here and shipped in the
 * client bundle, so anyone could scrape it and spam the sheet. Now the
 * browser only ever hits our own same-origin route, which holds the URL
 * server-side (SHEET_MONKEY_URL) and forwards the report. */
export function enviarASheetMonkey(datos: LeadSheetMonkey): void {
  fetch("/api/lead-reporte", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  }).catch(() => {});
}
