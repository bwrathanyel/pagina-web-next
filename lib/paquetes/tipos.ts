import type { HabitacionWeb } from "@/lib/cotizador/hotel";
import type { Tarifa } from "@/types/supabase";

/** Hotel precargado de un paquete, ya listo para pintar (fotos resueltas). */
export interface HotelPaquete {
  id: number;
  nombre: string;
  destino: string | null;
  descripcion: string | null;
  tarifaDestacadaId: number | null;
  /** Solo filas vendibles hoy. */
  tarifas: Tarifa[];
  /** Fotos del hotel sin las de habitaciones: fachada, piscina, áreas comunes. */
  fotos: string[];
  habitaciones: HabitacionWeb[];
}

/** Una fila de `paquetes` (migración 20261021150000 del repo CRM) con su hotel. */
export interface Paquete {
  id: number;
  slug: string;
  titulo: string;
  etiqueta: string | null;
  descripcion: string | null;
  notas: string | null;
  plan: string | null;
  vuelo_destino_iata: string;
  vuelo_origenes: string[];
  /** Con las dos fechas es una salida fija; sin ellas el cliente elige. */
  fecha_entrada: string | null;
  fecha_salida: string | null;
  noches_min: number;
  noches_default: number;
  noches_max: number;
  incluye: string[];
  orden: number;
  hotel: HotelPaquete;
}
