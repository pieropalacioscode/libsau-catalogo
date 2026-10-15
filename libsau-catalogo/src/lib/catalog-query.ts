// Estado del catálogo <-> URL. Módulo puro (sin React ni Next): se prueba con `npm test`.
// Parámetros: q, f (repetible, "Atributo:Valor"), precio_min, precio_max, orden, pagina.
// La categoría NO va aquí: es parte de la ruta (/categoria/<slug>).

export const SORT_KEYS = ["relevance", "name", "price_asc", "price_desc", "newest"] as const;
export type SortKey = (typeof SORT_KEYS)[number];

export type RawSearchParams = Record<string, string | string[] | undefined>;

export type CatalogState = {
  q: string;
  page: number;
  sort: SortKey | null;
  filters: Record<string, string[]>;
  minPrice: number | null;
  maxPrice: number | null;
};

// Mismos topes que la API (public_filters.go): lo que sobra se descarta aquí
// en vez de provocar un 400.
export const LIMITS = {
  q: 100,
  groups: 6,
  values: 10,
  name: 100,
  value: 200,
  page: 100000,
  price: 10_000_000,
} as const;

const KEYS = ["q", "f", "precio_min", "precio_max", "orden", "pagina"] as const;

const newFilters = () => Object.create(null) as Record<string, string[]>;

export function emptyState(): CatalogState {
  return { q: "", page: 1, sort: null, filters: newFilters(), minPrice: null, maxPrice: null };
}

const list = (v: string | string[] | undefined): string[] =>
  v === undefined ? [] : Array.isArray(v) ? v : [v];

const isSortKey = (s: string): s is SortKey => (SORT_KEYS as readonly string[]).includes(s);

const chars = (s: string) => [...s].length;

function normalizeQuery(v: string | undefined): string {
  const s = (v ?? "").replace(/\s+/g, " ").trim();
  return [...s].slice(0, LIMITS.q).join("").trim();
}

function parsePage(values: string[]): number {
  const v = values[0]?.trim();
  if (!v || !/^\d+$/.test(v)) return 1;
  const n = Number(v);
  return n >= 1 && n <= LIMITS.page ? n : 1;
}

function parsePrice(values: string[]): number | null {
  const v = values[0]?.trim();
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n <= LIMITS.price ? n : null;
}

function parseFilters(values: string[]): Record<string, string[]> {
  const out = newFilters();
  for (const raw of values) {
    const i = raw.indexOf(":"); // igual que la API: se corta en el primer ':'
    if (i < 0) continue;
    const name = raw.slice(0, i).trim();
    const value = raw.slice(i + 1).trim();
    if (!name || !value || chars(name) > LIMITS.name || chars(value) > LIMITS.value) continue;
    if (!(name in out)) {
      if (Object.keys(out).length >= LIMITS.groups) continue;
      out[name] = [];
    }
    if (out[name].length >= LIMITS.values || out[name].includes(value)) continue;
    out[name].push(value);
  }
  return out;
}

type Pair = [string, string];

// Forma canónica del estado: siempre el mismo orden y valores ordenados.
export function statePairs(state: CatalogState): Pair[] {
  const out: Pair[] = [];
  if (state.q) out.push(["q", state.q]);
  for (const name of Object.keys(state.filters).sort()) {
    for (const v of [...state.filters[name]].sort()) out.push(["f", `${name}:${v}`]);
  }
  if (state.minPrice !== null) out.push(["precio_min", String(state.minPrice)]);
  if (state.maxPrice !== null) out.push(["precio_max", String(state.maxPrice)]);
  if (state.sort) out.push(["orden", state.sort]);
  if (state.page > 1) out.push(["pagina", String(state.page)]);
  return out;
}

// Solo los parámetros que este módulo conoce (utm_*, fbclid... se ignoran).
function rawPairs(raw: RawSearchParams): Pair[] {
  const out: Pair[] = [];
  for (const key of KEYS) for (const v of list(raw[key])) out.push([key, v]);
  return out;
}

const samePairs = (a: Pair[], b: Pair[]) =>
  a.length === b.length && a.every((p, i) => p[0] === b[i][0] && p[1] === b[i][1]);

export function parseCatalogQuery(raw: RawSearchParams): { state: CatalogState; needsRedirect: boolean } {
  const q = normalizeQuery(list(raw.q)[0]);
  const sortRaw = list(raw.orden)[0]?.trim() ?? "";
  let sort: SortKey | null = isSortKey(sortRaw) ? sortRaw : null;
  if (sort === "relevance" && !q) sort = null; // sin búsqueda no hay relevancia

  let minPrice = parsePrice(list(raw.precio_min));
  let maxPrice = parsePrice(list(raw.precio_max));
  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
    [minPrice, maxPrice] = [maxPrice, minPrice];
  }

  const state: CatalogState = {
    q,
    page: parsePage(list(raw.pagina)),
    sort,
    filters: parseFilters(list(raw.f)),
    minPrice,
    maxPrice,
  };
  return { state, needsRedirect: !samePairs(rawPairs(raw), statePairs(state)) };
}

export function catalogHref(basePath: string, state: CatalogState): string {
  const qs = new URLSearchParams(statePairs(state)).toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

// Nuevo estado a partir de otro. Cualquier cambio vuelve a la página 1,
// salvo que el cambio sea justamente de página.
export function nextState(state: CatalogState, patch: Partial<CatalogState>): CatalogState {
  const s: CatalogState = { ...state, ...patch, page: patch.page ?? 1 };
  if (s.sort === "relevance" && !s.q) s.sort = null;
  return s;
}

export function toggleFilter(state: CatalogState, name: string, value: string): CatalogState {
  const filters = newFilters();
  for (const k of Object.keys(state.filters)) filters[k] = [...state.filters[k]];
  const cur = filters[name] ?? [];
  if (cur.includes(value)) {
    const rest = cur.filter((v) => v !== value);
    if (rest.length) filters[name] = rest;
    else delete filters[name];
  } else if (cur.length < LIMITS.values && (name in filters || Object.keys(filters).length < LIMITS.groups)) {
    filters[name] = [...cur, value];
  }
  return nextState(state, { filters });
}

export const hasActiveFilters = (s: CatalogState) =>
  Object.keys(s.filters).length > 0 || s.minPrice !== null || s.maxPrice !== null;

// Solo las vistas simples se guardan en caché: búsquedas y combinaciones de
// filtros son ilimitadas y no deben llenar el disco.
export const isCacheable = (s: CatalogState) => !s.q && !hasActiveFilters(s);

function appendFilterParams(p: URLSearchParams, state: CatalogState) {
  if (state.q) p.set("q", state.q);
  for (const [k, v] of statePairs(state)) if (k === "f") p.append("f", v);
  if (state.minPrice !== null) p.set("min_price", String(state.minPrice));
  if (state.maxPrice !== null) p.set("max_price", String(state.maxPrice));
}

// Parámetros para GET /public/{slug}/productos
export function toApiParams(state: CatalogState, opts: { categorySlug?: string; limit: number }): URLSearchParams {
  const p = new URLSearchParams();
  p.set("limit", String(opts.limit));
  p.set("page", String(state.page));
  if (opts.categorySlug) p.set("category", opts.categorySlug);
  if (state.sort) p.set("sort", state.sort);
  appendFilterParams(p, state);
  return p;
}

// Parámetros para GET /public/{slug}/filtros (sin página, orden ni límite)
export function toFacetParams(state: CatalogState, categorySlug?: string): URLSearchParams {
  const p = new URLSearchParams();
  if (categorySlug) p.set("category", categorySlug);
  appendFilterParams(p, state);
  return p;
}

export const totalPages = (total: number, pageSize: number) => Math.max(1, Math.ceil(total / pageSize));

// Ventana del paginador: 1 … 4 5 6 … 9
export function pageWindow(current: number, total: number): Array<number | "gap"> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set<number>([1, total, current - 1, current, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((p) => pages.add(p));
  if (current >= total - 2) [total - 1, total - 2, total - 3].forEach((p) => pages.add(p));
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: Array<number | "gap"> = [];
  sorted.forEach((p, i) => {
    if (i > 0) {
      const d = p - sorted[i - 1];
      if (d === 2) out.push(p - 1);
      else if (d > 2) out.push("gap");
    }
    out.push(p);
  });
  return out;
}
