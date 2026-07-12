export interface LeadSheetMonkey {
  destino: string;
  servicio: string;
  pagina: string;
  nombre: string;
  procedencia: string;
  telefono: string;
  asesor: string;
}

const SHEET_MONKEY_URL = "https://api.sheetmonkey.io/form/nLKvJpsMkGCFRwwwMMMX21";

/** Parallel report the business still uses today (confirmed with the
 * user 2026-07-11) — kept alongside the CRM ingest, not a replacement
 * for it. Fire-and-forget, same as the current site. */
export function enviarASheetMonkey(datos: LeadSheetMonkey): void {
  const formData = new FormData();
  formData.append("Nombres", datos.nombre || "No especificado");
  formData.append("Fecha", new Date().toLocaleString("es-VE"));
  formData.append("Destino", datos.destino);
  formData.append("Pagina", datos.pagina);
  formData.append("Servicio", datos.servicio);
  formData.append("Procedencia", datos.procedencia || "No detectada");
  formData.append("Telefono", datos.telefono || "No especificado");
  formData.append("Asesor", datos.asesor || "No asignado");
  fetch(SHEET_MONKEY_URL, { method: "POST", body: formData }).catch(() => {});
}
