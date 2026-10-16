import type { Metadata } from "next";
import CatalogPage from "@/components/catalog/CatalogPage";
import { catalogMetadata } from "@/lib/catalog-metadata";
import type { RawSearchParams } from "@/lib/catalog-query";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<RawSearchParams>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  return catalogMetadata({ basePath: `/categoria/${slug}`, categorySlug: slug, searchParams: await searchParams });
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  return <CatalogPage basePath={`/categoria/${slug}`} categorySlug={slug} searchParams={await searchParams} />;
}
