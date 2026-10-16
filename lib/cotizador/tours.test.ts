import assert from "node:assert/strict";
import { test } from "node:test";
import type { Tarifa } from "../../types/supabase.ts";
import { destinoDeTour, textoPrecioTour, tourDeProducto } from "./tours.ts";

const tarifa = (id: number, precios: Record<string, unknown>, titulo: string | null = null): Tarifa =>
  ({ id, precio_texto: "", precio_desde_usd: null, vigencia_texto: null, vigente: true, moneda: "USD", titulo, precios }) as unknown as Tarifa;

const COCHE = tarifa(1, {
  base: "persona", adulto: 80, nino: 50, infante: 0, edad_nino: [4, 11], incluye_traslado: false, etiqueta: null,
});

test("el destino de la base pasa al destino de la barra de viaje", () => {
  assert.equal(destinoDeTour("Cubagua"), "Isla de Margarita");
  assert.equal(destinoDeTour("Coche"), "Isla de Margarita");
  assert.equal(destinoDeTour("Zulia"), null);
  assert.equal(destinoDeTour(null), null);
});

test("el precio sale de la tarifa de la excursión", () => {
  const t = tourDeProducto({ id: 1112, nombre: "Full Day Coche", destino: "Coche", tarifas: [COCHE] }, null);
  assert.equal(t?.destino, "Isla de Margarita");
  assert.equal(textoPrecioTour(t!), "$80 por adulto · niños $50 (4-11 años)");
  assert.equal(t?.nota, null);
});

test("sin tarifa con precio o con destino fuera de la barra no hay tour", () => {
  assert.equal(tourDeProducto({ id: 1, nombre: "Sin precio", destino: "Margarita", tarifas: [] }, null), null);
  assert.equal(tourDeProducto({ id: 2, nombre: "Dubai", destino: "Dubái", tarifas: [COCHE] }, null), null);
  assert.equal(textoPrecioTour({ adultoUsd: null, ninoUsd: null, ninoEdadTexto: null }), null);
});

test("Glamping trae SGL y DBL: se anuncia el desde y se avisa", () => {
  const sgl = tarifa(2, { adulto: 230, nino: 150, edad_nino: [4, 11], etiqueta: "Cubagua" }, "Habitación sencilla (SGL)");
  const dbl = tarifa(3, { adulto: 190, nino: 150, edad_nino: [4, 11], etiqueta: "Cubagua" }, "Habitación doble (DBL)");
  const t = tourDeProducto({ id: 1077, nombre: "Cubagua 24 Hrs Glamping", destino: "Margarita", tarifas: [sgl, dbl] }, null);
  assert.equal(t?.adultoUsd, 190);
  assert.equal(t?.nota, "Cubagua · Precio desde, según habitación");
});
