import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types";

export default function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  return (
    <Link
      href={`/productos/${product.slug || product.id}`}
      className="bg-white rounded-xl border border-black/10 overflow-hidden flex flex-col hover:border-brand"
    >
      <div className="relative aspect-[3/4] w-full bg-paper">
        {/* alt vacío a propósito: el título ya está dentro del mismo enlace y se leería dos veces */}
        <Image
          src={product.image_url || "/placeholder.svg"}
          alt=""
          fill
          priority={priority}
          className="object-contain p-3"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
        />
      </div>
      <div className="p-4 flex-1 flex flex-col justify-between gap-4">
        <div>
          {product.category?.name && (
            <span className="text-xs font-semibold text-brand">{product.category.name}</span>
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
  );
}
