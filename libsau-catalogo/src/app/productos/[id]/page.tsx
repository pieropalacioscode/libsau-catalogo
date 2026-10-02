//src > app > productos > [id] > page.tsx
import Image from "next/image";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getProduct, getProducts, getBusiness } from "@/lib/api";

export const revalidate = 60;

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({
    id: String(p.id),
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) return { title: "Producto no encontrado" };

  return {
    title: `${product.name} | S/ ${Number(product.price).toFixed(2)}`,
    description: `Compra ${product.name} al mejor precio.`,
    openGraph: {
      title: product.name,
      description: `S/ ${Number(product.price).toFixed(2)} - Cómpralo por WhatsApp`,
      ...(product.image_url ? { images: [product.image_url] } : {}),
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  
  const [product, business] = await Promise.all([
    getProduct(id),
    getBusiness(),
  ]);

  if (!product) {
    notFound();
  }

  const phone = business?.whatsapp_number?.replace(/\D/g, "");
  const message = encodeURIComponent(
    `Hola, estoy interesado en comprar el producto: *${product.name}* (Precio: S/ ${Number(product.price).toFixed(2)})`
  );
  const whatsappUrl = phone ? `https://wa.me/${phone}?text=${message}` : null;

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl border p-6 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="relative aspect-square w-full bg-gray-100 rounded-lg overflow-hidden border">
        <Image
          src={product.image_url || "/placeholder.svg"}
          alt={product.name}
          fill
          className="object-cover"
          priority
        />
      </div>

      <div className="flex flex-col justify-between">
        <div>
          {product.category?.name && (
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">
              {product.category.name}
            </span>
          )}
          <h1 className="text-2xl font-bold text-gray-900 mt-2">{product.name}</h1>
          
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-gray-900">
              S/ {Number(product.price).toFixed(2)}
            </span>
          </div>

          {product.attributes && Array.isArray(product.attributes) && product.attributes.length > 0 && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
              <span className="font-semibold block text-gray-700 mb-1">Especificaciones:</span>
              <ul className="list-disc pl-4 space-y-1">
                {product.attributes.map((attr, index) => (
                  <li key={index}>
                    <span className="font-medium">{attr.name}:</span> {attr.value}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {product.description && (
            <p className="mt-4 text-gray-600 leading-relaxed text-sm">
              {product.description}
            </p>
          )}
        </div>

        <div className="mt-8">
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-lg transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              <svg
                className="w-6 h-6 fill-current"
                viewBox="0 0 24 24"
              >
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
              </svg>
              Comprar por WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  );
}