import assert from "node:assert/strict";
import { test } from "node:test";
import type { Tarifa } from "@/types/supabase";
import { UNIDAD_HABITACION_NOCHE, badgePrecio, precioDePaquete, montoDoble, montoHabitacionNoche, precioDeTarifa, precioDobleHero, precioPorPersona, precioTarjeta, unidadTarifa, vendibleEn } from "./tarifas.ts";
import { hoyCaracas } from "./cotizador/estado.ts";

// Misma tabla de verdad que tarUnidad() del CRM (app.js, bloque CB_TARIFAS).
const fila = (precios: Record<string, unknown>, base_precio?: string) =>
  ({ precios, tarifario_bloques: base_precio ? { base_precio } : null }) as unknown as Tarifa;

test("unidadTarifa: fila, luego bloque, luego grilla", () => {
  assert.deepEqual(unidadTarifa(fila({ base: "persona_noche", sgl: 90, dbl: 60 })), { unidad: "persona", deducida: false });
  assert.deepEqual(unidadTarifa(fila({ sgl: 100, dbl: 100 }, "habitacion")), { unidad: "habitacion", deducida: false });
  assert.deepEqual(unidadTarifa(fila({ base: "persona", dbl: 60 }, "habitacion")), { unidad: "persona", deducida: false });
  assert.deepEqual(unidadTarifa(fila({ sgl: 80, dbl: 120 })), { unidad: "habitacion", deducida: true });
  assert.deepEqual(unidadTarifa(fila({ sgl: 80, dbl: 80 })), { unidad: "habitacion", deducida: true });
  assert.deepEqual(unidadTarifa(fila({ sgl: 290, dbl: 290, tpl: 60 })), { unidad: "habitacion", deducida: true });
  assert.deepEqual(unidadTarifa(fila({ doble: 290, sencilla: 319, persona_adicional: 60 })), { unidad: "habitacion", deducida: true });
  assert.deepEqual(unidadTarifa(fila({ sgl: 90, dbl: 60, tpl: 55 })), { unidad: "persona", deducida: true });
  assert.deepEqual(unidadTarifa(fila({ dbl: 310, sgl: 405, pax_adic: 280 })), { unidad: "persona", deducida: true });
});

test("persona_noche y habitacion_noche cuentan como base declarada", () => {
  assert.equal(precioPorPersona(fila({ base: "habitacion_noche", sgl: 100, dbl: 100 })), 50);
  assert.equal(precioPorPersona(fila({ base: "persona_noche", sgl: 50, dbl: 120 })), 120);
  assert.equal(montoDoble({ base: "habitacion_noche", sgl: 100, dbl: 100 }), 50);
});

test("habitación con SGL = DBL: «desde» por habitación por noche, sin dividir (dueño, 2026-11-18)", () => {
  const cala = { ...fila({ sgl: 290, dbl: 290, tpl: 60 }), moneda: "EUR" } as Tarifa;
  assert.equal(montoHabitacionNoche(cala), 290);
  assert.deepEqual(precioDeTarifa(cala), { monto: "$290", unidad: UNIDAD_HABITACION_NOCHE, desde: true, corto: true, ivaEnBs: false, tasa: "EUR" });
  assert.equal(badgePrecio(cala), `Desde $290 ${UNIDAD_HABITACION_NOCHE}`);
  assert.deepEqual(precioDobleHero(cala), { monto: "$290", nota: UNIDAD_HABITACION_NOCHE });
  assert.equal(precioTarjeta({ precios: { sgl: 290, dbl: 290 }, moneda: "EUR" })?.unidad, UNIDAD_HABITACION_NOCHE);
  assert.equal(precioTarjeta({ precios: { sgl: 290, dbl: 290 }, moneda: "EUR" })?.tasa, "EUR");
  assert.equal(precioTarjeta({ precios: { sgl: 290, dbl: 290 }, moneda: "USD" })?.tasa, "USD");
  assert.equal(precioTarjeta({ precios: { sgl: 290, dbl: 290 } })?.tasa, "USD");
  assert.equal(montoHabitacionNoche(fila({ doble: 290, sencilla: 319, persona_adicional: 60 })), 290);
  assert.equal(montoHabitacionNoche(fila({ sgl: 100, dbl: 100 }, "habitacion")), 100);
});

test("sin cambio: DBL > SGL sigue el doble por persona; base persona sigue por persona", () => {
  assert.equal(montoHabitacionNoche(fila({ sgl: 80, dbl: 120 })), null);
  assert.equal(precioDeTarifa(fila({ sgl: 80, dbl: 120 }))?.unidad, "por persona");
  assert.equal(montoHabitacionNoche(fila({ base: "persona", sgl: 90, dbl: 90 })), null);
  assert.equal(montoHabitacionNoche(fila({ sgl: 90, dbl: 60 })), null);
  assert.equal(precioTarjeta({ precios: { sgl: 80, dbl: 120 } })?.unidad, "por persona y noche, en doble");
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

test("precio_texto de paquete (LD Palm Beach): el monto al talón, nunca el texto", () => {
  const texto = "03 días y 02 noches para 02 personas con 1 Niño Gratis: REF. 240.00 / Adulto Adicional: REF. 240.00 / 2do. Niño (4-10): REF. 120";
  assert.deepEqual(precioDePaquete(texto), { monto: "$240", unidad: "3 días y 2 noches para 2 personas con 1 Niño Gratis" });
  const tarjeta = precioTarjeta({ precio_texto: texto, precios: null, precio_desde_usd: null, moneda: "USD" });
  assert.equal(tarjeta?.monto, "$240");
  assert.equal(tarjeta?.corto, true);
  assert.equal(precioDeTarifa({ precio_texto: texto, precios: null, moneda: "USD" } as unknown as Tarifa)?.monto, "$240");
  assert.equal(precioDePaquete("Paquete 4 noches: $1.250,50 total")?.monto, "$1250.50");
  assert.equal(precioDePaquete("$286 por persona (paquete)"), null);
  assert.equal(precioDePaquete("Consultar con el asesor"), null);
  assert.equal(precioDePaquete("CHD 4-10 $43 / DBL $85"), null);
});
