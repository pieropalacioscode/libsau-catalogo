import Image from "next/image";
import Link from "next/link";
import type { HomeConfig } from "@/config/clients";
import { getCategories, getProductsPage } from "@/lib/api";
import { whatsappLink } from "@/lib/whatsapp";
import { safeHttpsUrl } from "@/lib/site";
import { heroCopy } from "@/lib/hero-copy";
import HeroSlides from "./HeroSlides";
import type { Business } from "@/types";

const Arrow = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const eyebrow = "text-xs font-bold uppercase tracking-[0.2em] text-brand";

// Portada de marca: hero + tarjetas de categoría. Todo sale de la config del cliente y de la API pública.
export default async function HomeIntro({ home, business }: { home: HomeConfig; business: Business | null }) {
  const [cats, hero, cardPages] = await Promise.all([
    getCategories(),
    getProductsPage({ categorySlug: home.heroFrom, limit: 3 }),
    Promise.all(home.cards.items.map((c) => getProductsPage({ categorySlug: c.slug, limit: 1 }))),
  ]);
  const copy = heroCopy(home);
  const known = new Set(cats.map((c) => c.slug));
  const cards = home.cards.items
    .map((c, i) => ({ ...c, image: cardPages[i]?.items[0]?.image_url ?? null }))
    .filter((c) => known.has(c.slug));
  const pinatas = hero.items.map((p) => p.image_url).filter((u): u is string => Boolean(u));
  // Una foto de otro rubro al centro (archivo junto al logo): la portada no es solo de piñatas.
  let center: string | null = null;
  try {
    center = home.heroCenter && business?.logo_url ? safeHttpsUrl(new URL(home.heroCenter, business.logo_url).toString()) : null;
  } catch {
    center = null;
  }
  const heroImages = center
    ? [pinatas[0], center, pinatas[2] ?? pinatas[1]].filter((u): u is string => Boolean(u))
    : pinatas;
  const mid = Math.min(1, heroImages.length - 1); // en móvil solo se ve esta foto
  const wa = whatsappLink(business?.whatsapp_number, `Hola, quiero personalizar un pedido con ${business?.name ?? "ustedes"}.`);

  return (
    <>
      {home.slides?.length ? (
        <HeroSlides home={home} business={business} trust={copy.trust} />
      ) : (
      <section
        className="relative mb-6 overflow-hidden rounded-2xl bg-brand text-white [--focus:#fff] md:mb-12 md:rounded-3xl"
        style={{
          backgroundImage:
            "radial-gradient(circle at 80% 0%, color-mix(in srgb, var(--chip) 60%, transparent), transparent 55%), linear-gradient(rgb(255 255 255 / 0.05) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.05) 1px, transparent 1px)",
          backgroundSize: "auto, 32px 32px, 32px 32px",
        }}
      >
        <div className="grid items-center gap-4 px-4 py-5 sm:px-6 sm:py-8 md:grid-cols-2 md:gap-8 md:px-10 md:py-14">
          <div>
            {copy.eyebrow && (
              <p className="hidden text-balance text-xs font-bold uppercase tracking-[0.2em] text-white/70 sm:block">{copy.eyebrow}</p>
            )}
            <h1 className="text-balance break-words font-display text-[1.7rem] font-extrabold leading-tight tracking-tight sm:mt-3 sm:text-4xl md:text-5xl">
              {copy.headline[0]}
              {copy.headline[1] && (
                <>
                  <br />
                  <span className="text-accent">{copy.headline[1]}</span>
                </>
              )}
            </h1>
            <p className="mt-2 line-clamp-2 max-w-md text-pretty text-sm text-white/85 sm:mt-4 sm:line-clamp-none sm:text-lg">{copy.subtitle}</p>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 sm:mt-6 sm:gap-3">
              <a href="#catalogo" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-bold text-brand sm:min-h-12 sm:px-6 sm:text-base">
                {home.primaryCta} <Arrow />
              </a>
              {wa && (
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center text-sm font-bold text-white underline underline-offset-4 sm:min-h-12 sm:rounded-full sm:border-2 sm:border-white/70 sm:px-6 sm:text-base sm:no-underline sm:hover:bg-white/10"
                >
                  {home.secondaryCta}
                  <span className="sr-only"> (se abre en otra pestaña)</span>
                </a>
              )}
            </div>
            {/* Móvil: una sola línea que se desliza. Desde sm: tres columnas. */}
            <ul className="mt-3 flex gap-5 overflow-x-auto whitespace-nowrap pb-1 text-xs text-white/85 sm:mt-8 sm:grid sm:grid-cols-3 sm:gap-3 sm:overflow-visible sm:whitespace-normal sm:pb-0 sm:text-sm">
              {copy.trust.map((t) => (
                <li key={t.text} className="flex shrink-0 items-center gap-2 sm:shrink sm:gap-3">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-accent sm:h-7 sm:w-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d={t.path} />
                  </svg>
                  <span className="sm:hidden">{t.short}</span>
                  <span className="hidden sm:inline">{t.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {heroImages.length > 0 && (
            <div className="grid items-center gap-3 md:grid-cols-[1fr_1.25fr_1fr]" aria-hidden="true">
              {heroImages.map((src, i) => (
                <div
                  key={src}
                  className={`relative h-28 overflow-hidden rounded-2xl bg-white shadow-lg md:aspect-[3/4] md:h-auto ${i === mid ? "" : "hidden md:block"} ${i === 1 ? "md:-translate-y-4" : ""}`}
                >
                  <Image src={src} alt="" fill className="object-contain p-2" sizes="(max-width: 768px) 90vw, 15vw" priority={i === mid} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      )}

      {cards.length > 0 && (
        <section className="mb-10">
          <p className={eyebrow}>{home.cards.eyebrow}</p>
          <h2 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-ink">
            {home.cards.title[0]} <span className="text-brand">{home.cards.title[1]}</span>
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {cards.map((c) => (
              <Link key={c.slug} href={`/categoria/${c.slug}`} className="flex min-h-56 overflow-hidden rounded-2xl bg-brand text-white [--focus:#fff]">
                <div className="flex flex-1 flex-col justify-between gap-4 p-6">
                  <div>
                    <h3 className="font-display text-2xl font-extrabold leading-tight">{c.title}</h3>
                    <p className="mt-2 max-w-xs text-sm text-white/80">{c.blurb}</p>
                  </div>
                  <span className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full bg-accent px-5 text-sm font-bold text-brand">
                    {c.cta} <Arrow />
                  </span>
                </div>
                {c.image && (
                  <div className="relative my-4 mr-4 w-2/5 shrink-0 overflow-hidden rounded-xl bg-white">
                    <Image src={c.image} alt="" fill className="object-contain p-2" sizes="(max-width: 768px) 40vw, 20vw" />
                  </div>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
