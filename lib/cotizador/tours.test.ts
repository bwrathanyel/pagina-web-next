import assert from "node:assert/strict";
import { test } from "node:test";
import { destinoDeTour, esTour, textoPrecioTour, tourDeProducto } from "./tours.ts";

test("separa tours de paquetes, vuelos y descriptivos", () => {
  assert.ok(esTour("Tour Rayo del Catatumbo"));
  assert.ok(esTour("Vamos a Cubagua - Full Day (Mamale)"));
  assert.ok(esTour("Daypass Unik (Sunsol Unik Luxury Hotel)"));
  assert.ok(!esTour("Vuelo Caracas - Madrid (ida y vuelta) + Tour"));
  assert.ok(!esTour("Descriptivo Excursiones Infinito (Cubagua y Coche)"));
  assert.ok(!esTour("Paquete Fin de Año en Margarita (saliendo desde Caracas)"));
});

test("el destino de la base pasa al destino de la barra de viaje", () => {
  assert.equal(destinoDeTour("Cubagua"), "Isla de Margarita");
  assert.equal(destinoDeTour("Zulia"), "Catatumbo");
  assert.equal(destinoDeTour("Dubái"), null);
  assert.equal(destinoDeTour(null), null);
});

test("precio solo si la web lo conoce", () => {
  const t = tourDeProducto({ id: 45, nombre: "Daypass Unik (Sunsol Unik Luxury Hotel)", destino: "Margarita" }, null);
  assert.equal(t?.destino, "Isla de Margarita");
  assert.equal(textoPrecioTour(t!), "$50 por adulto · niños $25 (4-10 años)");
  const sin = tourDeProducto({ id: 1057, nombre: "Vamos a Cubagua - Full Day (Mamale)", destino: "Cubagua" }, null);
  assert.equal(sin?.adultoUsd, null);
  assert.equal(textoPrecioTour(sin!), null);
  assert.equal(tourDeProducto({ id: 23, nombre: "Dubai Express", destino: "Dubái" }, null), null);
});
