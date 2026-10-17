"use client";

import { useId, useRef, type ReactNode } from "react";

// Botón "Filtros" + panel lateral. Usa <dialog>.showModal(): Esc, foco atrapado y fondo
// inerte los resuelve el navegador. El contenido (un formulario GET) llega ya renderizado.
export default function FilterDrawer({ activeCount, children }: { activeCount: number; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const pressedOnBackdrop = useRef(false);
  const titleId = useId();
  const close = () => dialog.current?.close();

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        aria-haspopup="dialog"
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-black/15 bg-white px-4 text-sm font-semibold text-ink hover:border-brand"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
        Filtros
        {activeCount > 0 && (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-xs font-bold text-white">
            {activeCount}
            <span className="sr-only"> filtros activos</span>
          </span>
        )}
      </button>

      {/* Cierra al tocar el fondo, pero no si el gesto empezó dentro del panel (selección de texto). */}
      <dialog
        ref={dialog}
        className="drawer"
        aria-labelledby={titleId}
        onMouseDown={(e) => {
          pressedOnBackdrop.current = e.target === e.currentTarget;
        }}
        onClick={(e) => {
          if (pressedOnBackdrop.current && e.target === e.currentTarget) close();
        }}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-black/10 px-4 py-2">
            <h2 id={titleId} className="font-display text-lg font-extrabold text-brand">
              Filtros
            </h2>
            <button
              type="button"
              onClick={close}
              aria-label="Cerrar filtros"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full text-ink/70 hover:bg-black/5"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          {children}
        </div>
      </dialog>
    </>
  );
}
