import assert from "node:assert/strict";
import { test } from "node:test";
import { leerDias, recomendacionDia, rutasHacia, textoDias, textoDiasFila, textoRecomendacion, type RutaAerea } from "./guiaRutas.ts";

const fila = (origen: string, origenNombre: string, aerolinea: string, dias: string[], destino = "PMV"): RutaAerea => ({
  origen_iata: origen,
  origen_nombre: origenNombre,
  destino_iata: destino,
  destino_nombre: destino === "PMV" ? "Margarita" : destino,
  aerolinea,
  dias_operacion: dias,
  verificado_en: "2026-11-18",
  nota: null,
});

// Carga inicial de 2026-11-18 (web_rutas_aereas).
const RUTAS = [
  fila("VLN", "Valencia", "Turpial", ["martes", "jueves", "domingo"]),
  fila("VLN", "Valencia", "Aeropostal", ["lunes", "martes", "jueves", "domingo"]),
  fila("VLN", "Valencia", "Conviasa", []),
  fila("CCS", "Caracas", "LASER", ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]),
  fila("CCS", "Caracas", "Estelar", ["martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]),
];

test("leerDias entiende nombres, abreviaturas, diario y rangos", () => {
  assert.deepEqual(leerDias(["Mar", "jue.", "DOM"]).dias, [2, 4, 0]);
  assert.deepEqual(leerDias(["diario"]).dias, [1, 2, 3, 4, 5, 6, 0]);
  assert.deepEqual(leerDias(["mar-dom"]).dias, [2, 3, 4, 5, 6, 0]);
  assert.deepEqual(leerDias(["viernes a lunes"]).dias, [1, 5, 6, 0]);
  assert.deepEqual(leerDias(["feriados"]).otros, ["feriados"]);
});

test("textoDias agrupa la semana", () => {
  assert.equal(textoDias([1, 2, 3, 4, 5, 6, 0]), "Todos los días");
  assert.equal(textoDias([2, 3, 4, 5, 6, 0]), "Martes a domingo");
  assert.equal(textoDias([1, 2, 4, 0]), "Lunes, martes, jueves y domingo");
  assert.equal(textoDiasFila(RUTAS[2]), "Días a confirmar");
});

test("rutasHacia: origen elegido primero y filas con días antes", () => {
  const g = rutasHacia(RUTAS, "PMV", "VLN");
  assert.deepEqual(g.map((x) => x.origenIata), ["VLN", "CCS"]);
  assert.equal(g[0].filas.at(-1)?.aerolinea, "Conviasa");
});

test("un miércoles desde Valencia no suele haber vuelos (parcial: Conviasa sin días)", () => {
  const r = recomendacionDia(RUTAS, "VLN", "PMV", "2026-11-25");
  assert.equal(r?.tipo, "no");
  assert.ok(r && r.tipo === "no" && r.parcial);
  assert.equal(
    textoRecomendacion(r!),
    "Los miércoles no suelen salir vuelos de Valencia a Margarita entre las aerolíneas con días publicados. Suelen salir: lunes, martes, jueves y domingo. Si puede, mueva la fecha del vuelo; el asesor de boletería lo confirma.",
  );
});

test("un martes desde Valencia sí suelen volar", () => {
  const r = recomendacionDia(RUTAS, "VLN", "PMV", "2026-11-24");
  assert.equal(r?.tipo, "hay");
  assert.equal(textoRecomendacion(r!, "la ida"), "Para la ida: los martes suelen volar Turpial y Aeropostal de Valencia a Margarita.");
});

test("sin datos de la ruta o sin fecha no se recomienda nada", () => {
  assert.equal(recomendacionDia(RUTAS, "MAR", "PMV", "2026-11-25"), null);
  assert.equal(recomendacionDia(RUTAS, "PMV", "VLN", "2026-11-25"), null);
  assert.equal(recomendacionDia(RUTAS, "VLN", "PMV", ""), null);
  assert.equal(recomendacionDia([fila("VLN", "Valencia", "Conviasa", [])], "VLN", "PMV", "2026-11-25"), null);
});
