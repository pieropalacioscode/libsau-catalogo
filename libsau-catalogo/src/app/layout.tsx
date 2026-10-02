import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

// Manejo seguro de la URL base para evitar errores de compilación
const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Catálogo Oficial",
  description: "Encuentra y solicita tus productos directamente por WhatsApp",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="bg-gray-50 text-gray-900 antialiased min-h-screen flex flex-col">
        <header className="bg-white border-b sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
            <Link href="/" className="text-xl font-bold text-emerald-600">
              Catálogo Oficial
            </Link>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full">
          {children}
        </main>

        <footer className="bg-white border-t py-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Catálogo impulsado por LIBSAU
        </footer>
      </body>
    </html>
  );
}