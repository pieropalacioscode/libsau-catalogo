import type { Metadata } from "next";
import { getBusiness, getCategories } from "@/lib/api";
import { catalogHref, hasActiveFilters, parseCatalogQuery, type RawSearchParams } from "@/lib/catalog-query";
import { getClientConfig } from "@/config/clients";

// Solo el listado y sus páginas se indexan. Búsquedas, filtros y órdenes
// distintos: noindex, follow (sin canonical, para no dar señales contradictorias).
export async function catalogMetadata(opts: {
  basePath: string;
  categorySlug?: string;
  searchParams: RawSearchParams;
}): Promise<Metadata> {
  const { state } = parseCatalogQuery(opts.searchParams);
  const indexable = !state.q && !hasActiveFilters(state) && !state.sort;
  const meta: Metadata = {};
  let title: string | undefined;

  if (opts.categorySlug) {
    const [cats, business] = await Promise.all([getCategories(), getBusiness()]);
    const cat = cats.find((c) => c.slug === opts.categorySlug);
    if (!cat) return { title: "Categoría no encontrada", robots: { index: false } };
    title = cat.name;
    meta.description = `Explora ${getClientConfig().copy.itemPlural} de ${cat.name}${business ? ` en ${business.name}` : ""} y pídelos por WhatsApp.`;
  }
  if (state.q) title = `Resultados para «${state.q}»`;
  if (state.page > 1) title = `${title ?? "Catálogo"} – página ${state.page}`;

  if (title) meta.title = title;
  if (indexable) meta.alternates = { canonical: catalogHref(opts.basePath, state) };
  else meta.robots = { index: false, follow: true };
  return meta;
}
