//src > app > productos > [id] > page.tsx
import Image from "next/image";
import Link from "next/link";
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

  const price = Number(product.price).toFixed(2);
  const raw = product.description?.replace(/\s+/g, " ").trim();
  const description = raw
    ? raw.length > 160
      ? `${raw.slice(0, 157).trimEnd()}…`
      : raw
    : `${product.name}, S/ ${price}. Pídelo por WhatsApp.`;

  return {
    title: `${product.name} | S/ ${price}`,
    description,
    alternates: { canonical: `/productos/${id}` },
    openGraph: {
      title: product.name,
      description,
      ...(product.image_url ? { images: [product.image_url] } : {}),
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;

  const [product, business] = await Promise.all([getProduct(id), getBusiness()]);

  if (!product) {
    notFound();
  }

  const price = Number(product.price).toFixed(2);
  const phone = business?.whatsapp_number?.replace(/\D/g, "");
  const message = encodeURIComponent(
    `Hola, estoy interesado en comprar el producto: *${product.name}* (Precio: S/ ${price})`
  );
  const whatsappUrl = phone ? `https://wa.me/${phone}?text=${message}` : null;

  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/" className="text-sm font-semibold text-brand inline-block mb-4">
        Volver al catálogo
      </Link>

      <div className="bg-white rounded-xl border border-black/10 p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="relative aspect-[3/4] w-full bg-paper rounded-lg overflow-hidden">
          <Image
            src={product.image_url || "/placeholder.svg"}
            alt={product.name}
            fill
            className="object-contain p-4"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        </div>

        <div className="flex flex-col justify-between">
          <div>
            {product.category?.name && (
              <span className="text-sm font-semibold text-brand">
                {product.category.name}
              </span>
            )}
            <h1 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight text-ink mt-2">
              {product.name}
            </h1>

            <p className="mt-4 font-display text-3xl font-extrabold text-brand">
              S/ {price}
            </p>

            {product.description && (
              <p className="mt-4 text-ink/80 leading-relaxed max-w-prose">
                {product.description}
              </p>
            )}

            {product.attributes &&
              Array.isArray(product.attributes) &&
              product.attributes.length > 0 && (
                <dl className="mt-6 p-4 bg-paper rounded-lg text-sm grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                  {product.attributes.map((attr, index) => (
                    <div key={index} className="contents">
                      <dt className="font-semibold text-ink">{attr.name}</dt>
                      <dd className="text-ink/80">{attr.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
          </div>

          <div className="mt-8">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3.5 px-6 rounded-lg flex items-center justify-center gap-2"
              >
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                </svg>
                Comprar por WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}