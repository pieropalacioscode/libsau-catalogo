// Límite de peticiones por clave (ventana fija, en memoria). Protege a la base de
// datos de un bot que dispare búsquedas sin parar. Un solo proceso: suficiente aquí.
export type Limiter = { allow(key: string, now?: number): { ok: boolean; retryAfter: number } };

export function createLimiter(max: number, windowMs: number, maxKeys = 5000): Limiter {
  const hits = new Map<string, { start: number; count: number }>();
  return {
    allow(key, now = Date.now()) {
      const e = hits.get(key);
      if (!e || now - e.start >= windowMs) {
        if (hits.size >= maxKeys) {
          for (const [k, v] of hits) if (now - v.start >= windowMs) hits.delete(k);
          if (hits.size >= maxKeys) hits.clear(); // tope duro: la memoria nunca crece sin límite
        }
        hits.set(key, { start: now, count: 1 });
        return { ok: true, retryAfter: 0 };
      }
      e.count++;
      if (e.count > max) return { ok: false, retryAfter: Math.ceil((e.start + windowMs - now) / 1000) };
      return { ok: true, retryAfter: 0 };
    },
  };
}
