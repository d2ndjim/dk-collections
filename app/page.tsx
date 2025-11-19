import { Suspense } from "react";
import Header from "@/components/Header";
import { ProductListing } from "@/components/ProductListing";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Suspense
        fallback={
          <div className="min-h-screen flex flex-col">
            <Header category="all" />
            <div className="container mx-auto px-4 py-8 flex-1">
              <div className="animate-pulse space-y-8">
                <div className="flex gap-4 justify-center">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-10 w-20 bg-gray-200 rounded" />
                  ))}
                </div>
                <div className="grid grid-cols-4 gap-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="space-y-4">
                      <div className="aspect-square bg-gray-200 rounded" />
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                      <div className="h-10 bg-gray-200 rounded" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <Footer />
          </div>
        }
      >
        <div className="min-h-screen flex flex-col">
          <ProductListing />
          <Footer />
        </div>
      </Suspense>
    </>
  );
}
