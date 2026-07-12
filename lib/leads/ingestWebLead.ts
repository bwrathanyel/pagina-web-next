export interface LeadCRM {
  nombre: string;
  telefono: string;
  destino: string;
  personas: string;
  consulta: string;
}

/** Fire-and-forget, same as the current site: a failed CRM ingest must
 * never block the WhatsApp handoff, which is the part that actually
 * gets the visitor to an advisor. */
export function enviarACRM(datos: LeadCRM): void {
  if (!datos.telefono) return;
  fetch("/api/lead", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  }).catch(() => {});
}
