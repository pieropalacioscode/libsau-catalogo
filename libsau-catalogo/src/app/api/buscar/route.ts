import { NextRequest, NextResponse } from "next/server";
import { getCategories, getProductsPage } from "@/lib/api";
import { parseCatalogQuery } from "@/lib/catalog-query";
import { createLimiter } from "@/lib/rate-limit";
import { safeHttpsUrl } from "@/lib/site";
import { MIN_CHARS, SUGGEST_LIMIT, type SuggestResponse } from "@/lib/suggest";
import { plain } from "@/lib/text";

export const dynamic = "force-dynamic";

// El origen solo es alcanzable desde Cloudflare (firewall), por eso cf-connecting-ip es confiable.
const limiter = createLimiter(40, 10_000);

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  NextResponse.json(body, { status, headers });

function clientKey(req: NextRequest): string {
  const h = req.headers;
  const ip = h.get("cf-connecting-ip") ?? h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0] ?? "anon";
  return ip.trim().slice(0, 64);
}

export async function GET(req: NextRequest) {
  const rl = limiter.allow(clientKey(req));
  if (!rl.ok) {
    return json({ error: "demasiadas peticiones" }, 429, { "Retry-After": String(rl.retryAfter) });
  }

  // Mismas reglas de normalización y topes que el listado.
  const { state } = parseCatalogQuery({ q: req.nextUrl.searchParams.get("q") ?? "" });
  if ([...state.q].length < MIN_CHARS) {
    return json({ q: state.q, total: 0, items: [], categories: [] } satisfies SuggestResponse);
  }

  try {
    const [page, cats] = await Promise.all([
      getProductsPage({ state, limit: SUGGEST_LIMIT }),
      getCategories(), // en caché 60 s
    ]);

    const tokens = plain(state.q).split(/\s+/).filter(Boolean);
    const categories = cats
      .filter((c) => c.slug && tokens.every((t) => plain(c.name).includes(t)))
      .sort((a, b) => b.product_count - a.product_count)
      .slice(0, 3)
      .map((c) => ({ name: c.name, slug: c.slug, count: c.product_count }));

    const body: SuggestResponse = {
      q: state.q,
      total: page.total,
      items: page.items.map((p) => ({
        slug: p.slug,
        name: p.name,
        price: Number(p.price),
        image: safeHttpsUrl(p.image_url),
        category: p.category?.name ?? "",
      })),
      categories,
    };
    return json(body, 200, { "Cache-Control": "private, max-age=30" });
  } catch {
    return json({ error: "no disponible" }, 502);
  }
}
