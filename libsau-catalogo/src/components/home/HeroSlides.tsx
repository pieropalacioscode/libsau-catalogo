import type { HomeConfig } from "@/config/clients";
import { getProductsPage } from "@/lib/api";
import { safeHttpsUrl } from "@/lib/site";
import { whatsappLink } from "@/lib/whatsapp";
import type { Business } from "@/types";
import HeroCarousel, { type SlideCta, type SlideData } from "./HeroCarousel";

const MAX_SLIDES = 5;
const clean = (s: string | undefined) => (s ?? "").replace(/\s+/g, " ").trim();
// Solo enlaces internos, anclas o el comodín WHATSAPP; cualquier otra cosa se descarta.
const okHref = (h: string) => h === "WHATSAPP" || h.startsWith("#") || (h.startsWith("/") && !h.startsWith("//"));

type Trust = { text: string; short: string; path: string }[];

// Hero con carrusel: resuelve las fotos y enlaces desde la config del cliente y pinta el marco.
export default async function HeroSlides({ home, business, trust }: { home: HomeConfig; business: Business | null; trust: Trust }) {
  const wa = whatsappLink(business?.whatsapp_number, `Hola, quiero personalizar un pedido con ${business?.name ?? "ustedes"}.`);

  const slides: SlideData[] = (
    await Promise.all(
      (home.slides ?? []).slice(0, MAX_SLIDES).map(async (s): Promise<SlideData | null> => {
        const title = clean(s.title);
        if (!title) return null;

        let image: string | null = null;
        if (s.image?.file && business?.logo_url) {
          try {
            image = safeHttpsUrl(new URL(s.image.file, business.logo_url).toString());
          } catch {
            image = null;
          }
        }
        if (!image && s.image?.fromCategory) {
          const { items } = await getProductsPage({ categorySlug: s.image.fromCategory, limit: 1 });
          image = safeHttpsUrl(items[0]?.image_url);
        }

        const ctas: SlideCta[] = [];
        for (const c of s.ctas) {
          const label = clean(c.label);
          if (!label || !okHref(c.href)) continue;
          if (c.href === "WHATSAPP") {
            if (wa) ctas.push({ label, href: wa, external: true });
          } else ctas.push({ label, href: c.href, external: false });
        }
        return { eyebrow: clean(s.eyebrow), title, highlight: clean(s.highlight), text: clean(s.text), ctas, image };
      }),
    )
  ).filter((s): s is SlideData => s !== null);

  if (slides.length === 0) return null;

  return (
    <section
      className="relative mb-6 overflow-hidden rounded-2xl bg-brand text-white [--focus:#fff] md:mb-12 md:rounded-3xl"
      style={{
        backgroundImage:
          "radial-gradient(circle at 80% 0%, color-mix(in srgb, var(--chip) 60%, transparent), transparent 55%), linear-gradient(rgb(255 255 255 / 0.05) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.05) 1px, transparent 1px)",
        backgroundSize: "auto, 32px 32px, 32px 32px",
      }}
    >
      <div className="px-4 py-5 sm:px-6 sm:py-8 md:px-10 md:py-12">
        <HeroCarousel slides={slides} />
        {trust.length > 0 && (
          <ul className="mt-2 flex gap-5 overflow-x-auto whitespace-nowrap border-t border-white/10 pb-1 pt-3 text-xs text-white/85 sm:grid sm:grid-cols-3 sm:gap-3 sm:overflow-visible sm:whitespace-normal sm:pb-0 sm:text-sm">
            {trust.map((t) => (
              <li key={t.text} className="flex shrink-0 items-center gap-2 sm:shrink sm:gap-3">
                <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-accent sm:h-7 sm:w-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d={t.path} />
                </svg>
                <span className="sm:hidden">{t.short}</span>
                <span className="hidden sm:inline">{t.text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
