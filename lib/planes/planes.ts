import type { Riel } from "@/lib/checkout/calculo";
import { supabaseBrowser } from "@/lib/supabase/client";

// Mis planes de pago (plan de abonos). Todo pasa por RLS y por las RPCs: reserva_planes solo
// devuelve los planes del usuario y plan_emitir_pago solo acepta al dueño. plan_estado además deja
// leer al staff (admin, administrativo, asesor del lead): por eso `propio` decide si se puede pagar.

export type EstadoPlan = "al_dia" | "por_vencer" | "atrasado" | "en_mora" | "completado" | "cancelado" | "credito";
export type EstadoCuota = "pagada" | "proxima" | "pendiente" | "vencida";

export interface CuotaEstado {
  n: number;
  porcentaje: number;
  monto_usd: number;
  cubierto_usd: number;
  vence_el: string;
  extendida: boolean;
  estado: EstadoCuota;
}

export interface PlanEstado {
  plan_id: number;
  /** El plan es del usuario logueado (solo el dueño puede pagarlo). */
  propio: boolean;
  reserva_codigo: string | null;
  viaje_inicio: string | null;
  estado: EstadoPlan;
  total_usd: number;
  pagado_usd: number;
  saldo_usd: number;
  gracia_dias: number;
  proxima: { n: number; monto_usd: number; vence_el: string; dias: number; limite_gracia: string } | null;
  cuotas: CuotaEstado[];
}

/** Estados guardados en reserva_planes que siguen abiertos. */
export const PLAN_ABIERTO = ["activo", "en_mora"] as const;
/** Estados derivados (plan_estado) que ya no admiten pagos. */
export const PLAN_CERRADO: readonly EstadoPlan[] = ["completado", "cancelado", "credito"];
export const esAbierto = (p: PlanEstado) => !PLAN_CERRADO.includes(p.estado);

export const TEXTO_ESTADO: Record<EstadoPlan, { texto: string; tono: "acento" | "ambar" | "seafoam" | "neutro" | "dusk" }> = {
  al_dia: { texto: "Al día", tono: "seafoam" },
  por_vencer: { texto: "Cuota por vencer", tono: "ambar" },
  atrasado: { texto: "Cuota vencida", tono: "acento" },
  en_mora: { texto: "En mora", tono: "acento" },
  completado: { texto: "Pagado", tono: "seafoam" },
  cancelado: { texto: "Cancelado", tono: "neutro" },
  credito: { texto: "Crédito a favor", tono: "dusk" },
};

const num = (v: unknown) => (typeof v === "number" ? v : Number(v ?? 0));

function normalizar(e: Record<string, unknown>, propio: boolean): PlanEstado {
  const prox = e.proxima as Record<string, unknown> | null;
  return {
    plan_id: num(e.plan_id),
    propio,
    reserva_codigo: (e.reserva_codigo as string) ?? null,
    viaje_inicio: (e.viaje_inicio as string) ?? null,
    estado: e.estado as EstadoPlan,
    total_usd: num(e.total_usd),
    pagado_usd: num(e.pagado_usd),
    saldo_usd: num(e.saldo_usd),
    gracia_dias: num(e.gracia_dias),
    proxima: prox
      ? { n: num(prox.n), monto_usd: num(prox.monto_usd), vence_el: String(prox.vence_el), dias: num(prox.dias), limite_gracia: String(prox.limite_gracia) }
      : null,
    cuotas: ((e.cuotas as Record<string, unknown>[]) ?? []).map((c) => ({
      n: num(c.n),
      porcentaje: num(c.porcentaje),
      monto_usd: num(c.monto_usd),
      cubierto_usd: num(c.cubierto_usd),
      vence_el: String(c.vence_el),
      extendida: c.extendida === true,
      estado: c.estado as EstadoCuota,
    })),
  };
}

/** Estado de un plan del usuario. null = no existe o no es suyo. */
export async function estadoPlan(id: number): Promise<PlanEstado | null> {
  const sb = supabaseBrowser();
  const [{ data, error }, fila] = await Promise.all([
    sb.rpc("plan_estado", { p_plan_id: id }),
    sb.from("reserva_planes").select("id").eq("id", id).maybeSingle(),
  ]);
  if (error) {
    if (error.code === "42501") return null;
    throw error;
  }
  const e = data as Record<string, unknown> | null;
  return e?.ok === true ? normalizar(e, Boolean(fila.data)) : null;
}

/** Planes del usuario, los abiertos primero y los más nuevos arriba. */
export async function listarPlanes(usuarioId: string): Promise<PlanEstado[]> {
  const { data, error } = await supabaseBrowser()
    .from("reserva_planes")
    .select("id, estado, created_at")
    .eq("usuario_id", usuarioId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const filas = (data ?? []) as { id: number; estado: string }[];
  // Estas filas ya pasaron la RLS de dueño: todas son propias.
  const estados = await Promise.all(
    filas.map(async (f) => {
      const { data: e, error: err } = await supabaseBrowser().rpc("plan_estado", { p_plan_id: f.id });
      if (err) throw err;
      const r = e as Record<string, unknown> | null;
      return r?.ok === true ? normalizar(r, true) : null;
    }),
  );
  return estados.filter((p): p is PlanEstado => p !== null).sort((a, b) => Number(esAbierto(b)) - Number(esAbierto(a)));
}

/** Cuántos planes tiene y cuántos siguen abiertos (para la fila del menú de cuenta). */
export async function contarPlanes(usuarioId: string): Promise<{ total: number; abiertos: number }> {
  const { data } = await supabaseBrowser().from("reserva_planes").select("estado").eq("usuario_id", usuarioId);
  const filas = (data ?? []) as { estado: string }[];
  return { total: filas.length, abiertos: filas.filter((f) => (PLAN_ABIERTO as readonly string[]).includes(f.estado)).length };
}

const ERRORES_EMITIR: Record<string, string> = {
  checkout_desactivado: "Los pagos en línea están pausados por ahora. Escríbanos por WhatsApp y le ayudamos.",
  plan_cerrado: "Este plan ya está cerrado: no admite más pagos.",
  reserva_no_disponible: "La reserva de este plan ya no está activa. Escríbanos por WhatsApp.",
  plan_vencido: "El plazo para pagar la primera cuota venció. Escríbanos por WhatsApp y lo revisamos.",
  nada_que_pagar: "Este plan no tiene nada pendiente.",
  tasa_no_disponible: "Todavía no tenemos la tasa del BCV de hoy. Pruebe en un rato o pague en dólares.",
};

/** Emite (o reutiliza) el pago de la próxima cuota o del saldo. Devuelve el token de /pagar o un texto de error. */
export async function emitirPago(
  planId: number,
  que: "proxima" | "saldo",
  riel: Riel,
): Promise<{ token: string; enVerificacion: boolean } | { error: string }> {
  const { data, error } = await supabaseBrowser().rpc("plan_emitir_pago", { p_plan_id: planId, p_que: que, p_riel: riel });
  const r = data as Record<string, unknown> | null;
  // en_verificacion: ya hay un pago del plan en revisión y no se emite otro; el token es el de ese pago.
  if (!error && r?.ok === true && typeof r.token === "string") return { token: r.token, enVerificacion: r.en_verificacion === true };
  const codigo = typeof r?.error === "string" ? r.error : "";
  return { error: ERRORES_EMITIR[codigo] ?? "No pudimos preparar el pago. Inténtelo de nuevo en un momento." };
}
