import type { Product, Business, Category, Facets } from "@/types";
import {
  emptyState,
  isCacheable,
  toApiParams,
  toFacetParams,
  type CatalogState,
} from "@/lib/catalog-query";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const SLUG = process.env.NEXT_PUBLIC_NEGOCIO_SLUG;

if (!API_URL || !SLUG) {
  throw new Error("Faltan NEXT_PUBLIC_API_URL y/o NEXT_PUBLIC_NEGOCIO_SLUG");
}

// 404 => null. Cualquier otro fallo => excepción, para que ISR
// conserve la última versión buena en vez de cachear un "vacío".
// fresh: sin caché (búsquedas y filtros: combinaciones ilimitadas).
async function request(path: string, opts: { fresh?: boolean } = {}): Promise<Response | null> {
  const res = await fetch(
    `${API_URL}/public/${SLUG}${path}`,
    opts.fresh ? { cache: "no-store" } : { next: { revalidate: 60 } },
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`API ${res.status} en ${path}`);
  return res;
}

async function api<T>(path: string, opts: { fresh?: boolean } = {}): Promise<T | null> {
  const res = await request(path, opts);
  return res ? ((await res.json()) as T) : null;
}

export type ProductPage = { items: Product[]; total: number };

export type CatalogRequest = {
  state?: CatalogState;
  categorySlug?: string;
  page?: number;
  limit?: number;
};

// Una página del catálogo; el total (con filtros) viene en X-Total-Count.
export async function getProductsPage(req: CatalogRequest = {}): Promise<ProductPage> {
  const base = req.state ?? emptyState();
  const state = req.page ? { ...base, page: req.page } : base;
  const params = toApiParams(state, { categorySlug: req.categorySlug, limit: req.limit ?? 24 });

  const res = await request(`/productos?${params.toString()}`, { fresh: !isCacheable(state) });
  if (!res) return { items: [], total: 0 };
  return {
    items: (await res.json()) as Product[],
    total: Number(res.headers.get("X-Total-Count") ?? 0),
  };
}

// Categorías, atributos filtrables con conteos y rango de precio dentro del
// contexto actual. null = la categoría no existe (404).
export async function getFacets(req: { state?: CatalogState; categorySlug?: string } = {}): Promise<Facets | null> {
  const state = req.state ?? emptyState();
  const qs = toFacetParams(state, req.categorySlug).toString();
  return api<Facets>(`/filtros${qs ? `?${qs}` : ""}`, { fresh: !isCacheable(state) });
}

// Todos los productos (sitemap, rutas estáticas): pide de a 500, el máximo de la API.
export async function getProducts(): Promise<Product[]> {
  const all: Product[] = [];
  for (let page = 1; ; page++) {
    const { items, total } = await getProductsPage({ page, limit: 500 });
    all.push(...items);
    if (items.length === 0 || all.length >= total) break;
  }
  return all;
}

// {ref} puede ser el slug o el id numérico (la API acepta ambos).
export const getProduct = (ref: string) =>
  api<Product>(`/productos/${encodeURIComponent(ref)}`);

export const getBusiness = () => api<Business>("");

export const getCategories = async (): Promise<Category[]> =>
  (await api<Category[]>("/categorias")) ?? [];
