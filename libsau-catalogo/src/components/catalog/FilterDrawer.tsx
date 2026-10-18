"use client";

import { useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

type Placement = "inline" | "header" | "floating";

// "header": el botón se dibuja dentro de <div id="filters-slot"> del layout (junto a la lupa);
// el panel (<dialog>) se queda en la página, donde están las facetas.
const SLOT_ID = "filters-slot";
const subscribe = () => () => {};
const getSlot = () => document.getElementById(SLOT_ID);
const getServerSlot = () => null;

const MENU = "M4 7h16M4 12h16M4 17h16";
const SLIDERS =
  "M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75";

const TRIGGER: Record<Placement, string> = {
  inline:
    "inline-flex min-h-11 items-center gap-2 rounded-full border border-black/15 bg-white px-4 text-sm font-semibold text-ink hover:border-brand",
  floating:
    "fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-40 inline-flex min-h-12 -translate-x-1/2 items-center gap-2 rounded-full bg-chip px-6 text-sm font-bold text-white shadow-xl shadow-black/30 ring-1 ring-white/20 hover:brightness-110",
  header:
    "relative inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-full border border-black/15 bg-white px-2.5 text-sm font-semibold text-ink hover:border-chip sm:px-4",
};
const BADGE: Record<Placement, string> = {
  inline: "inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-xs font-bold text-white",
  floating: "inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-bold text-brand",
  header:
    "absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-chip px-1.5 text-xs font-bold text-white sm:static",
};

// Botón "Filtros" + panel lateral. Usa <dialog>.showModal(): Esc, foco atrapado y fondo
// inerte los resuelve el navegador. El contenido (un formulario GET) llega ya renderizado.
export default function FilterDrawer({
  activeCount,
  placement = "inline",
  children,
}: {
  activeCount: number;
  placement?: Placement;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const pressedOnBackdrop = useRef(false);
  const titleId = useId();
  const [expanded, setExpanded] = useState(false);
  const slot = useSyncExternalStore(subscribe, getSlot, getServerSlot);
  const header = placement === "header";
  const close = () => dialog.current?.close();
  const open = () => {
    dialog.current?.showModal();
    setExpanded(true);
  };

  const trigger = (
    <button
      type="button"
      onClick={open}
      aria-haspopup="dialog"
      aria-expanded={header ? expanded : undefined}
      aria-label={header ? (activeCount > 0 ? `Filtros, ${activeCount} activos` : "Filtros") : undefined}
      className={TRIGGER[placement]}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d={placement === "inline" ? MENU : SLIDERS} />
      </svg>
      {header ? <span className="hidden sm:inline">Filtros</span> : "Filtros"}
      {activeCount > 0 && (
        <span className={BADGE[placement]}>
          {activeCount}
          <span className="sr-only"> filtros activos</span>
        </span>
      )}
    </button>
  );

  return (
    <>
      {header ? (slot ? createPortal(trigger, slot) : null) : trigger}

      {/* Cierra al tocar el fondo, pero no si el gesto empezó dentro del panel (selección de texto). */}
      <dialog
        ref={dialog}
        className="drawer"
        aria-labelledby={titleId}
        onClose={() => setExpanded(false)}
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
