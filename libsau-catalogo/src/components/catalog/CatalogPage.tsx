import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCategories, getFacets, getProductsPage } from "@/lib/api";
import {
  catalogHref,
  hasActiveFilters,
  nextState,
  parseCatalogQuery,
  totalPages,
  type RawSearchParams,
  type SortKey,
} from "@/lib/catalog-query";
import { getClientConfig } from "@/config/clients";
import { activeFilterCount, hasPriceRange } from "@/lib/facets";
import { siteConfig } from "@/lib/site";
import Breadcrumbs, { type Crumb } from "@/components/Breadcrumbs";
import { chipView } from "@/lib/categories";
import type { Category } from "@/types";
import FilterDrawer from "./FilterDrawer";
import FilterPanel from "./FilterPanel";
import Pagination from "./Pagination";
import ProductCard from "./ProductCard";

const SORT_LABELS: Record<SortKey, string> = {
  relevance: "Más relevantes",
  name: "Nombre (A–Z)",
  price_asc: "Precio: menor a mayor",
  price_desc: "Precio: mayor a menor",
  newest: "Más recientes",
};

const chip =
  "inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-2 text-sm font-semibold";
const chipOff = "border-black/15 bg-white text-ink hover:border-brand";
const chipOn = "border-chip bg-chip text-white";
const MAX_CHIPS = 24;

type Props = {
  basePath: string;
  categorySlug?: string;
  searchParams: RawSearchParams;
  embeddedTitle?: string; // portada de marca: el título pasa a h2 (el h1 es el del hero)
};

export default async function CatalogPage({ basePath, categorySlug, searchParams, embeddedTitle }: Props) {
  const config = getClientConfig();

  // La categoría se valida primero: una categoría inexistente es 404, no una redirección.
  const allCategories = await getCategories();
  let category: Category | undefined;
  if (categorySlug) {
    category = allCategories.find((c) => c.slug === categorySlug);
    if (!category) notFound();
  }

  const { state, needsRedirect } = parseCatalogQuery(searchParams);
  // 307 a propósito: un 308 se cachea para siempre en el navegador.
  if (needsRedirect) redirect(catalogHref(basePath, state));

  const [{ items, total }, facets] = await Promise.all([
    getProductsPage({ state, categorySlug, limit: config.pageSize }),
    getFacets({ state, categorySlug }),
  ]);
  if (!facets) notFound();

  const pages = totalPages(total, config.pageSize);
  if (state.page > pages) notFound();

  const searching = state.q !== "";
  const Heading = embeddedTitle ? "h2" : "h1";
  const filtered = hasActiveFilters(state);
  const title = category
    ? category.name
    : searching
      ? `Resultados para «${state.q}»`
      : (embeddedTitle ?? siteConfig.tagline ?? "Nuestros productos");

  const categoryHref = (slug?: string) =>
    catalogHref(slug ? `/categoria/${slug}` : "/", nextState(state, {}));
  const sortHref = (sort: SortKey | null) => catalogHref(basePath, nextState(state, { sort }));

  const sortOptions = config.sorts.filter((s) => s !== "relevance");
  const defaultActive = state.sort === null || (searching && state.sort === "relevance");

  const hasTree = allCategories.some((c) => c.parent_slug);
  const view = chipView(allCategories, facets.categories, category);
  const parentSlug = category?.parent_slug ?? null;
  const parentCat = parentSlug ? allCategories.find((c) => c.slug === parentSlug) : undefined;
  // Migas solo en clientes con jerarquía (LIBPREP queda como estaba).
  const crumbs: Crumb[] | null =
    category && hasTree
      ? [
          { name: "Inicio", href: "/" },
          ...(parentCat ? [{ name: parentCat.name, href: `/categoria/${parentCat.slug}` }] : []),
          { name: category.name },
        ]
      : null;
  const activeCount = activeFilterCount(state);
  const showPrice = config.filters.showPrice && hasPriceRange(facets.price);
  const hasPanel = filtered || facets.categories.length > 0 || facets.attributes.length > 0 || showPrice;

  return (
    <div className={config.theme.filtersPlacement === "floating" ? "pb-16" : undefined}>
      {crumbs && <Breadcrumbs items={crumbs} />}
      <section className="mb-6">
        <Heading className="font-display text-3xl md:text-4xl font-extrabold tracking-tight text-brand max-w-2xl">
          {title}
        </Heading>
        <p className="mt-2 text-ink/70" role="status" aria-live="polite">
          {total} {total === 1 ? "resultado" : "resultados"}
          {pages > 1 && ` · Página ${state.page} de ${pages}`}
        </p>
        {(searching || filtered) && (
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold">
            {searching && (
              <Link className="text-brand underline underline-offset-4" href={catalogHref(basePath, nextState(state, { q: "" }))}>
                Limpiar búsqueda
              </Link>
            )}
            {filtered && (
              <Link
                className="text-brand underline underline-offset-4"
                href={catalogHref(basePath, nextState(state, { filters: {}, minPrice: null, maxPrice: null }))}
              >
                Quitar filtros
              </Link>
            )}
          </p>
        )}
      </section>

      {hasPanel && (
        <div className={config.theme.filtersPlacement === "header" ? undefined : "mb-4"}>
          <FilterDrawer key={catalogHref(basePath, state)} activeCount={activeCount} placement={config.theme.filtersPlacement}>
            <FilterPanel basePath={basePath} categorySlug={categorySlug} state={state} facets={facets} config={config} />
          </FilterDrawer>
        </div>
      )}

      {view.chips.length > 0 && (
        <nav aria-label="Categorías" className="-mx-4 mb-4 overflow-x-auto px-4 md:mx-0 md:overflow-visible md:px-0">
          <ul className="flex gap-2 md:flex-wrap">
            <li>
              <Link
                href={categoryHref(view.allSlug)}
                aria-current={view.allActive ? "page" : undefined}
                className={`${chip} ${view.allActive ? chipOn : chipOff}`}
              >
                Todas
              </Link>
            </li>
            {view.chips.slice(0, MAX_CHIPS).map((c) => {
              const active = c.slug === categorySlug;
              return (
                <li key={c.id}>
                  <Link
                    href={categoryHref(c.slug)}
                    aria-current={active ? "page" : undefined}
                    className={`${chip} ${active ? chipOn : chipOff}`}
                  >
                    {c.name}
                    <span className={active ? "text-white/80" : "text-ink/60"}>{c.product_count}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}

      <nav aria-label="Ordenar" className="-mx-4 mb-6 flex items-center gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
        <span className="shrink-0 text-sm text-ink/70">Ordenar por:</span>
        <Link
          href={sortHref(null)}
          aria-current={defaultActive ? "true" : undefined}
          className={`${chip} ${defaultActive ? chipOn : chipOff}`}
        >
          {searching ? SORT_LABELS.relevance : "Recomendados"}
        </Link>
        {sortOptions.map((s) => (
          <Link
            key={s}
            href={sortHref(s)}
            aria-current={state.sort === s ? "true" : undefined}
            className={`${chip} ${state.sort === s ? chipOn : chipOff}`}
          >
            {SORT_LABELS[s]}
          </Link>
        ))}
      </nav>

      {items.length === 0 ? (
        <div className="rounded-xl border border-black/10 bg-white p-8 text-center">
          <p className="font-display text-lg font-bold text-ink">
            {searching || filtered || category ? config.copy.emptyTitle : "No hay productos disponibles por el momento."}
          </p>
          {(searching || filtered) && <p className="mt-2 text-ink/70">Prueba con otra palabra o quita los filtros.</p>}
          {(searching || filtered || category) && (
            <Link href="/" className="mt-4 inline-block font-semibold text-brand underline underline-offset-4">
              Ver todo el catálogo
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
          {items.map((product, i) => (
            <ProductCard key={product.id} product={product} priority={i < 4} />
          ))}
        </div>
      )}

      <Pagination basePath={basePath} state={state} pages={pages} />
    </div>
  );
}
