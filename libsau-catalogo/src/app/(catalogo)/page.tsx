import type { Metadata } from "next";
import CatalogPage from "@/components/catalog/CatalogPage";
import { catalogMetadata } from "@/lib/catalog-metadata";
import type { RawSearchParams } from "@/lib/catalog-query";

type Props = { searchParams: Promise<RawSearchParams> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return catalogMetadata({ basePath: "/", searchParams: await searchParams });
}

export default async function HomePage({ searchParams }: Props) {
  return <CatalogPage basePath="/" searchParams={await searchParams} />;
}
