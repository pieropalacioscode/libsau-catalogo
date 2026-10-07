//src > app > page.tsx
import { getProducts } from "@/lib/api";
import { siteConfig } from "@/lib/site";
import Image from "next/image";
import Link from "next/link";

export const revalidate = 60; // Refresco Incremental (ISR) cada 60 segundos

export default async function HomePage() {
  const products = await getProducts();
  const tagline = siteConfig.tagline ?? "Nuestros productos";

  return (
    <div>
      <section className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight text-brand max-w-2xl">
          {tagline}
        </h1>
        {products.length > 0 && (
          <p className="mt-2 text-ink/70">{products.length} productos disponibles</p>
        )}
      </section>

      {products.length === 0 ? (
        <p className="text-ink/70">No hay productos disponibles por el momento.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/productos/${product.slug || product.id}`}
              className="bg-white rounded-xl border border-black/10 overflow-hidden flex flex-col hover:border-brand"
            >
              <div className="relative aspect-[3/4] w-full bg-paper">
                <Image
                  src={product.image_url || "/placeholder.svg"}
                  alt={product.name}
                  fill
                  className="object-contain p-3"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                />
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                <div>
                  {product.category?.name && (
                    <span className="text-xs font-semibold text-brand">
                      {product.category.name}
                    </span>
                  )}
                  <h2 className="font-display text-sm md:text-base font-semibold text-ink line-clamp-2 mt-1">
                    {product.name}
                  </h2>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-lg font-bold text-ink">
                    S/ {Number(product.price).toFixed(2)}
                  </span>
                  <span className="text-xs bg-accent text-ink px-2.5 py-1 rounded-full font-semibold">
                    Ver detalle
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}