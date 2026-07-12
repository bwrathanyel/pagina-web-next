import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ItemCarrito {
  /** Compuesto: "producto-{id}" | "promocion-{id}" — evita colisión entre
   * ambos espacios de id, que son independientes en la base. */
  key: string;
  tipo: "producto" | "promocion";
  id: number;
  nombre: string;
  destino: string | null;
  fotoUrl: string | null;
  precioLabel: string;
  href: string;
}

interface CarritoState {
  items: ItemCarrito[];
  agregar: (item: ItemCarrito) => void;
  quitar: (key: string) => void;
  limpiar: () => void;
  tieneItem: (key: string) => boolean;
}

export const useCarritoStore = create<CarritoState>()(
  persist(
    (set, get) => ({
      items: [],
      agregar: (item) =>
        set((s) => (s.items.some((i) => i.key === item.key) ? s : { items: [...s.items, item] })),
      quitar: (key) => set((s) => ({ items: s.items.filter((i) => i.key !== key) })),
      limpiar: () => set({ items: [] }),
      tieneItem: (key) => get().items.some((i) => i.key === key),
    }),
    { name: "lotus360-carrito" },
  ),
);

/** true si hay al menos una promoción en el carrito — el flujo de
 * cotización usa esto para saltar destino/presupuesto/alojamiento. */
export function carritoTienePromocion(items: ItemCarrito[]): boolean {
  return items.some((i) => i.tipo === "promocion");
}
