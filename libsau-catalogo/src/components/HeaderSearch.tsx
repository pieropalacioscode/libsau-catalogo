"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import SearchBox from "./SearchBox";

// En móvil la lupa es un icono que despliega el buscador (abierto de entrada si ya hay ?q=).
// Desde sm: el buscador está siempre visible y el icono no existe.
export default function HeaderSearch({ placeholder }: { placeholder: string }) {
  const hasQuery = (useSearchParams().get("q") ?? "") !== "";
  const [manual, setManual] = useState<boolean | null>(null);
  const open = manual ?? hasQuery;
  const boxId = useId();
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (manual) box.current?.querySelector<HTMLInputElement>('input[type="search"]')?.focus();
  }, [manual]);

  return (
    <>
      <button
        type="button"
        onClick={() => setManual(!open)}
        aria-expanded={open}
        aria-controls={boxId}
        aria-label={open ? "Cerrar búsqueda" : "Abrir búsqueda"}
        className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-full text-brand hover:bg-brand/10 sm:hidden"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
      </button>
      <div id={boxId} ref={box} className={`${open ? "block" : "hidden"} w-full sm:ml-auto sm:block sm:max-w-md sm:flex-1`}>
        <SearchBox placeholder={placeholder} />
      </div>
    </>
  );
}
