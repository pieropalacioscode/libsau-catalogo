// Formulario GET puro: funciona sin JavaScript. Es el respaldo mientras carga
// SearchBox (que añade sugerencias) y comparte sus estilos para que no haya saltos.
export const SEARCH_WRAPPER =
  "flex w-full items-center rounded-full border border-black/20 bg-white focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/30";
export const SEARCH_INPUT = "min-w-0 flex-1 bg-transparent px-4 py-2.5 text-base outline-none";

export default function SearchForm({
  placeholder,
  defaultValue = "",
}: {
  placeholder: string;
  defaultValue?: string;
}) {
  return (
    <form role="search" action="/" method="get" className={SEARCH_WRAPPER}>
      <label htmlFor="site-search" className="sr-only">
        Buscar
      </label>
      <input
        id="site-search"
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        maxLength={100}
        autoComplete="off"
        enterKeyHint="search"
        className={SEARCH_INPUT}
      />
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
  );
}
