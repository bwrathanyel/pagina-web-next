export interface Pais {
  /** ISO 3166-1 alfa-2, minúsculas (nombre del archivo de la bandera). */
  iso: string;
  nombre: string;
  /** Código de marcación sin "+". */
  codigo: string;
}

export const PAIS_POR_DEFECTO = "ve";

export const PAISES: Pais[] = [
  { iso: "ve", nombre: "Venezuela", codigo: "58" },
  { iso: "co", nombre: "Colombia", codigo: "57" },
  { iso: "us", nombre: "Estados Unidos", codigo: "1" },
  { iso: "es", nombre: "España", codigo: "34" },
  { iso: "pa", nombre: "Panamá", codigo: "507" },
  { iso: "mx", nombre: "México", codigo: "52" },
  { iso: "ar", nombre: "Argentina", codigo: "54" },
  { iso: "cl", nombre: "Chile", codigo: "56" },
  { iso: "pe", nombre: "Perú", codigo: "51" },
  { iso: "ec", nombre: "Ecuador", codigo: "593" },
  { iso: "br", nombre: "Brasil", codigo: "55" },
  { iso: "uy", nombre: "Uruguay", codigo: "598" },
  { iso: "py", nombre: "Paraguay", codigo: "595" },
  { iso: "bo", nombre: "Bolivia", codigo: "591" },
  { iso: "cr", nombre: "Costa Rica", codigo: "506" },
  { iso: "do", nombre: "República Dominicana", codigo: "1" },
  { iso: "pr", nombre: "Puerto Rico", codigo: "1" },
  { iso: "cu", nombre: "Cuba", codigo: "53" },
  { iso: "gt", nombre: "Guatemala", codigo: "502" },
  { iso: "hn", nombre: "Honduras", codigo: "504" },
  { iso: "sv", nombre: "El Salvador", codigo: "503" },
  { iso: "ni", nombre: "Nicaragua", codigo: "505" },
  { iso: "ca", nombre: "Canadá", codigo: "1" },
  { iso: "aw", nombre: "Aruba", codigo: "297" },
  { iso: "cw", nombre: "Curazao", codigo: "599" },
  { iso: "tt", nombre: "Trinidad y Tobago", codigo: "1" },
  { iso: "pt", nombre: "Portugal", codigo: "351" },
  { iso: "it", nombre: "Italia", codigo: "39" },
  { iso: "fr", nombre: "Francia", codigo: "33" },
  { iso: "de", nombre: "Alemania", codigo: "49" },
  { iso: "gb", nombre: "Reino Unido", codigo: "44" },
  { iso: "nl", nombre: "Países Bajos", codigo: "31" },
  { iso: "ch", nombre: "Suiza", codigo: "41" },
  { iso: "ae", nombre: "Emiratos Árabes Unidos", codigo: "971" },
  { iso: "il", nombre: "Israel", codigo: "972" },
  { iso: "au", nombre: "Australia", codigo: "61" },
];

export function buscarPais(iso: string): Pais {
  return PAISES.find((p) => p.iso === iso) ?? PAISES[0];
}

/** Devuelve el número en formato internacional ("+584121234567") o null si
 * no parece un teléfono. Quita el "0" de troncal que se marca en local
 * (0412… en Venezuela) porque WhatsApp/E.164 no lo lleva. */
export function telefonoInternacional(pais: Pais, nacional: string): string | null {
  if (!/^[+\d\s().-]+$/.test(nacional.trim())) return null;
  let digitos = nacional.replace(/\D/g, "");
  if (nacional.trim().startsWith("+")) {
    // Ya viene con código de país propio: se respeta tal cual.
    return digitos.length >= 8 && digitos.length <= 15 ? `+${digitos}` : null;
  }
  digitos = digitos.replace(/^0+/, "");
  if (digitos.startsWith(pais.codigo) && digitos.length > pais.codigo.length + 6) {
    digitos = digitos.slice(pais.codigo.length);
  }
  if (digitos.length < 6 || pais.codigo.length + digitos.length > 15) return null;
  return `+${pais.codigo}${digitos}`;
}
