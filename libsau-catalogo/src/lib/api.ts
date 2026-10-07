import type { Product, Business, Category } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const SLUG = process.env.NEXT_PUBLIC_NEGOCIO_SLUG;

if (!API_URL || !SLUG) {
  throw new Error("Faltan NEXT_PUBLIC_API_URL y/o NEXT_PUBLIC_NEGOCIO_SLUG");
}

// 404 => null. Cualquier otro fallo => excepción, para que ISR
// conserve la última versión buena en vez de cachear un "vacío".
async function request(path: string): Promise<Response | null> {
  const res = await fetch(`${API_URL}/public/${SLUG}${path}`, {
    next: { revalidate: 60 },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`API ${res.status} en ${path}`);
  return res;
}

async function api<T>(path: string): Promise<T | null> {
  const res = await request(path);
  return res ? ((await res.json()) as T) : null;
}

export type ProductPage = { items: Product[]; total: number };

type PageOptions = { page?: number; limit?: number; q?: string; categoryId?: number };

// Una página del catálogo; el total (con filtros) viene en X-Total-Count.
export async function getProductsPage(opts: PageOptions = {}): Promise<ProductPage> {
  const params = new URLSearchParams();
  params.set("limit", String(opts.limit ?? 24));
  params.set("page", String(opts.page ?? 1));
  if (opts.q) params.set("q", opts.q);
  if (opts.categoryId) params.set("category_id", String(opts.categoryId));

  const res = await request(`/productos?${params.toString()}`);
  if (!res) return { items: [], total: 0 };
  return {
    items: (await res.json()) as Product[],
    total: Number(res.headers.get("X-Total-Count") ?? 0),
  };
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