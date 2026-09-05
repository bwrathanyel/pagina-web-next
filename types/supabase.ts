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

/** Ventana de disfrute. Una tarifa puede tener varias (MALOKA REGULAR trae 3):
 * mostrar solo la última hace perder dos temporadas vendibles. */
export interface VentanaTarifa {
  desde?: string | null;
  hasta?: string | null;
}

/** El recuadro azul del PDF: las condiciones de un hotel + plan, compartidas
 * por todas las tarifas de ese plan (migración 20260903170000). No es
 * decoración: el suplemento obligatorio y el mínimo de noches cambian lo que
 * paga el cliente. */
export interface TarifarioBloque {
  id: number;
  plan: string | null;
  base_precio: "habitacion" | "persona" | null;
  incluye: string[] | null;
  check_in: string | null;
  check_out: string | null;
  ocupacion: { lineas?: string[] } | null;
  ninos: {
    politica?: string | null;
    gratis_hasta?: number | null;
    chd_desde?: number | null;
    chd_hasta?: number | null;
  } | null;
  suplementos:
    | {
        temporada?: string | null;
        adt?: number | null;
        chd?: number | null;
        texto?: string | null;
        obligatorio?: boolean | null;
      }[]
    | null;
  minimo_noches: Record<string, number> | null;
  impuestos: { iva_incluido?: boolean | null; igtf_pct?: number | null } | null;
  otras: string[] | null;
}

/** Una fila de `tarifas` = UNA promoción (una línea del PDF, o un flyer con
 * `origen='flyer'` desde la Fase 5 paso 4). Los campos estructurados los
 * escribe la carga maestra: mientras esa carga no corra vienen NULL y todo cae
 * a `precio_texto` / `vigencia_texto`, que es como se ve hoy. */
export interface Tarifa {
  id: number;
  precio_texto: string;
  precio_desde_usd: number | null;
  vigencia_texto: string | null;
  vigente: boolean;
  moneda?: string | null;
  titulo?: string | null;
  plan?: string | null;
  habitacion?: string | null;
  /** Precios etiquetados por ocupación: las claves las trae el encabezado de
   * cada tabla del PDF (`chd_4_11` en un hotel, `chd_5_9` en otro), más
   * `base: 'habitacion' | 'persona'` cuando el PDF la declara. */
  precios?: Record<string, string | number | null> | null;
  venta_desde?: string | null;
  venta_hasta?: string | null;
  disfrute_desde?: string | null;
  fecha_fin?: string | null;
  fecha_venta_fin?: string | null;
  minimo_noches?: number | null;
  condiciones?: string[] | null;
  ventanas?: VentanaTarifa[] | null;
  orden_pdf?: number | null;
  origen?: string | null;
  /** Descripción corta generada por generar-resumenes-promos (backfill sobre
   * `tarifas` directo, no solo flyers). Nunca trae precios. */
  resumen_ia?: string | null;
  tarifario_bloques?: TarifarioBloque | TarifarioBloque[] | null;
}

export interface Producto {
  id: number;
  tipo: ProductoTipo;
  nombre: string;
  destino: string | null;
  descripcion: string | null;
  requisitos: string | null;
  /** Columna computada de PostgREST (migración 20260904160000): la elige la
   * BASE — la más barata por persona que se pueda vender hoy — para que el CRM,
   * la web y el bot destaquen la MISMA promoción del hotel. */
  tarifa_destacada_id?: number | null;
  tarifas: Tarifa[];
  producto_fotos: Foto[];
}

export interface Promocion {
  id: number;
  titulo: string;
  precio_texto: string | null;
  precio_desde_usd: number | null;
  vigencia_texto: string | null;
  /** Campos estructurados de la fila `tarifas` (NULL en flyers y en líneas PDF
   * sin repaso). `precios` usa el mismo shape que Tarifa.precios. */
  precios?: Record<string, string | number | null> | null;
  plan?: string | null;
  moneda?: string | null;
  habitacion?: string | null;
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
