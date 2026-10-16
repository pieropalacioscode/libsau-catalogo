import Link from "next/link";
import { catalogHref, nextState, pageWindow, type CatalogState } from "@/lib/catalog-query";

const box =
  "inline-flex h-11 min-w-11 items-center justify-center rounded-lg border px-3 text-sm font-semibold";
const off = "border-black/15 bg-white text-ink hover:border-brand";

export default function Pagination({
  basePath,
  state,
  pages,
}: {
  basePath: string;
  state: CatalogState;
  pages: number;
}) {
  if (pages <= 1) return null;
  const href = (p: number) => catalogHref(basePath, nextState(state, { page: p }));

  return (
    <nav aria-label="Paginación" className="mt-10">
      <ul className="flex flex-wrap items-center justify-center gap-2">
        <li>
          {state.page > 1 ? (
            <Link rel="prev" href={href(state.page - 1)} className={`${box} ${off}`}>
              Anterior
            </Link>
          ) : (
            <span aria-disabled="true" className={`${box} border-transparent text-ink/40`}>
              Anterior
            </span>
          )}
        </li>
        {pageWindow(state.page, pages).map((item, i) =>
          item === "gap" ? (
            <li key={`gap-${i}`} aria-hidden="true" className="px-1 text-ink/50">
              …
            </li>
          ) : (
            <li key={item}>
              {item === state.page ? (
                <span aria-current="page" className={`${box} border-brand bg-brand text-white`}>
                  {item}
                </span>
              ) : (
                <Link href={href(item)} aria-label={`Ir a la página ${item}`} className={`${box} ${off}`}>
                  {item}
                </Link>
              )}
            </li>
          ),
        )}
        <li>
          {state.page < pages ? (
            <Link rel="next" href={href(state.page + 1)} className={`${box} ${off}`}>
              Siguiente
            </Link>
          ) : (
            <span aria-disabled="true" className={`${box} border-transparent text-ink/40`}>
              Siguiente
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}
