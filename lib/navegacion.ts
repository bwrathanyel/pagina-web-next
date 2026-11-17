// "Volver" sin salir del sitio. window.history.length cuenta también las
// páginas de otros sitios que la pestaña ya traía (llegar desde Google deja
// length > 1), así que no sirve para saber si hay a dónde volver dentro de
// Lotus. Se lleva una pila de rutas propias: volver a la penúltima la saca de
// la pila, así «atrás» hasta la página de entrada no deja historial fantasma.
// Si se equivoca (adelante a la misma ruta), cae al respaldo: nunca sale del sitio.

const CLAVE = "lotus:nav";
const TOPE = 50;

function leer(): string[] {
  try {
    const crudo = window.sessionStorage.getItem(CLAVE);
    const pila: unknown = crudo ? JSON.parse(crudo) : [];
    if (Array.isArray(pila)) return pila.filter((r): r is string => typeof r === "string");
  } catch {
    /* sessionStorage bloqueado o roto: se cuenta como pestaña nueva */
  }
  return [];
}

/** Llamar en cada cambio de ruta (lo hace el Navbar). Recargar la misma ruta no suma. */
export function registrarNavegacion(ruta: string): void {
  const pila = leer();
  if (pila[pila.length - 1] === ruta) return;
  if (pila[pila.length - 2] === ruta) pila.pop();
  else pila.push(ruta);
  try {
    window.sessionStorage.setItem(CLAVE, JSON.stringify(pila.slice(-TOPE)));
  } catch {
    /* sin almacenamiento: volverOIr cae al destino de respaldo */
  }
}

/** Hay al menos una ruta propia anterior a la actual en esta pestaña. */
export function hayHistorialInterno(): boolean {
  return leer().length > 1;
}

/** `router.back()` si hay historial interno; si no, `router.push(respaldo)`. */
export function volverOIr(router: { back: () => void; push: (href: string) => void }, respaldo: string): void {
  if (hayHistorialInterno()) router.back();
  else router.push(respaldo);
}
