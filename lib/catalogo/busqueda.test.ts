import assert from "node:assert/strict";
import { test } from "node:test";
import { prioridadProducto } from "./busqueda.ts";
import type { Producto } from "@/types/supabase";

const producto = (id: number, nombre: string, plan: string | null): Producto =>
  ({
    id,
    tipo: "hotel",
    nombre,
    destino: "Isla de Margarita",
    descripcion: null,
    requisitos: null,
    tarifa_destacada_id: 1,
    tarifas: [{ id: 1, plan } as Producto["tarifas"][number]],
    producto_fotos: [],
  }) as Producto;

test("hotel en el mapa de niño gratis va primero, aunque no sea todo incluido", () => {
  const p = producto(1, "Hotel Cualquiera", "Solo desayuno");
  assert.equal(prioridadProducto(p, new Set([1])), 0);
});

test("todo incluido en el plan de la tarifa destacada va segundo", () => {
  const p = producto(2, "Hotel Cualquiera", "Todo Incluido");
  assert.equal(prioridadProducto(p, new Set()), 1);
});

test("todo incluido en el nombre del producto también cuenta (paquetes sin plan en la tarifa)", () => {
  const p = producto(3, "Paquete Todo Incluido Margarita", null);
  assert.equal(prioridadProducto(p, new Set()), 1);
});

test("sin niño gratis ni todo incluido queda al final", () => {
  const p = producto(4, "Hotel Cualquiera", "Solo desayuno");
  assert.equal(prioridadProducto(p, new Set()), 2);
});
