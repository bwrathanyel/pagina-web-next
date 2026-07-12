export type TipoCotizacion = "fullday" | "hospedaje" | "boleteria" | "paquete";

export interface OpcionCampo {
  value: string;
  label: string;
  desc?: string;
  emoji?: string;
}

export type CampoTipo =
  | "cards"
  | "tags"
  | "select"
  | "date"
  | "text"
  | "tel"
  | "textarea"
  | "number"
  | "slider"
  | "checkbox";

export type Respuestas = Record<string, string | number | boolean | string[] | undefined>;

export interface CampoDef {
  key: string;
  label: string;
  tipo: CampoTipo;
  opciones?: OpcionCampo[];
  placeholder?: string;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  default?: string | number | boolean | string[];
  hint?: string;
  multiple?: boolean;
  condicion?: (respuestas: Respuestas) => boolean;
}

export interface PasoDef {
  titulo: string;
  campos: CampoDef[];
}
