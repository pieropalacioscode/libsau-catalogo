import Link from "next/link";
import { siteUrl } from "@/lib/site";
import JsonLd from "./JsonLd";

export type Crumb = { name: string; href?: string };

// Migas de pan visibles + BreadcrumbList. El último elemento es la página actual (sin enlace).
export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  const base = siteUrl.replace(/\/$/, "");
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      ...(it.href && i < items.length - 1 ? { item: `${base}${it.href}` } : {}),
    })),
  };
  return (
    <>
      <JsonLd data={data} />
      <nav aria-label="Migas de pan" className="mb-4 text-sm">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-ink/70">
          {items.map((it, i) => {
            const last = i === items.length - 1;
            return (
              <li key={i} className="flex items-center gap-2">
                {i > 0 && <span aria-hidden="true">›</span>}
                {it.href && !last ? (
                  <Link href={it.href} className="py-1 font-semibold text-brand underline-offset-4 hover:underline">
                    {it.name}
                  </Link>
                ) : (
                  <span aria-current="page" className="font-semibold text-ink">
                    {it.name}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
