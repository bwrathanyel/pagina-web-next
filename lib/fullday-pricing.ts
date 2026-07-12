export type PoliticaNinos = "precio_fijo_nino" | "gratis" | "descuento_pct" | "consultar";

export interface FulldayRegla {
  adultoUsd: number;
  ninoUsd?: number;
  ninoEdadTexto?: string;
  ninosPolicy: { tipo: PoliticaNinos };
  emoji: string;
  nota?: string;
}

/** Port 1:1 de assets/cart.js FULLDAY_PRECIO_RULES — única fuente de
 * verdad de precio/política de niños para estos productos. No viene de
 * Supabase (tarifas.precio_desde_usd ahí es solo estimado best-effort
 * para hospedaje). Mantener sincronizado a mano si el negocio cambia
 * precios — igual que el comentario original en cart.js. */
export const FULLDAY_PRECIO_RULES: Record<string, FulldayRegla> = {
  "Coche Express (Sunsol)": {
    adultoUsd: 89,
    ninoUsd: 45,
    ninoEdadTexto: "4-10 años",
    ninosPolicy: { tipo: "precio_fijo_nino" },
    emoji: "🏝️",
  },
  "Daypass Ecoland (Sunsol)": {
    adultoUsd: 72,
    ninoUsd: 36,
    ninoEdadTexto: "4-10 años",
    ninosPolicy: { tipo: "precio_fijo_nino" },
    emoji: "🌴",
  },
  "Daypass Unik (Sunsol Unik Luxury Hotel)": {
    adultoUsd: 50,
    ninoUsd: 25,
    ninoEdadTexto: "4-10 años",
    ninosPolicy: { tipo: "precio_fijo_nino" },
    emoji: "✨",
  },
  "Daypass Isla Caribe (Sunsol)": {
    adultoUsd: 59,
    ninoUsd: 30,
    ninoEdadTexto: "4-10 años",
    ninosPolicy: { tipo: "precio_fijo_nino" },
    emoji: "🏖️",
  },
  "Full Day Sparta Tours - Vamos a Cubagua": {
    adultoUsd: 59,
    ninoUsd: 30,
    ninoEdadTexto: "4-10 años",
    ninosPolicy: { tipo: "precio_fijo_nino" },
    emoji: "🚤",
    nota: "Modalidad Full Day",
  },
  "Pool Day Costa Caribe": {
    adultoUsd: 40,
    ninoUsd: 40,
    ninosPolicy: { tipo: "precio_fijo_nino" },
    emoji: "🏊",
    nota: "Precio único por persona",
  },
  "Viola Festival - Vive Coche (Sunsol)": {
    adultoUsd: 89,
    ninoUsd: 45,
    ninoEdadTexto: "4-10 años",
    ninosPolicy: { tipo: "precio_fijo_nino" },
    emoji: "🎉",
    nota: "Solo fechas de festival",
  },
};

export function esFullDayExacto(nombreProducto: string): boolean {
  return nombreProducto in FULLDAY_PRECIO_RULES;
}

export function calcularTotalFullDay(
  nombreProducto: string,
  adultos: number,
  ninos: number,
): { totalUsd: number; detalleTexto: string } | null {
  const regla = FULLDAY_PRECIO_RULES[nombreProducto];
  if (!regla) return null;

  const totalAdultos = adultos * regla.adultoUsd;
  const totalNinos = ninos > 0 && regla.ninoUsd != null ? ninos * regla.ninoUsd : 0;
  const totalUsd = totalAdultos + totalNinos;

  const partes = [`${adultos} adultos × $${regla.adultoUsd}`];
  if (ninos > 0 && regla.ninoUsd != null) {
    partes.push(`${ninos} niños × $${regla.ninoUsd}`);
  }
  return { totalUsd, detalleTexto: partes.join(" + ") };
}
