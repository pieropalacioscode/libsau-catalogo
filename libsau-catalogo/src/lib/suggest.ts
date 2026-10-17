import { plain } from "./text";

export const MIN_CHARS = 2;
export const SUGGEST_LIMIT = 6;
export const MAX_QUERY_CHARS = 100;

export type SuggestItem = {
  slug: string;
  name: string;
  price: number;
  image: string | null;
  category: string;
};
export type SuggestCategory = { name: string; slug: string; count: number };
export type SuggestResponse = {
  q: string;
  total: number;
  items: SuggestItem[];
  categories: SuggestCategory[];
};

// Clave de búsqueda: espacios colapsados, recortada, sin tildes ni mayúsculas.
// null si es demasiado corta para consultar. "Álgebra" y "algebra" comparten caché.
export function suggestKey(raw: string): string | null {
  const s = [...raw.replace(/\s+/g, " ").trim()].slice(0, MAX_QUERY_CHARS).join("").trim();
  const key = plain(s);
  return [...key].length >= MIN_CHARS ? key : null;
}

// Caché pequeña en memoria con expiración, para no repetir consultas al borrar letras.
export class LruCache<V> {
  private map = new Map<string, { v: V; at: number }>();
  constructor(
    private cap: number,
    private ttlMs: number,
  ) {}

  get(key: string, now = Date.now()): V | undefined {
    const e = this.map.get(key);
    if (!e) return undefined;
    if (now - e.at > this.ttlMs) {
      this.map.delete(key);
      return undefined;
    }
    this.map.delete(key);
    this.map.set(key, e); // pasa a ser el más reciente
    return e.v;
  }

  set(key: string, v: V, now = Date.now()): void {
    this.map.delete(key);
    this.map.set(key, { v, at: now });
    while (this.map.size > this.cap) {
      const oldest = this.map.keys().next().value;
      if (oldest === undefined) break;
      this.map.delete(oldest);
    }
  }
}
