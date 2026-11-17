import assert from "node:assert/strict";
import { test } from "node:test";
import type { Tarifa } from "@/types/supabase";
import { montoDoble, precioPorPersona, unidadTarifa } from "./tarifas.ts";

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
