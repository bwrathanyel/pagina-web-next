export interface Asesor {
  nombre: string;
  telefono: string;
  peso: number;
}

/** Pool ponderado — port 1:1 de assets/common.js. peso = probabilidad
 * relativa. Boletería usa su propio contacto único, no este pool
 * (confirmado intencional por el usuario, ver ASESOR_BOLETERIA). */
export const ASESORES: Asesor[] = [
  { nombre: "Ambar Arévalo", telefono: "584244900601", peso: 3 },
  { nombre: "Nicoll Osorio", telefono: "584127136169", peso: 2 },
  { nombre: "Eudys Chourio", telefono: "584147020527", peso: 1 },
  { nombre: "Arquímedes Arévalo", telefono: "584128905774", peso: 1 },
  { nombre: "Luis Rueda", telefono: "584244269876", peso: 1 },
  { nombre: "Andric Arévalo", telefono: "584140415685", peso: 1 },
];

export const ASESOR_BOLETERIA: Asesor = { nombre: "Luis Rueda", telefono: "584244269876" } as Asesor;

export function elegirAsesor(): Asesor {
  const total = ASESORES.reduce((s, a) => s + a.peso, 0);
  const r = Math.random() * total;
  let acumulado = 0;
  for (const a of ASESORES) {
    acumulado += a.peso;
    if (r < acumulado) return a;
  }
  return ASESORES[ASESORES.length - 1];
}

export function asesorPorNombre(nombre: string | null | undefined): Asesor | null {
  if (!nombre) return null;
  const normalizado = nombre.trim().toLocaleLowerCase("es-VE");
  return ASESORES.find((asesor) => asesor.nombre.toLocaleLowerCase("es-VE") === normalizado) ?? null;
}
