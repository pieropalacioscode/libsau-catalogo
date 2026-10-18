import type { HomeConfig } from "@/config/clients";
import { whatsappLink } from "@/lib/whatsapp";
import type { Business } from "@/types";

const eyebrow = "text-xs font-bold uppercase tracking-[0.2em] text-brand";

// Secciones bajo el catálogo: cómo funciona, por qué elegirnos y banner de WhatsApp.
export default function HomeInfo({ home, business }: { home: HomeConfig; business: Business | null }) {
  const wa = whatsappLink(business?.whatsapp_number, `Hola, tengo una idea y quiero cotizarla con ${business?.name ?? "ustedes"}.`);
  return (
    <div className="mt-16 space-y-12">
      <section id="como-funciona" className="scroll-mt-24">
        <p className={eyebrow}>Cómo funciona</p>
        <h2 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-ink">
          {home.steps.title[0]} <span className="text-brand">{home.steps.title[1]}</span>
        </h2>
        <ol className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {home.steps.items.map((s, i) => (
            <li key={s.title} className="rounded-2xl border border-black/10 bg-white p-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">{i + 1}</span>
              <h3 className="mt-3 font-display text-base font-bold text-ink">{s.title}</h3>
              <p className="mt-1 text-sm text-ink/70">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className={eyebrow}>{home.reasons.title}</h2>
        <ul className="mt-4 grid gap-4 md:grid-cols-3">
          {home.reasons.items.map((r) => (
            <li key={r.title} className="rounded-2xl border border-black/10 bg-white p-5">
              <h3 className="font-display text-base font-bold text-ink">{r.title}</h3>
              <p className="mt-1 text-sm text-ink/70">{r.text}</p>
            </li>
          ))}
        </ul>
      </section>

      {wa && (
        <section className="flex flex-col items-start justify-between gap-5 rounded-3xl bg-brand p-8 text-white [--focus:#fff] md:flex-row md:items-center">
          <div>
            <h2 className="font-display text-3xl font-extrabold leading-tight">
              {home.banner.title[0]} <span className="text-accent">{home.banner.title[1]}</span>
            </h2>
            <p className="mt-2 max-w-md text-white/85">{home.banner.text}</p>
          </div>
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 shrink-0 items-center rounded-full bg-accent px-6 font-bold text-brand"
          >
            {home.banner.button}
            <span className="sr-only"> (se abre en otra pestaña)</span>
          </a>
        </section>
      )}
    </div>
  );
}
