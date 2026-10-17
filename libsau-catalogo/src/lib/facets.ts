// Preparación de las facetas para el panel de filtros. Módulo puro: se prueba con `npm test`.
import type { CatalogState } from "./catalog-query";

export type FacetValueLike = { value: string; count: number };
export type FacetAttributeLike = { name: string; values: FacetValueLike[] };
export type FacetGroup = { name: string; label: string; values: FacetValueLike[]; selected: number };
type Opts = { hide: string[]; order: string[]; labels: Record<string, string> };

const has = (o: object, k: string) => Object.prototype.hasOwnProperty.call(o, k);

// Filtros activos: cada valor elegido cuenta 1 y el rango de precio cuenta 1 en total.
export function activeFilterCount(s: CatalogState): number {
  let n = 0;
  for (const name of Object.keys(s.filters)) n += s.filters[name].length;
  if (s.minPrice !== null || s.maxPrice !== null) n += 1;
  return n;
}

export const hasPriceRange = (p: { min: number; max: number }) => p.max > p.min;

// Orden de la configuración primero, el resto en el orden de la API. Un valor elegido
// que ya no aparece (cero coincidencias con los demás filtros) se conserva con conteo 0
// para que al aplicar no se pierda sin avisar.
export function prepareFacets(attrs: FacetAttributeLike[], state: CatalogState, opts: Opts): FacetGroup[] {
  const hidden = new Set(opts.hide);
  const rank = (name: string) => {
    const i = opts.order.indexOf(name);
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };
  return attrs
    .filter((a) => !hidden.has(a.name))
    .map((a, i) => ({ a, i }))
    .sort((x, y) => rank(x.a.name) - rank(y.a.name) || x.i - y.i)
    .map(({ a }) => {
      const picked = has(state.filters, a.name) ? state.filters[a.name] : [];
      const known = new Set(a.values.map((v) => v.value));
      const missing = picked.filter((v) => !known.has(v)).map((v) => ({ value: v, count: 0 }));
      return {
        name: a.name,
        label: has(opts.labels, a.name) ? opts.labels[a.name] : a.name,
        values: [...a.values, ...missing],
        selected: picked.length,
      };
    });
}
