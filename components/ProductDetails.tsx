"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ProductWithDetails } from "@/lib/types/database";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home } from "lucide-react";

interface ProductDetailsProps {
  product: ProductWithDetails;
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  // Get unique colors from variants
  const colors = useMemo(() => {
    const colorMap = new Map<
      string,
      { color: string; colorCode: string | null; variantId: string }
    >();

    product.product_variants.forEach((variant) => {
      if (variant.color && variant.is_available) {
        if (!colorMap.has(variant.color)) {
          colorMap.set(variant.color, {
            color: variant.color,
            colorCode: variant.color_code,
            variantId: variant.id,
          });
        }
      }
    });

    return Array.from(colorMap.values());
  }, [product.product_variants]);

  // Get sizes for selected color (or all sizes if no color selected)
  const availableSizes = useMemo(() => {
    let sizes: string[] = [];

    if (selectedColor) {
      sizes = product.product_variants
        .filter(
          (v) => v.color === selectedColor && v.is_available && v.stock > 0,
        )
        .map((v) => v.size)
        .filter((size): size is string => size !== null);
    } else {
      sizes = product.product_variants
        .filter((v) => v.is_available && v.stock > 0)
        .map((v) => v.size)
        .filter((size): size is string => size !== null);
    }

    // Remove duplicates using Set, then sort
    const uniqueSizes = Array.from(new Set(sizes));
    return uniqueSizes.sort((a, b) => {
      // Sort sizes numerically if possible
      const numA = parseInt(a);
      const numB = parseInt(b);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return a.localeCompare(b);
    });
  }, [product.product_variants, selectedColor]);

  // Get images for selected color
  const displayImages = useMemo(() => {
    if (selectedColor) {
      // Find all variant IDs for selected color
      const colorVariantIds = product.product_variants
        .filter((v) => v.color === selectedColor && v.is_available)
        .map((v) => v.id);

      if (colorVariantIds.length > 0) {
        // Get images for any of these variants
        const variantImages = product.product_images.filter(
          (img) => img.variant_id && colorVariantIds.includes(img.variant_id),
        );
        if (variantImages.length > 0) {
          // Sort by display_order
          return variantImages.sort(
            (a, b) => a.display_order - b.display_order,
          );
        }
      }

      // If no variant-specific images, try to find images with matching color in alt_text or use product-level images
      const productLevelImages = product.product_images.filter(
        (img) => !img.variant_id,
      );
      if (productLevelImages.length > 0) {
        return productLevelImages.sort(
          (a, b) => a.display_order - b.display_order,
        );
      }
    }

    // Fallback to primary image or all images
    const primaryImage = product.product_images.find((img) => img.is_primary);
    if (primaryImage) {
      return [primaryImage];
    }

    return product.product_images.length > 0
      ? product.product_images.sort((a, b) => a.display_order - b.display_order)
      : [];
  }, [product.product_images, product.product_variants, selectedColor]);

  const primaryImage = displayImages[0];
  const imageUrl =
    primaryImage?.image_url ||
    "https://via.placeholder.com/600x600?text=No+Image";

  // Check availability
  const isAvailable = product.product_variants.some(
    (v) => v.is_available && v.stock > 0,
  );

  // Auto-select first color if available
  useEffect(() => {
    if (colors.length > 0 && !selectedColor) {
      setSelectedColor(colors[0].color);
    }
  }, [colors, selectedColor]);

  // Auto-select first size if available
  useEffect(() => {
    if (availableSizes.length > 0 && !selectedSize) {
      setSelectedSize(availableSizes[0]);
    }
  }, [availableSizes, selectedSize]);

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, prev + delta));
  };

  const handleAddToCart = () => {
    // TODO: Implement add to cart functionality
    console.log("Add to cart:", {
      productId: product.id,
      color: selectedColor,
      size: selectedSize,
      quantity,
    });
  };

  // Helper function to convert color name to hex code
  const getColorHex = (colorName: string, colorCode: string | null): string => {
    if (colorCode) {
      return colorCode.startsWith("#") ? colorCode : `#${colorCode}`;
    }

    // Fallback color mapping
    const colorMap: Record<string, string> = {
      black: "#000000",
      white: "#FFFFFF",
      blue: "#0000FF",
      red: "#FF0000",
      green: "#008000",
      yellow: "#FFFF00",
      gray: "#808080",
      grey: "#808080",
      silver: "#C0C0C0",
      brown: "#A52A2A",
      navy: "#000080",
      pink: "#FFC0CB",
      orange: "#FFA500",
      purple: "#800080",
    };

    return colorMap[colorName.toLowerCase()] || "#CCCCCC";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-8">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/" className="flex items-center gap-1">
                <Home className="h-4 w-4" />
                Home
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">SHOP</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{product.name.toUpperCase()}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Product Image */}
        <div className="space-y-4">
          <div className="relative aspect-square w-full bg-gray-100 rounded-lg overflow-hidden">
            <Image
              src={imageUrl}
              alt={primaryImage?.alt_text || product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>
        </div>

        {/* Product Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {product.name}
            </h1>
            <p className="text-3xl md:text-4xl font-bold mb-2">
              {formatCurrency(product.price)}
            </p>
            <p
              className={`text-sm font-medium ${isAvailable ? "text-red-600" : "text-gray-500"}`}
            >
              {isAvailable ? "Available" : "Out of Stock"}
            </p>
          </div>

          {/* Colors */}
          {colors.length > 0 && (
            <div className="space-y-3">
              <label className="text-sm font-semibold">Colours</label>
              <div className="flex gap-3 flex-wrap">
                {colors.map((colorOption) => (
                  <button
                    key={colorOption.color}
                    onClick={() => setSelectedColor(colorOption.color)}
                    className={`w-10 h-10 rounded border-2 transition-all ${
                      selectedColor === colorOption.color
                        ? "border-red-600 ring-2 ring-red-200"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                    style={{
                      backgroundColor: getColorHex(
                        colorOption.color,
                        colorOption.colorCode,
                      ),
                    }}
                    aria-label={`Select color ${colorOption.color}`}
                    title={colorOption.color}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Sizes */}
          {availableSizes.length > 0 && (
            <div className="space-y-3">
              <label className="text-sm font-semibold">Select Sizes</label>
              <div className="flex gap-3 flex-wrap">
                {availableSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 border-2 rounded transition-all ${
                      selectedSize === size
                        ? "border-red-600 bg-red-50 text-red-600 font-semibold"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="space-y-3">
            <label className="text-sm font-semibold">Quantity</label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleQuantityChange(-1)}
                className="w-10 h-10 border-2 border-gray-300 rounded flex items-center justify-center hover:bg-gray-50 transition-colors"
                aria-label="Decrease quantity"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1;
                  setQuantity(Math.max(1, value));
                }}
                className="w-16 h-10 text-center border-2 border-gray-300 rounded focus:outline-none focus:border-red-600"
              />
              <button
                onClick={() => handleQuantityChange(1)}
                className="w-10 h-10 border-2 border-gray-300 rounded flex items-center justify-center hover:bg-gray-50 transition-colors"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>

          {/* Add to Cart Button */}
          <Button
            onClick={handleAddToCart}
            disabled={!isAvailable || !selectedSize}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-6 text-lg font-semibold"
          >
            Add to Cart
          </Button>

          {/* Description */}
          {product.description && (
            <div className="pt-4 border-t">
              <h2 className="font-semibold mb-2">Description</h2>
              <p className="text-gray-600 whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
