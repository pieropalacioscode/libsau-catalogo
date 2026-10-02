import type { Product, Business } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const SLUG = process.env.NEXT_PUBLIC_NEGOCIO_SLUG;

if (!API_URL || !SLUG) {
  throw new Error("Faltan NEXT_PUBLIC_API_URL y/o NEXT_PUBLIC_NEGOCIO_SLUG");
}

// 404 => null. Cualquier otro fallo => excepción, para que ISR
// conserve la última versión buena en vez de cachear un "vacío".
async function api<T>(path: string): Promise<T | null> {
  const res = await fetch(`${API_URL}/public/${SLUG}${path}`, {
    next: { revalidate: 60 },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`API ${res.status} en ${path}`);
  return res.json();
}

export async function getProducts(): Promise<Product[]> {
  return (await api<Product[]>("/productos?limit=500")) ?? [];
}
export const getProduct = (id: string) => api<Product>(`/productos/${id}`);
export const getBusiness = () => api<Business>("");