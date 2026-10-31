// Plan de abonos en /reservar: solo para MOSTRAR. checkout_web_crear recalcula montos y fechas con
// las mismas reglas (cuota 1 = pct % del total; las siguientes se reparten el resto y la última
// absorbe el redondeo; vencen hoy + cada día de `plan_dias_cuotas`).

export interface ConfigPlan {
  plan_activo: boolean;
  plan_min_dias: number;
  plan_pct_inicial: number;
  plan_dias_cuotas: number[];
  plan_tc_version: string | null;
}

export interface CuotaPlan {
  n: number;
  fecha: string;
  monto: number;
}

export type Plan =
  | { disponible: true; inicial: number; cuotas: CuotaPlan[] }
  | { disponible: false; motivo: "sin_config" | "sin_fecha" | "viaje_cercano"; minDias: number };

const MARGEN_DIAS = 20; // la última cuota vence al menos 20 días antes del viaje
const DIA_MS = 86_400_000;
const utc = (ymd: string) => Date.UTC(Number(ymd.slice(0, 4)), Number(ymd.slice(5, 7)) - 1, Number(ymd.slice(8, 10)));
const sumarDias = (ymd: string, n: number) => new Date(utc(ymd) + n * DIA_MS).toISOString().slice(0, 10);
const redondear = (n: number) => Math.round(n * 100) / 100;

export function calcularPlan(total: number, desde: string, hoy: string, c: ConfigPlan): Plan {
  const dias = c.plan_dias_cuotas;
  const pct = c.plan_pct_inicial;
  const ultima = dias[dias.length - 1] ?? 0;
  const minDias = Math.max(c.plan_min_dias, ultima + MARGEN_DIAS);
  if (!c.plan_activo || !c.plan_tc_version || !dias.length || !(pct > 0 && pct < 100)) return { disponible: false, motivo: "sin_config", minDias };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(desde)) return { disponible: false, motivo: "sin_fecha", minDias };
  if ((utc(desde) - utc(hoy)) / DIA_MS < minDias) return { disponible: false, motivo: "viaje_cercano", minDias };

  const inicial = redondear((total * pct) / 100);
  const cuota = redondear((total * (100 - pct)) / dias.length / 100);
  let acum = inicial;
  const cuotas = dias.map((d, i) => {
    const monto = i === dias.length - 1 ? redondear(total - acum) : cuota;
    acum += monto;
    return { n: i + 2, fecha: sumarDias(hoy, d), monto };
  });
  return { disponible: true, inicial, cuotas };
}
