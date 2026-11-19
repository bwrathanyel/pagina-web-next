// Slug público de un hotel en /reservar/<slug>. Se deriva del nombre (no hay columna): sin tildes, en
// minúsculas, con guiones. Si dos hoteles dieran el mismo slug, ambos llevan su id al final para que
// ninguno pise al otro.
export function slugHotel(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/&/g, " y ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

export interface MapaSlugs {
  porId: Map<number, string>;
  porSlug: Map<string, number>;
}

export function mapaSlugs(hoteles: { id: number; nombre: string }[]): MapaSlugs {
  const base = hoteles.map((h) => ({ id: h.id, slug: slugHotel(h.nombre) || String(h.id) }));
  const cuenta = new Map<string, number>();
  for (const b of base) cuenta.set(b.slug, (cuenta.get(b.slug) ?? 0) + 1);
  const porId = new Map<number, string>();
  const porSlug = new Map<string, number>();
  for (const b of base) {
    const slug = (cuenta.get(b.slug) ?? 0) > 1 ? `${b.slug}-${b.id}` : b.slug;
    porId.set(b.id, slug);
    porSlug.set(slug, b.id);
  }
  return { porId, porSlug };
}
