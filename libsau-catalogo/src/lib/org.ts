// Datos del negocio para el pie y los datos estructurados. Solo https; lo vacío no se muestra.
import type { Business } from "@/types";
import { safeHttpsUrl, siteUrl } from "@/lib/site";

export type SocialLink = { label: string; href: string };

export function socialLinks(b: Business | null): SocialLink[] {
  if (!b) return [];
  const out: SocialLink[] = [];
  for (const [label, raw] of [
    ["Instagram", b.instagram_url],
    ["TikTok", b.tiktok_url],
    ["Facebook", b.facebook_url],
  ] as const) {
    const href = safeHttpsUrl(raw);
    if (href) out.push({ label, href });
  }
  return out;
}

export function organizationJsonLd(b: Business) {
  const logo = safeHttpsUrl(b.logo_url);
  const same = socialLinks(b).map((l) => l.href);
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: b.name,
    url: siteUrl.replace(/\/$/, ""),
    ...(logo ? { logo } : {}),
    ...(same.length ? { sameAs: same } : {}),
  };
}
