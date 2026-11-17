import assert from "node:assert/strict";
import { test } from "node:test";
import type { OfertaHotel } from "./ofertas.ts";
import { destacadosDe, rotarDestacados, semillaVisitante } from "./destacados.ts";
import { candidatosEstimado, etiquetaMotivo, recomendarHoteles, type Recomendacion } from "./recomendar.ts";

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

const ids = (r: Recomendacion[]) => r.map((x) => [x.oferta.hotelId, x.motivo]);
const hoteles = (r: (Recomendacion | OfertaHotel)[]) => r.map((x) => ("oferta" in x ? x.oferta.hotelId : x.hotelId));
const MARGARITA = "Isla de Margarita";

test("sin mapa los destacados son los 3 primeros disponibles; el stop sale no aparece", () => {
  const ofertas = [1, 2, 3, 4, 5, 6].map((i) => oferta(i));
  const r = recomendarHoteles(ofertas, { bloqueada: (o) => o.hotelId === 1 });
  assert.deepEqual(ids(r.destacados), [
    [2, "recomendado"],
    [3, "recomendado"],
    [4, "recomendado"],
  ]);
  // Sin totales ni precio anunciado no hay económico ni exclusivo: cae a la siguiente del orden.
  assert.deepEqual(ids(r.alternativas), [
    [5, "otra"],
    [6, "otra"],
  ]);
  assert.deepEqual(recomendarHoteles([oferta(1)], { bloqueada: () => true }), { destacados: [], alternativas: [] });
});

test("Margarita: los destacados del mapa en su orden", () => {
  const ofertas = [1, 2, 3, 4, 1026, 5].map((i) => oferta(i));
  assert.deepEqual(hoteles(recomendarHoteles(ofertas, { destino: MARGARITA }).destacados), [1026, 4, 2]);
  assert.deepEqual(hoteles(destacadosDe(ofertas, MARGARITA)), [1026, 4, 2]);
});

test("un destacado bloqueado o ausente se reemplaza con el orden del dueño", () => {
  const ofertas = [1, 2, 3, 4, 1026].map((i) => oferta(i));
  assert.deepEqual(hoteles(destacadosDe(ofertas, MARGARITA, (o) => o.hotelId === 4)), [1026, 2, 1]);
  assert.deepEqual(hoteles(destacadosDe([1, 2, 3, 4].map((i) => oferta(i)), MARGARITA)), [4, 2, 1]);
  assert.deepEqual(destacadosDe([oferta(4)], MARGARITA, () => true), []);
});

test("destino sin entrada en el mapa usa los 3 primeros disponibles", () => {
  const ofertas = [7, 1026, 4, 2, 9].map((i) => oferta(i));
  assert.deepEqual(hoteles(destacadosDe(ofertas, "Mérida")), [7, 1026, 4]);
  assert.deepEqual(hoteles(destacadosDe(ofertas, null)), [7, 1026, 4]);
  assert.deepEqual(hoteles(destacadosDe(ofertas, undefined, (o) => o.hotelId === 7)), [1026, 4, 2]);
});

test("desayuno excluye todo incluido; exclusivo por precio anunciado sin totales", () => {
  const ofertas = [
    oferta(1),
    oferta(2),
    oferta(3),
    oferta(4, { todoIncluido: true, orden: 10 }),
    oferta(5, { orden: 50 }),
    oferta(6, { orden: 80 }),
    oferta(7, { todoIncluido: true, orden: 200 }),
  ];
  const r = recomendarHoteles(ofertas);
  assert.deepEqual(ids(r.alternativas), [
    [5, "desayuno"],
    [7, "exclusivo"],
  ]);
  assert.equal(etiquetaMotivo(r.alternativas[0]), "Solo desayuno");
  assert.equal(etiquetaMotivo(r.alternativas[1]), "Más exclusivo");
  assert.equal(etiquetaMotivo(r.destacados[0]), "Nuestra recomendación");
});

test("si todas las libres son todo incluido cae a económico", () => {
  const ofertas = [
    oferta(1),
    oferta(2),
    oferta(3),
    oferta(4, { todoIncluido: true, orden: 30 }),
    oferta(5, { todoIncluido: true, orden: 60 }),
  ];
  assert.deepEqual(ids(recomendarHoteles(ofertas).alternativas), [
    [4, "economico"],
    [5, "exclusivo"],
  ]);
});

test("por total real, comparando solo la moneda que más se repite (monedas mezcladas)", () => {
  const ofertas = [1, 2, 3, 4, 5, 6, 7].map((i) => oferta(i, { orden: 100 + i }));
  const totales: Record<number, { monto: number; moneda: string }> = {
    4: { monto: 900, moneda: "USD" },
    5: { monto: 5000, moneda: "EUR" },
    6: { monto: 700, moneda: "USD" },
    7: { monto: 800, moneda: "USD" },
  };
  const r = recomendarHoteles(ofertas, { total: (o) => totales[o.hotelId] ?? null });
  assert.deepEqual(ids(r.alternativas), [
    [6, "desayuno"],
    [4, "exclusivo"],
  ]);
});

test("con menos de 3 totales manda el precio anunciado", () => {
  const ofertas = [
    oferta(1),
    oferta(2),
    oferta(3),
    oferta(4, { orden: 90 }),
    oferta(5, { orden: 70 }),
    oferta(6, { orden: 30 }),
    oferta(7, { orden: 80 }),
  ];
  const totales: Record<number, { monto: number; moneda: string }> = {
    5: { monto: 900, moneda: "USD" },
    7: { monto: 100, moneda: "USD" },
  };
  const r = recomendarHoteles(ofertas, { total: (o) => totales[o.hotelId] ?? null });
  assert.deepEqual(ids(r.alternativas), [
    [6, "desayuno"],
    [4, "exclusivo"],
  ]);
});

test("con niños, el niño gratis ocupa el lugar del exclusivo solo si este cayó a otra", () => {
  const ofertas = [
    oferta(1),
    oferta(2),
    oferta(3),
    oferta(4),
    oferta(5, { ninosGratis: true, ninosGratisCantidad: 2 }),
    oferta(6),
  ];
  const r = recomendarHoteles(ofertas, { ninos: 2 });
  assert.deepEqual(ids(r.alternativas), [
    [4, "otra"],
    [5, "ninos-gratis"],
  ]);
  assert.equal(etiquetaMotivo(r.alternativas[1]), "2 niños gratis");
  // Sin niños, el regalo no es motivo.
  assert.deepEqual(ids(recomendarHoteles(ofertas).alternativas), [
    [4, "otra"],
    [5, "otra"],
  ]);
  // Con precio anunciado hay exclusivo: el niño gratis no lo desplaza.
  const conPrecio = ofertas.map((o) => ({ ...o, orden: o.hotelId * 10 }));
  assert.deepEqual(ids(recomendarHoteles(conPrecio, { ninos: 2 }).alternativas), [
    [4, "desayuno"],
    [6, "exclusivo"],
  ]);
});

test("sin repetidos entre destacados y alternativas ni entre sí", () => {
  // El más barato y el más caro son destacados: no vuelven como alternativa.
  const ofertas = [
    oferta(1026, { orden: 10 }),
    oferta(4, { orden: 999 }),
    oferta(2, { orden: 50 }),
    oferta(8, { orden: 60 }),
  ];
  const r = recomendarHoteles(ofertas, { destino: MARGARITA });
  assert.deepEqual(hoteles(r.destacados), [1026, 4, 2]);
  assert.deepEqual(ids(r.alternativas), [[8, "desayuno"]]);
  const todos = [...hoteles(r.destacados), ...hoteles(r.alternativas)];
  assert.equal(new Set(todos).size, todos.length);
});

test("rotarDestacados conserva el orden circular y tolera semillas inválidas", () => {
  const l = ["a", "b", "c"];
  assert.deepEqual(rotarDestacados(l, 0), ["a", "b", "c"]);
  assert.deepEqual(rotarDestacados(l, 1), ["b", "c", "a"]);
  assert.deepEqual(rotarDestacados(l, 4), ["b", "c", "a"]);
  assert.deepEqual(rotarDestacados([], 2), []);
  assert.deepEqual(rotarDestacados(l, NaN), ["a", "b", "c"]);
  assert.deepEqual(rotarDestacados(l, -2), ["c", "a", "b"]);
  assert.deepEqual(rotarDestacados(l, 2.7), ["c", "a", "b"]);
  assert.deepEqual(rotarDestacados(l, Infinity), ["a", "b", "c"]);
  assert.deepEqual(l, ["a", "b", "c"]);
});

test("semillaVisitante: entero en 0..2^31", () => {
  assert.equal(semillaVisitante(() => 0), 0);
  assert.equal(semillaVisitante(() => 0.5), 2 ** 30);
  assert.equal(semillaVisitante(() => NaN), 0);
  const s = semillaVisitante();
  assert.ok(Number.isInteger(s) && s >= 0 && s <= 2 ** 31);
});

test("candidatos a estimar: destacados del destino, los primeros del orden y los más baratos, sin repetir", () => {
  const ofertas = Array.from({ length: 12 }, (_, i) => oferta(i + 1, { orden: 100 - i }));
  assert.deepEqual(candidatosEstimado(ofertas, 3, 2), [1, 2, 3, 12, 11]);
  assert.deepEqual(candidatosEstimado([oferta(1, { orden: 10 }), oferta(2)], 3, 2), [1, 2]);
  assert.deepEqual(candidatosEstimado(ofertas, 3, 2, MARGARITA), [4, 2, 1, 3, 12, 11]);
  assert.deepEqual(candidatosEstimado([...ofertas, oferta(1026)], 3, 2, MARGARITA), [1026, 4, 2, 1, 3, 12, 11]);
});
