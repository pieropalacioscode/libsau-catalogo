import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { Inter, Montserrat } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { getBusiness } from "@/lib/api";
import { safeColor, safeHttpsUrl, siteConfig, siteUrl } from "@/lib/site";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const business = await getBusiness();
  const name = business?.name ?? "Catálogo";
  const description =
    siteConfig.description ??
    `Encuentra y pide tus productos de ${name} directamente por WhatsApp.`;

  return {
    metadataBase: new URL(siteUrl),
    title: { default: siteConfig.title ?? name, template: `%s | ${name}` },
    description,
    openGraph: { siteName: name, locale: "es_PE" },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const business = await getBusiness();
  const name = business?.name ?? "Catálogo";
  const logo = safeHttpsUrl(business?.logo_url);
  const brandStyle = { "--brand": safeColor(business?.primary_color) } as CSSProperties;

  return (
    <html
      lang="es"
      style={brandStyle}
      className={`${inter.variable} ${montserrat.variable}`}
    >
      <body className="font-sans text-ink antialiased min-h-screen flex flex-col">
        <header className="bg-white border-b border-black/10 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-3">
            <Link href="/" className="inline-flex items-center gap-3">
              {logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt="" className="h-10 w-auto" />
              )}
              <span className="font-display text-xl font-extrabold tracking-tight text-brand">
                {name}
              </span>
            </Link>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full">{children}</main>

        <footer className="bg-brand text-white py-6 text-center text-sm">
          <p>
            © {new Date().getFullYear()} {name}
          </p>
          <p className="mt-1 text-xs text-white/70">Catálogo impulsado por LIBSAU</p>
        </footer>
      </body>
    </html>
  );
}