import { create } from "zustand";

// Estado de los paneles globales (carrito, buscador y cuenta). Los abren
// botones que viven en lugares distintos (header móvil, header de escritorio,
// barra inferior, ⌘K) pero cada panel se monta una sola vez en el layout.
interface Paneles {
  carritoAbierto: boolean;
  buscadorAbierto: boolean;
  cuentaAbierta: boolean;
  abrirCarrito: () => void;
  cerrarCarrito: () => void;
  abrirCuenta: () => void;
  cerrarCuenta: () => void;
  abrirBuscador: () => void;
  cerrarBuscador: () => void;
  alternarBuscador: () => void;
}

export const usePaneles = create<Paneles>()((set) => ({
  carritoAbierto: false,
  buscadorAbierto: false,
  cuentaAbierta: false,
  abrirCarrito: () => set({ carritoAbierto: true }),
  cerrarCarrito: () => set({ carritoAbierto: false }),
  abrirCuenta: () => set({ cuentaAbierta: true }),
  cerrarCuenta: () => set({ cuentaAbierta: false }),
  abrirBuscador: () => set({ buscadorAbierto: true }),
  cerrarBuscador: () => set({ buscadorAbierto: false }),
  alternarBuscador: () => set((s) => ({ buscadorAbierto: !s.buscadorAbierto })),
}));
