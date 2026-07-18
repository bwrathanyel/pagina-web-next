export interface LeadCRM {
  nombre: string;
  telefono: string;
  destino: string;
  personas: string;
  consulta: string;
}

export interface RespuestaLeadCRM {
  ok: boolean;
  lead_id?: number;
  asesor?: string | null;
  asesor_whatsapp?: string | null;
  error?: string;
}

export async function crearLeadCRM(datos: LeadCRM): Promise<RespuestaLeadCRM> {
  const response = await fetch("/api/lead", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
  const resultado = (await response.json().catch(() => null)) as RespuestaLeadCRM | null;
  if (!response.ok || !resultado?.ok) {
    throw new Error(resultado?.error ?? "No se pudo registrar la solicitud.");
  }
  return resultado;
}

/** Fire-and-forget, same as the current site: a failed CRM ingest must
 * never block the WhatsApp handoff, which is the part that actually
 * gets the visitor to an advisor. */
export function enviarACRM(datos: LeadCRM): void {
  if (!datos.telefono) return;
  crearLeadCRM(datos).catch(() => {});
}
