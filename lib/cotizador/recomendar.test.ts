import assert from "node:assert/strict";
import { test } from "node:test";
import type { OfertaHotel } from "./ofertas.ts";
import { candidatosEstimado, etiquetaMotivo, recomendarHoteles } from "./recomendar.ts";

const oferta = (hotelId: number, extra: Partial<OfertaHotel> = {}): OfertaHotel => ({
  hotelId,
  tarifaId: hotelId * 10,
  nombre: `Hotel ${hotelId}`,
  destino: "Isla de Margarita",
  foto: null,
  fotos: [],
  conFotosHabitacion: false,
  titulo: null,
  plan: null,
  resumen: null,
  precio: null,
  orden: null,
  todoIncluido: false,
  ninosGratis: false,
  ninosGratisCantidad: 0,
  ninosGratisEdades: null,
  precioNino: null,
  prioridad: 2,
  ...extra,
});

const ids = (r: ReturnType<typeof recomendarHoteles>) => r.map((x) => [x.oferta.hotelId, x.motivo]);

test("la primera disponible del orden del dueño es la recomendada; el stop sale no se recomienda", () => {
  const ofertas = [oferta(1), oferta(2), oferta(3), oferta(4)];
  const r = recomendarHoteles(ofertas, { bloqueada: (o) => o.hotelId === 1 });
  assert.deepEqual(ids(r), [
    [2, "recomendado"],
    [3, "otra"],
    [4, "otra"],
  ]);
  assert.deepEqual(recomendarHoteles([oferta(1)], { bloqueada: () => true }), []);
});

test("más económico por total real, comparando solo la moneda que más se repite", () => {
  const ofertas = [oferta(1), oferta(2), oferta(3), oferta(4)];
  const totales: Record<number, { monto: number; moneda: string }> = {
    1: { monto: 900, moneda: "USD" },
    2: { monto: 300, moneda: "EUR" },
    3: { monto: 700, moneda: "USD" },
    4: { monto: 800, moneda: "USD" },
  };
  const r = recomendarHoteles(ofertas, { total: (o) => totales[o.hotelId] ?? null });
  assert.deepEqual(r[1], { oferta: ofertas[2], motivo: "economico" });
});

test("con menos de 3 totales manda el precio anunciado", () => {
  const ofertas = [oferta(1, { orden: 90 }), oferta(2, { orden: 70 }), oferta(3, { orden: 30 }), oferta(4, { orden: 80 })];
  const totales: Record<number, { monto: number; moneda: string }> = {
    1: { monto: 900, moneda: "USD" },
    2: { monto: 500, moneda: "USD" },
  };
  const r = recomendarHoteles(ofertas, { total: (o) => totales[o.hotelId] ?? null });
  assert.deepEqual(r[1], { oferta: ofertas[2], motivo: "economico" });
});

test("sin fechas manda el precio anunciado", () => {
  const ofertas = [oferta(1, { orden: 80 }), oferta(2, { orden: 95 }), oferta(3, { orden: 40 }), oferta(4)];
  assert.deepEqual(ids(recomendarHoteles(ofertas)).slice(0, 2), [
    [1, "recomendado"],
    [3, "economico"],
  ]);
});

test("si la recomendada ya es la más barata, el motivo no se le pone a otra", () => {
  const ofertas = [oferta(1, { orden: 40 }), oferta(2, { orden: 90 }), oferta(3, { todoIncluido: true, orden: 120 })];
  assert.deepEqual(ids(recomendarHoteles(ofertas)), [
    [1, "recomendado"],
    [3, "todo-incluido"],
    [2, "otra"],
  ]);
});

test("con niños entra un hotel con niño gratis antes que el todo incluido", () => {
  const ofertas = [
    oferta(1, { ninosGratis: true, ninosGratisCantidad: 1 }),
    oferta(2, { todoIncluido: true }),
    oferta(3, { ninosGratis: true, ninosGratisCantidad: 2 }),
  ];
  const r = recomendarHoteles(ofertas, { ninos: 2 });
  assert.deepEqual(ids(r), [
    [1, "recomendado"],
    [3, "ninos-gratis"],
    [2, "todo-incluido"],
  ]);
  assert.equal(etiquetaMotivo(r[1]), "2 niños gratis");
  assert.equal(etiquetaMotivo(r[0]), "Nuestra recomendación");
  // Sin niños, el regalo no es motivo.
  assert.deepEqual(ids(recomendarHoteles(ofertas)).map(([, m]) => m), ["recomendado", "todo-incluido", "otra"]);
});

test("candidatos a estimar: los primeros del orden y los más baratos, sin repetir", () => {
  const ofertas = Array.from({ length: 12 }, (_, i) => oferta(i + 1, { orden: 100 - i }));
  assert.deepEqual(candidatosEstimado(ofertas, 3, 2), [1, 2, 3, 12, 11]);
  assert.deepEqual(candidatosEstimado([oferta(1, { orden: 10 }), oferta(2)], 3, 2), [1, 2]);
});
