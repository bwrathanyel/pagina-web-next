export type ProductoTipo = "hotel" | "destino" | "paquete" | "info";

export interface Foto {
  id: number;
  storage_path: string;
  orden: number;
  es_principal: boolean;
  activo: boolean;
  width?: number | null;
  height?: number | null;
}

export interface Tarifa {
  precio_texto: string;
  precio_desde_usd: number | null;
  vigencia_texto: string | null;
  vigente: boolean;
}

export interface Producto {
  id: number;
  tipo: ProductoTipo;
  nombre: string;
  destino: string | null;
  descripcion: string | null;
  requisitos: string | null;
  tarifas: Tarifa[];
  producto_fotos: Foto[];
}

export interface Promocion {
  id: number;
  titulo: string;
  precio_texto: string | null;
  precio_desde_usd: number | null;
  vigencia_texto: string | null;
  ninos_gratis_cantidad: number | null;
  incluye_tags: string[];
  producto:
    | { id: number; nombre: string; destino: string | null; producto_fotos: Foto[] }
    | null;
  promocion_fotos: Foto[];
}

/** Categorías públicas del catálogo — mapeo confirmado contra datos reales,
 * ver plan de migración: 'destino' agrupa guías/tours (nombres incluyen
 * "Guía de viaje", "Tour", paquetes internacionales), no es un typo de 'hotel'. */
export type Categoria = "hoteles" | "paquetes" | "guias-tours" | "promociones";

export const CATEGORIA_A_TIPO: Record<Exclude<Categoria, "promociones">, ProductoTipo> = {
  hoteles: "hotel",
  paquetes: "paquete",
  "guias-tours": "destino",
};

// Promociones primero a propósito: es lo primero que debe ver el usuario
// al entrar al catálogo, Hoteles pasa a segundo lugar.
export const CATEGORIAS: { slug: Categoria; label: string }[] = [
  { slug: "promociones", label: "Promociones" },
  { slug: "hoteles", label: "Hoteles" },
  { slug: "paquetes", label: "Paquetes" },
  { slug: "guias-tours", label: "Guías / Tours" },
];
