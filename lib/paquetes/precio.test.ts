import assert from "node:assert/strict";
import { test } from "node:test";
import type { Tarifa } from "@/types/supabase";
import type { RutaVuelo } from "@/lib/cotizador/vuelo";
import { parsearEstado } from "@/lib/cotizador/estado";
import {
  destinoCotizador,
  enlaceCotizarPaquete,
  entradaInicial,
  estimarPaquete,
  fechasPaquete,
  limitarNoches,
  origenesValidos,
  tarifaInicial,
  tarifasDelPlan,
  vencido,
} from "./precio.ts";

const HOY = "2026-10-21"; // miércoles

const fila = (t: Partial<Tarifa> & { id: number }): Tarifa =>
  ({ precio_texto: "", precio_desde_usd: null, vigencia_texto: null, vigente: true, moneda: "USD", ...t }) as Tarifa;

const hab = (id: number, habitacion: string, dbl: number, extra: Partial<Tarifa> = {}) =>
  fila({
    id,
    titulo: "REGULAR",
    plan: "TODO INCLUIDO",
    habitacion,
    precios: { dbl, sgl: dbl * 1.5, tpl: dbl, chd_4_10: dbl / 2 },
    ventanas: [{ desde: "2026-09-01", hasta: "2027-03-31" }],
    ...extra,
  });

const TARIFAS = [hab(1, "SUPERIOR", 120), hab(2, "ESTANDAR", 90), hab(3, "ESTANDAR", 70, { plan: "SOLO DESAYUNO" })];

const ruta = (origen: string, destino: string, usd: number): RutaVuelo => ({
  origen_iata: origen,
  origen_nombre: origen,
  destino_iata: destino,
  destino_nombre: destino,
  ambito: "nacional",
  desde_usd: usd,
  ida_vuelta: true,
});
const RUTAS = [ruta("CCS", "PMV", 109), ruta("VLN", "PMV", 160), ruta("CCS", "LRV", 320)];

const FLEX = { fecha_entrada: null, fecha_salida: null, noches_min: 2, noches_default: 3, noches_max: 7 };
const FIJO = { fecha_entrada: "2026-12-22", fecha_salida: "2026-12-26", noches_min: 4, noches_default: 4, noches_max: 4 };
const DOS = { adultos: 2, edades: [], bebes: 0 };

test("orígenes: solo los que tienen ruta al destino y /cotizar sabe nombrar", () => {
  const o = origenesValidos({ vuelo_origenes: ["CCS", "VLN", "MAR", "CCS"], vuelo_destino_iata: "PMV" }, RUTAS);
  assert.deepEqual(o.map((x) => [x.iata, x.valor]), [["CCS", "Caracas"], ["VLN", "Valencia"]]);
  assert.deepEqual(origenesValidos({ vuelo_origenes: ["VLN"], vuelo_destino_iata: "LRV" }, RUTAS), []);
});

test("noches dentro del rango del paquete", () => {
  assert.equal(limitarNoches(FLEX, 1), 2);
  assert.equal(limitarNoches(FLEX, 30), 7);
  assert.equal(limitarNoches(FLEX, Number.NaN), 3);
});

test("entrada inicial: primer viernes a más de 20 días; la fija si hay", () => {
  const d = entradaInicial(FLEX, HOY);
  assert.equal(d, "2026-11-13");
  assert.equal(new Date(`${d}T00:00:00Z`).getUTCDay(), 5);
  assert.equal(entradaInicial(FIJO, HOY), "2026-12-22");
});

test("fechas fijas ignoran lo elegido; flexibles suman noches", () => {
  assert.deepEqual(fechasPaquete(FIJO, "2026-11-01", 2), { desde: "2026-12-22", hasta: "2026-12-26", noches: 4 });
  assert.deepEqual(fechasPaquete(FLEX, "2026-11-13", 4), { desde: "2026-11-13", hasta: "2026-11-17", noches: 4 });
  assert.deepEqual(fechasPaquete(FLEX, "2026-11-13", 12), { desde: "2026-11-13", hasta: "2026-11-20", noches: 7 });
});

test("salida fija vencida", () => {
  assert.equal(vencido(FIJO, "2026-12-23"), true);
  assert.equal(vencido(FIJO, "2026-12-22"), false);
  assert.equal(vencido(FLEX, "2030-01-01"), false);
});

test("plan del paquete, con respaldo a todas si el hotel no lo publica", () => {
  assert.deepEqual(tarifasDelPlan(TARIFAS, "Todo Incluido").map((t) => t.id), [1, 2]);
  assert.deepEqual(tarifasDelPlan(TARIFAS, "PENSION COMPLETA").map((t) => t.id), [1, 2, 3]);
  assert.deepEqual(tarifasDelPlan(TARIFAS, null).map((t) => t.id), [1, 2, 3]);
});

test("total = hotel + boletos, con la habitación más barata por defecto", () => {
  const plan = tarifasDelPlan(TARIFAS, "TODO INCLUIDO");
  const f = fechasPaquete(FLEX, entradaInicial(FLEX, HOY), 3);
  const t = tarifaInicial(plan, null, { ...f, viajeros: DOS });
  assert.equal(t?.id, 2);
  const e = estimarPaquete({ tarifa: t, tarifas: plan, ...f, viajeros: DOS, ruta: RUTAS[0], hoy: HOY });
  assert.ok(e.hotel.ok);
  // 109 * 1,2 = 131 por persona (más de 20 días: sin recargo de cercanía).
  assert.equal(e.vuelo.porPersona, 131);
  assert.equal(e.total, (e.hotel.ok ? e.hotel.total : 0) + 262);
  assert.equal(e.porPersona, Math.ceil(e.total! / 2));
});

test("vuelo cercano lleva recargo; bebés no suman asiento", () => {
  const plan = tarifasDelPlan(TARIFAS, "TODO INCLUIDO");
  const v = { adultos: 2, edades: [], bebes: 1 };
  const e = estimarPaquete({ tarifa: plan[1], tarifas: plan, desde: "2026-10-30", hasta: "2026-11-02", viajeros: v, ruta: RUTAS[0], hoy: HOY });
  assert.equal(e.vuelo.porPersona, Math.ceil(109 * 1.2 * 1.15));
  assert.equal(e.asientos, 2);
  assert.equal(e.vuelo.bebesSinCosto, true);
});

test("sin ruta o con hotel en euros no hay total", () => {
  const plan = tarifasDelPlan(TARIFAS, "TODO INCLUIDO");
  const f = { desde: "2026-11-13", hasta: "2026-11-16" };
  assert.equal(estimarPaquete({ tarifa: plan[1], tarifas: plan, ...f, viajeros: DOS, ruta: null, hoy: HOY }).total, null);
  const eur = [hab(9, "SUPERIOR", 100, { moneda: "EUR" })];
  const e = estimarPaquete({ tarifa: eur[0], tarifas: eur, ...f, viajeros: DOS, ruta: RUTAS[0], hoy: HOY });
  assert.ok(e.hotel.ok);
  assert.equal(e.total, null);
  assert.equal(e.vuelo.total, 262);
});

test("destino de /cotizar", () => {
  assert.equal(destinoCotizador("Margarita"), "Isla de Margarita");
  assert.equal(destinoCotizador("Los Roques"), "Los Roques");
  assert.equal(destinoCotizador("Caracas"), null);
});

test("el enlace a /cotizar llega con todo precargado", () => {
  const url = enlaceCotizarPaquete({
    hotelId: 254,
    hotelDestino: "Margarita",
    vueloDestinoIata: "PMV",
    origen: "Valencia",
    desde: "2026-12-22",
    hasta: "2026-12-26",
    viajeros: { adultos: 2, edades: [7], bebes: 1 },
    tarifaId: 99,
  });
  assert.ok(url.startsWith("/cotizar?"));
  const e = parsearEstado(Object.fromEntries(new URLSearchParams(url.slice(9))), HOY);
  assert.deepEqual(e.servicios, ["hospedaje", "vuelo"]);
  assert.equal(e.destino, "Isla de Margarita");
  assert.equal(e.desde, "2026-12-22");
  assert.equal(e.hasta, "2026-12-26");
  assert.equal(e.adultos, 2);
  assert.deepEqual(e.edades, [7]);
  assert.equal(e.bebes, 1);
  assert.equal(e.hotel, 254);
  assert.equal(e.tarifa, 99);
  assert.equal(e.origen, "Valencia");
  assert.equal(e.vueloDestino, "PMV");
});
