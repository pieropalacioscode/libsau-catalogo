import type { Metadata } from "next";
import CatalogPage from "@/components/catalog/CatalogPage";
import JsonLd from "@/components/JsonLd";
import { getBusiness } from "@/lib/api";
import { organizationJsonLd } from "@/lib/org";
import { catalogMetadata } from "@/lib/catalog-metadata";
import { hasActiveFilters, parseCatalogQuery, type RawSearchParams } from "@/lib/catalog-query";
import { getClientConfig } from "@/config/clients";
import HomeIntro from "@/components/home/HomeIntro";
import HomeInfo from "@/components/home/HomeInfo";

type Props = { searchParams: Promise<RawSearchParams> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return catalogMetadata({ basePath: "/", searchParams: await searchParams });
}

export default async function HomePage({ searchParams }: Props) {
  const raw = await searchParams;
  const business = await getBusiness();
  const home = getClientConfig().home;
  const { state } = parseCatalogQuery(raw);
  // La portada de marca solo se ve sin búsqueda, filtros, orden ni página.
  const landing = Boolean(home) && !state.q && !hasActiveFilters(state) && !state.sort && state.page === 1;
  return (
    <>
      {business && <JsonLd data={organizationJsonLd(business)} />}
      {landing && home && <HomeIntro home={home} business={business} />}
      <div id="catalogo" className="scroll-mt-24">
        <CatalogPage basePath="/" searchParams={raw} embeddedTitle={landing ? home?.catalogTitle : undefined} />
      </div>
      {landing && home && <HomeInfo home={home} business={business} />}
    </>
  );
}
