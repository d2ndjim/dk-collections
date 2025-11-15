"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProductWithDetails } from "@/lib/types/database";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Package, Tag, DollarSign } from "lucide-react";

interface ProductDetailDialogProps {
  product: ProductWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductDetailDialog({
  product,
  open,
  onOpenChange,
}: ProductDetailDialogProps) {
  const [selectedColor, setSelectedColor] = useState<string>("");

  if (!product) return null;

  // Get unique colors from variants
  const uniqueColors = Array.from(
    new Set(
      product.product_variants
        ?.filter((v) => v.color)
        .map((v) => v.color) || []
    )
  ).map((color) => {
    const variant = product.product_variants?.find((v) => v.color === color);
    return {
      color: color as string,
      color_code: variant?.color_code || "#000000",
    };
  });

  // Set initial selected color
  if (!selectedColor && uniqueColors.length > 0) {
    setSelectedColor(uniqueColors[0].color);
  }

  // Get images for selected color
  const selectedColorImages =
    product.product_images?.filter(
      (img) => img.color === selectedColor || !img.color
    ) || [];

  // Get primary image or first image
  const displayImage =
    selectedColorImages.find((img) => img.is_primary) || selectedColorImages[0];

  // Get variants for selected color
  const selectedColorVariants =
    product.product_variants?.filter((v) => v.color === selectedColor) || [];

  // Calculate total stock for selected color
  const colorStock = selectedColorVariants.reduce(
    (sum, v) => sum + (v.stock || 0),
    0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{product.name}</DialogTitle>
          <DialogDescription>
            {product.categories?.name || "Uncategorized"} • {product.product_type}
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left: Images */}
          <div className="space-y-4">
            {displayImage ? (
              <div className="aspect-square rounded-lg border overflow-hidden bg-muted">
                <img
                  src={displayImage.image_url}
                  alt={displayImage.alt_text || product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-square rounded-lg border bg-muted flex items-center justify-center">
                <Package className="h-16 w-16 text-muted-foreground" />
              </div>
            )}

            {/* Image thumbnails */}
            {selectedColorImages.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {selectedColorImages.map((img, idx) => (
                  <div
                    key={img.id || idx}
                    className={`aspect-square rounded-md border overflow-hidden cursor-pointer ${
                      displayImage?.id === img.id
                        ? "ring-2 ring-primary"
                        : ""
                    }`}
                  >
                    <img
                      src={img.image_url}
                      alt={img.alt_text || ""}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Details */}
          <div className="space-y-4">
            {/* Price */}
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">
                  {formatCurrency(product.price)}
                </span>
                {product.compare_at_price && (
                  <span className="text-lg text-muted-foreground line-through">
                    {formatCurrency(product.compare_at_price)}
                  </span>
                )}
              </div>
            </div>

            {/* Status Badges */}
            <div className="flex gap-2">
              <Badge variant={product.is_active ? "default" : "secondary"}>
                {product.is_active ? "Active" : "Inactive"}
              </Badge>
              {product.is_featured && (
                <Badge variant="outline">Featured</Badge>
              )}
            </div>

            <Separator />

            {/* Description */}
            {product.description && (
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-sm text-muted-foreground">
                  {product.description}
                </p>
              </div>
            )}

            {/* Colors */}
            {uniqueColors.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Colors</h3>
                <div className="flex gap-2">
                  {uniqueColors.map((colorObj) => (
                    <button
                      key={colorObj.color}
                      onClick={() => setSelectedColor(colorObj.color)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md border transition-all ${
                        selectedColor === colorObj.color
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div
                        className="w-5 h-5 rounded-full border-2 border-white shadow"
                        style={{ backgroundColor: colorObj.color_code }}
                      />
                      <span className="text-sm font-medium">
                        {colorObj.color}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Color Info */}
            {selectedColor && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">
                      {selectedColor} - Available Sizes
                    </h3>
                    <div className="flex items-center gap-1 text-sm">
                      <Package className="h-4 w-4" />
                      <span className="font-medium">{colorStock} in stock</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {selectedColorVariants.map((variant) => (
                      <div
                        key={variant.id}
                        className="p-3 border rounded-md text-center"
                      >
                        <div className="font-semibold">{variant.size}</div>
                        <div className="text-xs text-muted-foreground">
                          Stock: {variant.stock}
                        </div>
                        {variant.sku && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {variant.sku}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Additional Info */}
            <Separator />
            <div className="space-y-2 text-sm">
              {product.brand && (
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Brand:</span>
                  <span className="font-medium">{product.brand}</span>
                </div>
              )}
              {product.material && (
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Material:</span>
                  <span className="font-medium">{product.material}</span>
                </div>
              )}
            </div>

            {/* Total Stock */}
            <Separator />
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Stock (All Variants)</span>
                <span className="text-2xl font-bold">
                  {product.product_variants?.reduce(
                    (sum, v) => sum + (v.stock || 0),
                    0
                  ) || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

