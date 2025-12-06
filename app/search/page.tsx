"use client";

import { useState, useEffect, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { ProductGrid } from "@/components/ProductGrid";
import { searchProducts } from "@/lib/actions/products";
import { ProductWithDetails } from "@/lib/types/database";
import { Footer } from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";

function SearchResults() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const searchQuery = searchParams.get("q") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);

  const [products, setProducts] = useState<ProductWithDetails[] | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSearchResults() {
      if (!searchQuery.trim()) {
        setProducts([]);
        setTotalPages(0);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const { data, error, totalPages: pages } = await searchProducts(
        searchQuery.trim(),
        page,
        8,
      );

      if (error) {
        console.error("Error searching products:", error);
        setProducts([]);
        setTotalPages(0);
      } else {
        setProducts(data || []);
        setTotalPages(pages);
      }
      setIsLoading(false);
    }

    fetchSearchResults();
  }, [searchQuery, page]);

  const handlePageChange = (newPage: number) => {
    startTransition(() => {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}&page=${newPage}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  return (
    <>
      {searchQuery ? (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-bold">
              Search Results for &quot;{searchQuery}&quot;
            </h1>
            {!isLoading && products && (
              <p className="text-muted-foreground mt-2">
                {products.length === 0
                  ? "No products found"
                  : `Found ${products.length} product${products.length === 1 ? "" : "s"}`}
              </p>
            )}
          </div>
          <ProductGrid
            products={products}
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            isLoading={isLoading || isPending}
          />
        </>
      ) : (
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Search Products</h1>
          <p className="text-muted-foreground">
            Enter a search term in the search bar above to find products.
          </p>
        </div>
      )}
    </>
  );
}

function SearchResultsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="aspect-square w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header category="all" variant="full" />
      <div className="container mx-auto px-4 py-8 flex-1">
        <Suspense fallback={<SearchResultsSkeleton />}>
          <SearchResults />
        </Suspense>
      </div>
      <Footer />
    </div>
  );
}

