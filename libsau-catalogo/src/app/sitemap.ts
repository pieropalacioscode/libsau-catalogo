import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/api";
import { siteUrl } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl.replace(/\/$/, "");
  const products = await getProducts();

  return [
    { url: `${base}/` },
    ...products
      .filter((p) => p.slug)
      .map((p) => ({ url: `${base}/productos/${p.slug}` })),
  ];
}
