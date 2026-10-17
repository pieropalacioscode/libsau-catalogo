"use client";
/* eslint-disable @next/next/no-img-element */

import { Fragment, useEffect, useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { catalogHref, parseCatalogQuery } from "@/lib/catalog-query";
import { highlight } from "@/lib/highlight";
import { LruCache, suggestKey, type SuggestItem, type SuggestResponse } from "@/lib/suggest";
import { SEARCH_INPUT, SEARCH_WRAPPER } from "./SearchForm";

const DEBOUNCE_MS = 180;
const cache = new LruCache<SuggestResponse>(40, 60_000);

type Row =
  | { kind: "product"; id: string; href: string; item: SuggestItem }
  | { kind: "category"; id: string; href: string; name: string; count: number }
  | { kind: "all"; id: string; href: string; total: number };
type ProductRow = Extract<Row, { kind: "product" }>;

const money = (n: number) => `S/ ${Number(n).toFixed(2)}`;

function Marked({ text, query }: { text: string; query: string }) {
  return (
    <>
      {highlight(text, query).map((seg, i) =>
        seg.hit ? (
          <b key={i} className="font-bold text-brand">
            {seg.text}
          </b>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </>
  );
}

// Se vuelve a montar cuando cambia ?q= (así el campo siempre refleja la URL).
export default function SearchBox({ placeholder }: { placeholder: string }) {
  const q = useSearchParams().get("q") ?? "";
  return <SearchCombobox key={q} initial={q} placeholder={placeholder} />;
}

function SearchCombobox({ initial, placeholder }: { initial: string; placeholder: string }) {
  const router = useRouter();
  const uid = useId();
  const listId = `${uid}-list`;
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const abortRef = useRef<AbortController | null>(null);
  const reqId = useRef(0);

  const [value, setValue] = useState(initial);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [data, setData] = useState<SuggestResponse | null>(null);
  const [active, setActive] = useState(-1);

  const typed = value.trim();
  const key = suggestKey(value);

  const rows = useMemo<Row[]>(() => {
    if (!data) return [];
    const out: Row[] = data.items.map((item) => ({
      kind: "product",
      id: `p-${item.slug}`,
      href: `/productos/${encodeURIComponent(item.slug)}`,
      item,
    }));
    for (const c of data.categories) {
      out.push({ kind: "category", id: `c-${c.slug}`, href: `/categoria/${encodeURIComponent(c.slug)}`, name: c.name, count: c.count });
    }
    if (data.total > 0) {
      out.push({ kind: "all", id: "all", href: catalogHref("/", parseCatalogQuery({ q: value }).state), total: data.total });
    }
    return out;
  }, [data, value]);

  const activeRow = active >= 0 ? rows[active] : undefined;
  const firstProduct = rows.find((r): r is ProductRow => r.kind === "product");
  const preview = activeRow?.kind === "product" ? activeRow : firstProduct;

  const show = open && key !== null && (status !== "idle" || data !== null);
  const message =
    status === "error" ? "error" : status === "loading" && !data ? "loading" : data && rows.length === 0 ? "empty" : null;
  const showRows = status !== "error" && rows.length > 0;
  const firstProductIdx = rows.findIndex((r) => r.kind === "product");
  const firstCategoryIdx = rows.findIndex((r) => r.kind === "category");
  const announce = !show
    ? ""
    : status === "error"
      ? "No se pudieron cargar las sugerencias"
      : data && status === "idle"
        ? `${data.total} ${data.total === 1 ? "resultado" : "resultados"}`
        : "Buscando";

  useEffect(() => () => {
    clearTimeout(timer.current);
    abortRef.current?.abort();
  }, []);

  useEffect(() => {
    if (active >= 0) document.getElementById(`${uid}-opt-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active, uid]);

  function cancelPending() {
    clearTimeout(timer.current);
    abortRef.current?.abort();
    reqId.current++;
  }

  async function load(k: string) {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const id = ++reqId.current;
    try {
      const res = await fetch(`/api/buscar?q=${encodeURIComponent(k)}`, { signal: ctrl.signal });
      if (!res.ok) throw new Error(String(res.status));
      const json = (await res.json()) as SuggestResponse;
      if (id !== reqId.current) return; // llegó tarde: ya hay una consulta más nueva
      cache.set(k, json);
      setData(json);
      setStatus("idle");
      setActive(-1);
    } catch (err) {
      if ((err as Error).name === "AbortError" || id !== reqId.current) return;
      setStatus("error");
    }
  }

  function schedule(raw: string) {
    cancelPending();
    const k = suggestKey(raw);
    if (!k) {
      setData(null);
      setStatus("idle");
      setOpen(false);
      return;
    }
    setOpen(true);
    const hit = cache.get(k);
    if (hit) {
      setData(hit);
      setStatus("idle");
      return;
    }
    setStatus("loading");
    timer.current = setTimeout(() => void load(k), DEBOUNCE_MS);
  }

  function close() {
    setOpen(false);
    setActive(-1);
  }

  function go(href: string) {
    cancelPending();
    close();
    inputRef.current?.blur(); // en el móvil esconde el teclado
    router.push(href);
  }

  function clear() {
    cancelPending();
    setValue("");
    setData(null);
    setStatus("idle");
    close();
    inputRef.current?.focus();
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const { state } = parseCatalogQuery({ q: value });
    if (!state.q) return;
    go(catalogHref("/", state));
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.nativeEvent.isComposing) return; // no interferir con teclados IME
    const n = rows.length;
    switch (e.key) {
      case "ArrowDown":
        if (n === 0) return;
        e.preventDefault();
        if (!open) {
          setOpen(true);
          setActive(0);
        } else setActive((a) => (a + 1) % n);
        break;
      case "ArrowUp":
        if (n === 0) return;
        e.preventDefault();
        if (!open) setOpen(true);
        setActive((a) => (a <= 0 ? n - 1 : a - 1));
        break;
      case "Enter":
        if (show && active >= 0 && rows[active]) {
          e.preventDefault();
          go(rows[active].href);
        }
        break; // sin fila activa, el formulario hace la búsqueda normal
      case "Escape":
        if (open) {
          e.preventDefault();
          close();
        }
        break;
      case "Tab":
        close();
        break;
    }
  }

  return (
    <div
      className="relative"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) close();
      }}
    >
      <form role="search" action="/" method="get" onSubmit={onSubmit} className={SEARCH_WRAPPER}>
        <label htmlFor={`${uid}-input`} className="sr-only">
          Buscar
        </label>
        <input
          ref={inputRef}
          id={`${uid}-input`}
          type="search"
          name="q"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setActive(-1);
            schedule(e.target.value);
          }}
          onFocus={() => {
            if (data && key) setOpen(true);
          }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          maxLength={100}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          enterKeyHint="search"
          role="combobox"
          aria-expanded={show}
          aria-controls={show && showRows ? listId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={show && active >= 0 ? `${uid}-opt-${active}` : undefined}
          className={SEARCH_INPUT}
        />
        {value && (
          <button
            type="button"
            aria-label="Borrar búsqueda"
            onClick={clear}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink/60 hover:bg-black/5"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        )}
        <button
          type="submit"
          aria-label="Buscar"
          className="mr-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-brand hover:bg-brand/10"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
        </button>
      </form>

      <div role="status" aria-live="polite" className="sr-only">
        {announce}
      </div>

      {show && (
        <div className="absolute right-0 top-full z-50 mt-2 w-full overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xl md:w-[44rem] md:max-w-[calc(100vw-2rem)]">
          <div className="md:grid md:grid-cols-[minmax(0,1fr)_15rem]">
            <div className={`max-h-[min(70vh,26rem)] overflow-y-auto overscroll-contain ${status === "loading" && data ? "opacity-60" : ""}`}>
              {message === "loading" && <p className="px-4 py-5 text-sm text-ink/70">Buscando…</p>}
              {message === "error" && (
                <p className="px-4 py-5 text-sm text-ink/70">No pudimos cargar las sugerencias. Pulsa Enter para buscar.</p>
              )}
              {message === "empty" && (
                <p className="px-4 py-5 text-sm text-ink/70">
                  No encontramos resultados para «{typed}». Revisa la ortografía o prueba con otra palabra.
                </p>
              )}

              {showRows && (
                <ul id={listId} role="listbox" aria-label="Sugerencias" className="py-1">
                  {rows.map((r, i) => {
                    const on = i === active;
                    const base = `cursor-pointer px-3 py-2 ${on ? "bg-brand/10" : ""}`;
                    const handlers = {
                      id: `${uid}-opt-${i}`,
                      role: "option" as const,
                      "aria-selected": on,
                      onMouseDown: (e: React.MouseEvent) => e.preventDefault(), // el campo conserva el foco
                      onMouseEnter: () => setActive(i),
                      onClick: () => go(r.href),
                    };
                    return (
                      <Fragment key={r.id}>
                        {(i === firstProductIdx || i === firstCategoryIdx) && (
                          <li role="presentation" className="px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-ink/50">
                            {r.kind === "product" ? "Productos" : "Categorías"}
                          </li>
                        )}
                        {r.kind === "product" && (
                          <li {...handlers} className={`flex min-h-14 items-center gap-3 ${base}`}>
                            <div className="h-[52px] w-10 shrink-0 overflow-hidden rounded bg-paper">
                              {r.item.image && (
                                <img src={r.item.image} alt="" width={40} height={52} loading="lazy" decoding="async" className="h-full w-full object-contain" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="line-clamp-2 text-sm font-semibold text-ink">
                                <Marked text={r.item.name} query={value} />
                              </p>
                              <p className="truncate text-xs text-ink/60">{r.item.category}</p>
                            </div>
                            <span className="shrink-0 font-display text-sm font-bold text-ink">{money(r.item.price)}</span>
                          </li>
                        )}
                        {r.kind === "category" && (
                          <li {...handlers} className={`flex min-h-11 items-center justify-between gap-3 text-sm ${base}`}>
                            <span className="min-w-0 truncate font-semibold text-ink">
                              <Marked text={r.name} query={value} />
                            </span>
                            <span className="shrink-0 text-xs text-ink/60">{r.count}</span>
                          </li>
                        )}
                        {r.kind === "all" && (
                          <li {...handlers} className={`mt-1 flex min-h-12 items-center border-t border-black/10 text-sm font-semibold text-brand ${base}`}>
                            Ver {r.total} {r.total === 1 ? "resultado" : "resultados"} para «{typed}»
                          </li>
                        )}
                      </Fragment>
                    );
                  })}
                </ul>
              )}
            </div>

            {showRows && preview && (
              <aside aria-hidden="true" className="hidden flex-col items-center gap-3 border-l border-black/10 bg-paper/60 p-4 md:flex">
                <div className="aspect-[3/4] w-32 overflow-hidden rounded-lg bg-white">
                  {preview.item.image && <img src={preview.item.image} alt="" className="h-full w-full object-contain" />}
                </div>
                <p className="text-xs font-semibold text-brand">{preview.item.category}</p>
                <p className="line-clamp-3 text-center text-sm font-semibold text-ink">{preview.item.name}</p>
                <p className="font-display text-lg font-extrabold text-ink">{money(preview.item.price)}</p>
              </aside>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
