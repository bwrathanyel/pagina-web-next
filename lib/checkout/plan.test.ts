import assert from "node:assert/strict";
import { test } from "node:test";
import { calcularPlan } from "./plan.ts";

const CFG = { plan_activo: true, plan_min_dias: 65, plan_pct_inicial: 40, plan_dias_cuotas: [15, 30, 45], plan_tc_version: "2026-10-31" };

test("40 % hoy y 3 cuotas a 15/30/45 días; la última absorbe el redondeo", () => {
  assert.deepEqual(calcularPlan(1000, "2027-01-20", "2026-10-31", CFG), {
    disponible: true,
    inicial: 400,
    cuotas: [
      { n: 2, fecha: "2026-11-15", monto: 200 },
      { n: 3, fecha: "2026-11-30", monto: 200 },
      { n: 4, fecha: "2026-12-15", monto: 200 },
    ],
  });
  const p = calcularPlan(1000.01, "2027-01-20", "2026-10-31", CFG);
  assert.ok(p.disponible);
  assert.equal(p.inicial, 400);
  assert.deepEqual(p.cuotas.map((c) => c.monto), [200, 200, 200.01]);
});

test("viaje a menos de 65 días, sin fecha o sin config: no disponible", () => {
  assert.equal(calcularPlan(1000, "2027-01-04", "2026-10-31", CFG).disponible, true); // 65 días justos
  assert.deepEqual(calcularPlan(1000, "2027-01-03", "2026-10-31", CFG), { disponible: false, motivo: "viaje_cercano", minDias: 65 });
  assert.equal(calcularPlan(1000, "", "2026-10-31", CFG).disponible, false);
  assert.equal(calcularPlan(1000, "2027-06-01", "2026-10-31", { ...CFG, plan_tc_version: null }).disponible, false);
  assert.deepEqual(calcularPlan(1000, "2027-06-01", "2026-10-31", { ...CFG, plan_activo: false }), { disponible: false, motivo: "sin_config", minDias: 65 });
  // La última cuota + 20 días manda si supera el mínimo configurado.
  assert.deepEqual(calcularPlan(1000, "2027-01-20", "2026-10-31", { ...CFG, plan_dias_cuotas: [30, 60, 90] }),
    { disponible: false, motivo: "viaje_cercano", minDias: 110 });
});
