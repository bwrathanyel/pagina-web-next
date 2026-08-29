export type ProductoTipo = "hotel" | "destino" | "paquete" | "info";

export interface Foto {
  id: number;
  storage_path: string;
  orden: number;
  es_principal: boolean;
  activo: boolean;
  width?: number | null;
  height?: number | null;
  // 'ia_referencial' = generada por IA cuando el producto no tenía NINGUNA
  // foto real -- muestra el badge "Imagen referencial" en la tarjeta (ver
  // CardPhotoGallery). Nunca reemplaza una foto real existente.
  origen?: string | null;
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
  fecha_fin_estimada: string | null;
  /** Fecha límite de venta. La web filtra vigencia de Hot Sales por este campo
   * junto con fecha_fin_estimada (ver lib/promociones/hotSales.ts promoVigente). */
  fecha_venta_fin: string | null;
  /** Espejo de SOLO LECTURA del eje manual de Hot Sales (catalogo_boost.hot_sale
   * / orden_manual). Lo escribe recalcular_catalogo_score() en la base; nunca se
   * edita desde acá. 'poner' fuerza la promo al pool sin dedup ni mínimo de
   * fotos; 'quitar' la excluye; null = la decide el ranking. */
  hot_sale_estado: "poner" | "quitar" | null;
  hot_sale_orden: number | null;
  ninos_gratis_cantidad: number | null;
  incluye_tags: string[];
  /** Score de rendimiento (Hot Sales), recalculado a diario por el cron
   * catalogo-score. La lista de promociones viene ordenada por este campo. */
  score: number;
  /** Descripción corta de largo parejo para las tarjetas, generada una vez por
   * generar-resumenes-promos y guardada. Nunca trae precios (ver la migración
   * 20260726180000). */
  resumen_ia: string | null;
  producto:
    | { id: number; tipo: ProductoTipo; nombre: string; destino: string | null; producto_fotos: Foto[] }
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
