import { create } from "zustand";

// Estado de los paneles globales (carrito y buscador). Los abren botones que
// viven en lugares distintos (header móvil, header de escritorio, ⌘K) pero cada
// panel se monta una sola vez en el layout.
interface Paneles {
  carritoAbierto: boolean;
  buscadorAbierto: boolean;
  abrirCarrito: () => void;
  cerrarCarrito: () => void;
  abrirBuscador: () => void;
  cerrarBuscador: () => void;
  alternarBuscador: () => void;
}

export const usePaneles = create<Paneles>()((set) => ({
  carritoAbierto: false,
  buscadorAbierto: false,
  abrirCarrito: () => set({ carritoAbierto: true }),
  cerrarCarrito: () => set({ carritoAbierto: false }),
  abrirBuscador: () => set({ buscadorAbierto: true }),
  cerrarBuscador: () => set({ buscadorAbierto: false }),
  alternarBuscador: () => set((s) => ({ buscadorAbierto: !s.buscadorAbierto })),
}));
