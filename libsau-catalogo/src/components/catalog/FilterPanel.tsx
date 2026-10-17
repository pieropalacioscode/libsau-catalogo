import Link from "next/link";
import type { ReactNode } from "react";
import type { ClientConfig } from "@/config/clients";
import { catalogHref, hasActiveFilters, nextState, type CatalogState } from "@/lib/catalog-query";
import { hasPriceRange, prepareFacets } from "@/lib/facets";
import type { Facets } from "@/types";

type Props = {
  basePath: string;
  categorySlug?: string;
  state: CatalogState;
  facets: Facets;
  config: ClientConfig;
};

function Group({ title, badge, open, children }: { title: string; badge?: number; open?: boolean; children: ReactNode }) {
  return (
    <details open={open} className="group border-b border-black/10">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 px-4 font-display text-sm font-bold text-ink [&::-webkit-details-marker]:hidden">
        <span>
          {title}
          {badge ? <span className="ml-2 text-xs font-semibold text-brand">({badge})</span> : null}
        </span>
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-ink/50 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </summary>
      {children}
    </details>
  );
}

const row = (on: boolean) =>
  `flex min-h-11 items-center justify-between gap-3 px-4 text-sm hover:bg-brand/5 ${on ? "font-bold text-brand" : "text-ink"}`;
const priceInput = "mt-1 h-11 w-full rounded-lg border border-black/20 bg-white px-3 text-base";

// Contenido del panel: un formulario GET. Conserva la búsqueda y el orden; al aplicar
// vuelve a la página 1 (no envía "pagina").
export default function FilterPanel({ basePath, categorySlug, state, facets, config }: Props) {
  const groups = prepareFacets(facets.attributes, state, config.filters);
  const showPrice = config.filters.showPrice && hasPriceRange(facets.price);
  const filtered = hasActiveFilters(state);
  const catHref = (slug?: string) => catalogHref(slug ? `/categoria/${slug}` : "/", nextState(state, {}));

  return (
    <form action={basePath} method="get" className="flex min-h-0 flex-1 flex-col">
      {state.q && <input type="hidden" name="q" value={state.q} />}
      {state.sort && <input type="hidden" name="orden" value={state.sort} />}

      <div className="flex-1 overflow-y-auto overscroll-contain">
        {facets.categories.length > 0 && (
          <Group title="Categorías" open={Boolean(categorySlug)}>
            <ul className="max-h-72 overflow-y-auto pb-2">
              <li>
                <Link prefetch={false} href={catHref()} aria-current={!categorySlug ? "page" : undefined} className={row(!categorySlug)}>
                  Todas
                </Link>
              </li>
              {facets.categories.map((c) => (
                <li key={c.id}>
                  <Link prefetch={false} href={catHref(c.slug)} aria-current={c.slug === categorySlug ? "page" : undefined} className={row(c.slug === categorySlug)}>
                    <span className="min-w-0 truncate">{c.name}</span>
                    <span className="text-xs text-ink/60">{c.product_count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Group>
        )}

        {groups.map((g, i) => (
          <Group key={g.name} title={g.label} badge={g.selected} open={g.selected > 0 || i === 0}>
            <ul className="max-h-72 overflow-y-auto pb-2">
              {g.values.map((v) => (
                <li key={v.value}>
                  <label className="flex min-h-11 cursor-pointer items-center gap-3 px-4 hover:bg-brand/5">
                    <input
                      type="checkbox"
                      name="f"
                      value={`${g.name}:${v.value}`}
                      defaultChecked={(state.filters[g.name] ?? []).includes(v.value)}
                      className="h-5 w-5 shrink-0 accent-[var(--brand)]"
                    />
                    <span className="min-w-0 flex-1 text-sm text-ink">{v.value}</span>
                    <span className="text-xs text-ink/60">{v.count}</span>
                  </label>
                </li>
              ))}
            </ul>
          </Group>
        ))}

        {showPrice && (
          <Group title="Precio (S/)" badge={state.minPrice !== null || state.maxPrice !== null ? 1 : 0} open={state.minPrice !== null || state.maxPrice !== null}>
            <div className="grid grid-cols-2 gap-3 px-4 pb-4">
              <label className="block text-xs text-ink/70">
                Mínimo
                <input type="number" name="precio_min" inputMode="decimal" min={0} step="any" defaultValue={state.minPrice ?? ""} placeholder={String(facets.price.min)} className={priceInput} />
              </label>
              <label className="block text-xs text-ink/70">
                Máximo
                <input type="number" name="precio_max" inputMode="decimal" min={0} step="any" defaultValue={state.maxPrice ?? ""} placeholder={String(facets.price.max)} className={priceInput} />
              </label>
            </div>
          </Group>
        )}
      </div>

      <div className="flex items-center gap-3 border-t border-black/10 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {filtered && (
          <Link
            href={catalogHref(basePath, nextState(state, { filters: {}, minPrice: null, maxPrice: null }))}
            className="text-sm font-semibold text-brand underline underline-offset-4"
          >
            Quitar filtros
          </Link>
        )}
        <button type="submit" className="ml-auto inline-flex min-h-11 items-center rounded-full bg-brand px-6 text-sm font-bold text-white">
          Aplicar
        </button>
      </div>
    </form>
  );
}
