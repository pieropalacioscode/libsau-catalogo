// Árbol de categorías (máx. 2 niveles). Módulo puro: sin React ni Next.
import type { Category } from "@/types";

export type ChipView = {
  chips: Category[]; // categorías a mostrar como chips
  allSlug?: string; // a dónde lleva "Todas" (undefined = al inicio)
  allActive: boolean;
};

// Raíz => los grupos. Dentro de un grupo (o de una hoja) => las hijas de ese grupo.
// Sin jerarquía (LIBPREP) => igual que siempre: todas las categorías planas.
export function chipView(all: Category[], contextual: Category[], current?: Category): ChipView {
  let group: Category | undefined;
  if (current) {
    const parent = current.parent_slug ? all.find((c) => c.slug === current.parent_slug) : undefined;
    group = parent ?? (all.some((c) => c.parent_slug === current.slug) ? current : undefined);
  }
  const groupSlug = group?.slug ?? null;
  return {
    chips: contextual.filter((c) => (c.parent_slug ?? null) === groupSlug),
    allSlug: group?.slug,
    allActive: group ? current?.slug === group.slug : !current,
  };
}

// Cada grupo seguido de sus hijas. Una categoría cuyo padre no está en la lista cuenta como raíz.
export function orderTree(cats: Category[]): Array<{ cat: Category; depth: 0 | 1 }> {
  const slugs = new Set(cats.map((c) => c.slug));
  const out: Array<{ cat: Category; depth: 0 | 1 }> = [];
  for (const r of cats.filter((c) => !c.parent_slug || !slugs.has(c.parent_slug))) {
    out.push({ cat: r, depth: 0 });
    for (const ch of cats.filter((c) => c.parent_slug === r.slug)) out.push({ cat: ch, depth: 1 });
  }
  return out;
}
