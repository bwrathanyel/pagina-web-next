// Borrador de "Arme su viaje" en localStorage: el cliente vuelve y retoma. Todo
// acceso va en try/catch (modo privado, cuota, storage bloqueado) y la página
// funciona igual sin él. Puro y sin imports para probarlo con `node --test`.

export const CLAVE_BORRADOR = "lotus:cotizador:borrador:v1";
const VIGENCIA_MS = 7 * 24 * 60 * 60 * 1000;

type Almacen = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export interface ContactoBorrador {
  nombre: string;
  telefono: string;
  correo: string;
  notas: string;
}

export interface Borrador {
  /** Estado del viaje serializado como en la URL (serializarEstado). */
  q: string;
  contacto: ContactoBorrador;
  guardado: number;
}

export function almacenLocal(): Almacen | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

const texto = (v: unknown) => (typeof v === "string" ? v.slice(0, 1000) : "");

export function leerBorrador(almacen: Almacen | null, ahora = Date.now()): Borrador | null {
  try {
    const crudo = almacen?.getItem(CLAVE_BORRADOR);
    if (!crudo) return null;
    const b = JSON.parse(crudo) as Partial<Borrador> | null;
    if (!b || typeof b.q !== "string" || typeof b.guardado !== "number" || ahora - b.guardado > VIGENCIA_MS) {
      almacen?.removeItem(CLAVE_BORRADOR);
      return null;
    }
    const c = (b.contacto ?? {}) as Partial<ContactoBorrador>;
    return {
      q: b.q,
      guardado: b.guardado,
      contacto: { nombre: texto(c.nombre), telefono: texto(c.telefono), correo: texto(c.correo), notas: texto(c.notas) },
    };
  } catch {
    return null;
  }
}

export function guardarBorrador(almacen: Almacen | null, q: string, contacto: ContactoBorrador, ahora = Date.now()) {
  try {
    almacen?.setItem(CLAVE_BORRADOR, JSON.stringify({ q, contacto, guardado: ahora } satisfies Borrador));
  } catch {
    // Sin espacio o bloqueado: el borrador es una comodidad, no un requisito.
  }
}

export function borrarBorrador(almacen: Almacen | null) {
  try {
    almacen?.removeItem(CLAVE_BORRADOR);
  } catch {
    // Igual que al guardar.
  }
}

/** Hay algo que valga la pena retomar: el cliente eligió hotel, fechas o tours,
 * o empezó a dejar sus datos. Un estado recién abierto no se guarda. */
export function borradorUtil(q: string, contacto: ContactoBorrador): boolean {
  const p = new URLSearchParams(q);
  return !!(p.get("fecha") || p.get("hotel") || p.get("tour") || p.get("vuelo_ida") || contacto.nombre.trim() || contacto.telefono.trim());
}
