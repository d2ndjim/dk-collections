import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/actions/products";
import { ProductDetails } from "@/components/ProductDetails";
import Header from "@/components/Header";
import { Footer } from "@/components/Footer";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const { data: product, error } = await getProductBySlug(slug);

  if (error || !product) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header category="all" />
      <Suspense
        fallback={
          <div className="container mx-auto px-4 py-8 flex-1">
            <div className="animate-pulse space-y-8">
              <div className="h-6 bg-gray-200 rounded w-1/3" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="aspect-square bg-gray-200 rounded" />
                <div className="space-y-4">
                  <div className="h-8 bg-gray-200 rounded w-3/4" />
                  <div className="h-6 bg-gray-200 rounded w-1/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/6" />
                  <div className="h-20 bg-gray-200 rounded" />
                  <div className="h-20 bg-gray-200 rounded" />
                  <div className="h-12 bg-gray-200 rounded" />
                </div>
              </div>
            </div>
          </div>
        }
      >
        <div className="flex-1">
          <ProductDetails product={product} />
        </div>
      </Suspense>
      <Footer />
    </div>
  );
}
