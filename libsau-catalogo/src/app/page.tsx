//src > app > page.tsx 
import { getProducts } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";

export const revalidate = 60; // Refresco Incremental (ISR) cada 60 segundos

export default async function HomePage() {
  const products = await getProducts();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Nuestros Productos</h1>

      {products.length === 0 ? (
        <p className="text-gray-500">No hay productos disponibles por el momento.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/productos/${product.id}`}
              className="bg-white rounded-lg border shadow-sm hover:shadow-md transition overflow-hidden flex flex-col"
            >
              <div className="relative aspect-square w-full bg-gray-100">
                <Image
                  src={product.image_url || "/placeholder.svg"}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                />
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  {product.category?.name && (
                    <span className="text-xs text-emerald-600 font-semibold uppercase">
                      {product.category.name}
                    </span>
                  )}
                  <h2 className="text-base font-medium text-gray-800 line-clamp-2 mt-1">
                    {product.name}
                  </h2>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-900">
                    S/ {Number(product.price).toFixed(2)}
                  </span>
                  <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-medium">
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