import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { Suspense } from "react";
import { Inter, Montserrat } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { getBusiness } from "@/lib/api";
import { getClientConfig } from "@/config/clients";
import { safeColor, safeHttpsUrl, siteConfig, siteUrl } from "@/lib/site";
import HeaderSearch from "@/components/HeaderSearch";
import SearchForm from "@/components/SearchForm";
import SiteFooter from "@/components/SiteFooter";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

// Archivo hermano del logo (misma carpeta). null si no hay logo o no es https.
function siblingUrl(logo: string | null, file: string): string | null {
  if (!logo || !file) return null;
  try {
    return safeHttpsUrl(new URL(file, logo).toString());
  } catch {
    return null;
  }
}
const HEX = /^#[0-9a-fA-F]{6}$/;

export async function generateMetadata(): Promise<Metadata> {
  const business = await getBusiness();
  const name = business?.name ?? "Catálogo";
  const logo = safeHttpsUrl(business?.logo_url);
  const theme = getClientConfig().theme;
  const icon = siblingUrl(logo, theme.iconFile) ?? logo;
  const apple = siblingUrl(logo, theme.appleIconFile) ?? logo;
  const description =
    siteConfig.description ??
    `Encuentra y pide tus productos de ${name} directamente por WhatsApp.`;

  return {
    metadataBase: new URL(siteUrl),
    title: { default: siteConfig.title ?? name, template: `%s | ${name}` },
    description,
    openGraph: { siteName: name, locale: "es_PE" },
    ...(icon ? { icons: { icon, ...(apple ? { apple } : {}) } } : {}),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const business = await getBusiness();
  const name = business?.name ?? "Catálogo";
  const logo = safeHttpsUrl(business?.logo_url);
  const config = getClientConfig();
  const placeholder = config.copy.searchPlaceholder;
  const brand = safeColor(business?.primary_color);
  const accent = business?.accent_color && HEX.test(business.accent_color) ? business.accent_color : null;
  const brandStyle = {
    "--brand": brand,
    ...(accent ? { "--accent": accent } : {}),
    ...(config.theme.focus === "brand" ? { "--focus": brand } : {}),
    ...(HEX.test(config.theme.paper) ? { "--paper": config.theme.paper } : {}),
    ...(HEX.test(config.theme.ink) ? { "--ink": config.theme.ink } : {}),
    ...(HEX.test(config.theme.chip) ? { "--chip": config.theme.chip } : {}),
  } as CSSProperties;
  const showName = config.theme.showNameWithLogo || !logo;
  const filtersInHeader = config.theme.filtersPlacement === "header";

  return (
    <html
      lang="es"
      style={brandStyle}
      className={`${inter.variable} ${montserrat.variable}`}
    >
      <body className="font-sans text-ink antialiased min-h-screen flex flex-col">
        <header className="bg-white border-b border-black/10 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-2 sm:py-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link href="/" className="inline-flex min-w-0 items-center gap-3">
              {logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logo}
                  alt={showName ? "" : name}
                  className={showName ? "h-10 w-auto" : "h-11 w-auto"}
                />
              )}
              {showName && (
                <span className="truncate font-display text-xl font-extrabold tracking-tight text-brand">
                  {name}
                </span>
              )}
            </Link>
            <Suspense
              fallback={
                <div className={`${filtersInHeader ? "order-last sm:order-none " : ""}w-full sm:ml-auto sm:max-w-md sm:flex-1`}>
                  <SearchForm placeholder={placeholder} />
                </div>
              }
            >
              <HeaderSearch placeholder={placeholder} withFilters={filtersInHeader} />
            </Suspense>
            {/* Aquí se dibuja el botón "Filtros" (lo pinta FilterDrawer con un portal) */}
            {filtersInHeader && <div id="filters-slot" className="empty:hidden sm:order-last" />}
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full">{children}</main>

        <SiteFooter business={business} name={name} />
      </body>
    </html>
  );
}
