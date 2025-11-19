"use client";

import Image from "next/image";
import Link from "next/link";
import { ProductWithDetails } from "@/lib/types/database";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

interface ProductCardProps {
  product: ProductWithDetails;
}

export function ProductCard({ product }: ProductCardProps) {
  const primaryImage =
    product.product_images?.find((img) => img.is_primary) ||
    product.product_images?.[0];
  const imageUrl =
    primaryImage?.image_url ||
    "https://via.placeholder.com/400x400?text=No+Image";

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-square w-full cursor-pointer">
          <Image
            src={imageUrl}
            alt={primaryImage?.alt_text || product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
        </div>
      </Link>
      <CardContent className="p-4 space-y-2">
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-semibold text-lg hover:text-red-600 transition-colors cursor-pointer">
            {product.name}
          </h3>
        </Link>
        <p className="text-red-600 font-bold text-xl">
          {formatCurrency(product.price)}
        </p>
        <Link href={`/products/${product.slug}`}>
          <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
            View Details
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
