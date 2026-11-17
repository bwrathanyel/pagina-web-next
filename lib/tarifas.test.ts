import assert from "node:assert/strict";
import { test } from "node:test";
import type { Tarifa } from "@/types/supabase";
import { montoDoble, precioPorPersona, unidadTarifa, vendibleEn } from "./tarifas.ts";
import { hoyCaracas } from "./cotizador/estado.ts";

// Misma tabla de verdad que tarUnidad() del CRM (app.js, bloque CB_TARIFAS).
const fila = (precios: Record<string, unknown>, base_precio?: string) =>
  ({ precios, tarifario_bloques: base_precio ? { base_precio } : null }) as unknown as Tarifa;

test("unidadTarifa: fila, luego bloque, luego grilla", () => {
  assert.deepEqual(unidadTarifa(fila({ base: "persona_noche", sgl: 90, dbl: 60 })), { unidad: "persona", deducida: false });
  assert.deepEqual(unidadTarifa(fila({ sgl: 100, dbl: 100 }, "habitacion")), { unidad: "habitacion", deducida: false });
  assert.deepEqual(unidadTarifa(fila({ base: "persona", dbl: 60 }, "habitacion")), { unidad: "persona", deducida: false });
  assert.deepEqual(unidadTarifa(fila({ sgl: 80, dbl: 120 })), { unidad: "habitacion", deducida: true });
  assert.deepEqual(unidadTarifa(fila({ sgl: 80, dbl: 80 })), { unidad: null, deducida: false });
});

test("persona_noche y habitacion_noche cuentan como base declarada", () => {
  assert.equal(precioPorPersona(fila({ base: "habitacion_noche", sgl: 100, dbl: 100 })), 50);
  assert.equal(precioPorPersona(fila({ base: "persona_noche", sgl: 50, dbl: 120 })), 120);
  assert.equal(montoDoble({ base: "habitacion_noche", sgl: 100, dbl: 100 }), 50);
});

test("vendibleEn: la que vence hoy en Caracas sigue vendible después de las 20 h", () => {
  // 2026-11-17 21:30 en Caracas = 2026-11-18 01:30 UTC.
  const hoy = hoyCaracas(new Date("2026-11-18T01:30:00Z"));
  assert.equal(hoy, "2026-11-17");
  const t = { vigente: true, venta_hasta: "2026-11-17", fecha_fin: "2026-11-17" } as unknown as Tarifa;
  assert.equal(vendibleEn(t, hoy), true);
  assert.equal(vendibleEn(t, "2026-11-18"), false);
  assert.equal(vendibleEn({ ...t, vigente: false } as Tarifa, hoy), false);
});
