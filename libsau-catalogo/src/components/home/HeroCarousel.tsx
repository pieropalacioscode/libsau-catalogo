"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, useSyncExternalStore } from "react";

export type SlideCta = { label: string; href: string; external: boolean };
export type SlideData = {
  eyebrow: string;
  title: string;
  highlight: string;
  text: string;
  ctas: SlideCta[];
  image: string | null;
};

const INTERVAL = 6000;
const SWIPE_MIN = 40;

const subscribeMotion = (cb: () => void) => {
  const m = window.matchMedia("(prefers-reduced-motion: reduce)");
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};
const reducedNow = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const Arrow = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const primary =
  "inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-bold text-brand sm:min-h-12 sm:px-6 sm:text-base";
const secondary =
  "inline-flex min-h-11 items-center text-sm font-bold text-white underline underline-offset-4 sm:min-h-12 sm:rounded-full sm:border-2 sm:border-white/70 sm:px-6 sm:text-base sm:no-underline sm:hover:bg-white/10";

// Todos los slides están en el HTML del servidor, apilados en la misma celda de la grilla:
// la altura es la del más largo y no cambia al rotar (sin saltos de layout).
export default function HeroCarousel({ slides, interval = INTERVAL }: { slides: SlideData[]; interval?: number }) {
  const n = slides.length;
  const [index, setIndex] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const [touching, setTouching] = useState(false);
  const reduced = useSyncExternalStore(subscribeMotion, reducedNow, () => false);
  const start = useRef<{ x: number; y: number } | null>(null);

  const playing = n > 1 && !reduced && !userPaused && !hover && !focus && !touching;
  const go = (i: number) => setIndex(((i % n) + n) % n);

  // El avance lo dispara el final de la barra de progreso (punto activo): barra y tiempo no se desfasan.
  // Cambiar de diapositiva a mano la reinicia (key={index}); pausar la congela (animation-play-state).
  const auto = n > 1 && !reduced;

  return (
    <div
      role="region"
      aria-roledescription="carrusel"
      aria-label="Destacados"
      onPointerEnter={(e) => e.pointerType === "mouse" && setHover(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setHover(false)}
      onFocus={(e) => setFocus(e.target.matches(":focus-visible"))} /* solo foco de teclado: un clic no detiene el avance */
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFocus(false);
      }}
      onTouchStart={(e) => {
        start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        setTouching(true);
      }}
      onTouchEnd={(e) => {
        const s = start.current;
        start.current = null;
        setTouching(false);
        if (!s || n < 2) return;
        const dx = e.changedTouches[0].clientX - s.x;
        const dy = e.changedTouches[0].clientY - s.y;
        if (Math.abs(dx) >= SWIPE_MIN && Math.abs(dx) > Math.abs(dy)) go(index + (dx < 0 ? 1 : -1));
      }}
      onTouchCancel={() => {
        start.current = null;
        setTouching(false);
      }}
    >
      <div className="grid touch-pan-y" aria-live={playing ? "off" : "polite"}>
        {slides.map((s, i) => {
          const active = i === index;
          const Title = i === 0 ? "h1" : "h2"; // un solo h1 en la página
          return (
            <div
              key={i}
              role="group"
              aria-roledescription="diapositiva"
              aria-label={`${i + 1} de ${n}`}
              aria-hidden={!active}
              className={`col-start-1 row-start-1 transition-[opacity,visibility] duration-500 motion-reduce:transition-none ${active ? "visible opacity-100" : "invisible opacity-0"}`}
            >
              <div className="grid items-center gap-3 md:grid-cols-2 md:gap-8">
                {s.image && (
                  <div className="relative order-first h-36 overflow-hidden rounded-2xl bg-white shadow-lg sm:h-48 md:order-last md:h-80">
                    <Image
                      src={s.image}
                      alt=""
                      fill
                      priority={i === 0}
                      sizes="(max-width: 768px) 90vw, 45vw"
                      className="object-contain p-2"
                    />
                  </div>
                )}
                <div className={s.image ? "" : "md:col-span-2"}>
                  {s.eyebrow && (
                    <p className="hidden text-balance text-xs font-bold uppercase tracking-[0.2em] text-white/70 sm:block">{s.eyebrow}</p>
                  )}
                  <Title className="text-balance break-words font-display text-[1.7rem] font-extrabold leading-tight tracking-tight sm:mt-3 sm:text-4xl md:text-5xl">
                    {s.title}
                    {s.highlight && (
                      <>
                        <br />
                        <span className="text-accent">{s.highlight}</span>
                      </>
                    )}
                  </Title>
                  <p className="mt-2 line-clamp-2 max-w-md text-pretty text-sm text-white/85 sm:mt-4 sm:line-clamp-none sm:text-lg">{s.text}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 sm:mt-6 sm:gap-3">
                    {s.ctas.map((c, k) => {
                      const cls = k === 0 ? primary : secondary;
                      const label = k === 0 ? <>{c.label} <Arrow /></> : c.label;
                      if (c.external)
                        return (
                          <a key={c.label} href={c.href} target="_blank" rel="noopener noreferrer" className={cls}>
                            {label}
                            <span className="sr-only"> (se abre en otra pestaña)</span>
                          </a>
                        );
                      return c.href.startsWith("#") ? (
                        <a key={c.label} href={c.href} className={cls}>{label}</a>
                      ) : (
                        <Link key={c.label} href={c.href} className={cls}>{label}</Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {n > 1 && (
        <div className="mt-2 flex items-center justify-center gap-1 sm:justify-start">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(i)}
              aria-label={`Ir a la diapositiva ${i + 1}`}
              aria-current={i === index ? "true" : undefined}
              className="group inline-flex h-11 items-center justify-center px-1"
            >
              <span className={`relative h-2 overflow-hidden rounded-full transition-all ${i === index ? "w-10 bg-white/30" : "w-2 bg-white/40 group-hover:bg-white/70"}`}>
                {i === index && (
                  <span
                    key={index}
                    onAnimationEnd={(e) => {
                      if (e.animationName === "hero-progress") setIndex((k) => (k + 1) % n);
                    }}
                    className="absolute inset-0 origin-left rounded-full bg-accent"
                    style={
                      auto
                        ? { animation: `hero-progress ${interval}ms linear forwards`, animationPlayState: playing ? "running" : "paused" }
                        : undefined
                    }
                  />
                )}
              </span>
            </button>
          ))}
          {!reduced && (
            <button
              type="button"
              onClick={() => setUserPaused((p) => !p)}
              aria-label={userPaused ? "Reanudar carrusel" : "Pausar carrusel"}
              className="ml-1 inline-flex h-11 w-11 items-center justify-center rounded-full text-white/70 hover:text-white"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                {userPaused ? <path d="M8 5v14l11-7z" /> : <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />}
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
