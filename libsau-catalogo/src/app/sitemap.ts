import type { MetadataRoute } from "next";
import { getCategories, getProducts } from "@/lib/api";
import { siteUrl } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl.replace(/\/$/, "");
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  // Páginas de categoría solo en clientes con jerarquía (LIBPREP conserva su sitemap actual).
  const categoryUrls = categories.some((c) => c.parent_slug)
    ? categories.filter((c) => c.slug).map((c) => ({ url: `${base}/categoria/${c.slug}` }))
    : [];

  return [
    { url: `${base}/` },
    ...categoryUrls,
    ...products
      .filter((p) => p.slug)
      .map((p) => ({ url: `${base}/productos/${p.slug}` })),
  ];
}
