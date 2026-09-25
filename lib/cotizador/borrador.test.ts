import assert from "node:assert/strict";
import { test } from "node:test";
import { borradorUtil, borrarBorrador, CLAVE_BORRADOR, guardarBorrador, leerBorrador } from "./borrador.ts";

const VACIO = { nombre: "", telefono: "", correo: "", notas: "" };

function almacenFalso(datos: Record<string, string> = {}) {
  return {
    getItem: (k: string) => datos[k] ?? null,
    setItem: (k: string, v: string) => void (datos[k] = v),
    removeItem: (k: string) => void delete datos[k],
    datos,
  };
}

test("guarda y lee el borrador", () => {
  const a = almacenFalso();
  guardarBorrador(a, "servicios=hospedaje&hotel=254", { ...VACIO, nombre: "Ana" }, 1000);
  assert.deepEqual(leerBorrador(a, 2000), { q: "servicios=hospedaje&hotel=254", guardado: 1000, contacto: { ...VACIO, nombre: "Ana" } });
});

test("un borrador de más de 7 días se descarta y se borra", () => {
  const a = almacenFalso();
  guardarBorrador(a, "hotel=1", VACIO, 0);
  assert.equal(leerBorrador(a, 8 * 24 * 3600 * 1000), null);
  assert.equal(a.datos[CLAVE_BORRADOR], undefined);
});

test("JSON roto o forma inválida no rompe", () => {
  assert.equal(leerBorrador(almacenFalso({ [CLAVE_BORRADOR]: "{no es json" })), null);
  assert.equal(leerBorrador(almacenFalso({ [CLAVE_BORRADOR]: JSON.stringify({ q: 5 }) })), null);
  assert.equal(leerBorrador(null), null);
});

test("un storage que lanza no rompe ni al leer, guardar ni borrar", () => {
  const roto = {
    getItem: () => {
      throw new Error("bloqueado");
    },
    setItem: () => {
      throw new Error("cuota");
    },
    removeItem: () => {
      throw new Error("bloqueado");
    },
  };
  assert.equal(leerBorrador(roto), null);
  assert.doesNotThrow(() => guardarBorrador(roto, "hotel=1", VACIO));
  assert.doesNotThrow(() => borrarBorrador(roto));
});

test("solo vale guardar si hay algo elegido o datos", () => {
  assert.equal(borradorUtil("servicios=hospedaje&destino=Morrocoy&adultos=2", VACIO), false);
  assert.equal(borradorUtil("servicios=hospedaje&fecha=2026-10-12", VACIO), true);
  assert.equal(borradorUtil("servicios=hospedaje", { ...VACIO, telefono: "0412" }), true);
});
