import { slugify } from "@/lib/utils";

export interface VariantData {
  id?: string;
  color: string;
  size: string;
  stock: number;
  sku?: string;
  color_code?: string;
}

/**
 * Generate a SKU from product slug, color, and size
 * Example: "classic-tshirt-red-l" -> "CLASSIC-TSHIRT-RED-L"
 */
export function generateSKU(
  productSlug: string,
  color: string,
  size: string,
): string {
  const colorSlug = slugify(color);
  const sizeSlug = slugify(size);
  return `${productSlug}-${colorSlug}-${sizeSlug}`.toUpperCase();
}

/**
 * Check if there are duplicate color+size combinations in variants
 */
export function hasDuplicateVariants(
  variants: Array<{ color: string; sizes: Array<{ size: string }> }>,
): boolean {
  const combinations = new Set<string>();

  for (const variant of variants) {
    for (const size of variant.sizes) {
      const key = `${variant.color.toLowerCase()}-${size.size.toLowerCase()}`;
      if (combinations.has(key)) {
        return true;
      }
      combinations.add(key);
    }
  }

  return false;
}

/**
 * Get duplicate variant combinations for error messages
 */
export function getDuplicateVariants(
  variants: Array<{ color: string; sizes: Array<{ size: string }> }>,
): Array<{ color: string; size: string }> {
  const combinations = new Map<string, { color: string; size: string }>();
  const duplicates: Array<{ color: string; size: string }> = [];

  for (const variant of variants) {
    for (const size of variant.sizes) {
      const key = `${variant.color.toLowerCase()}-${size.size.toLowerCase()}`;
      if (combinations.has(key)) {
        duplicates.push({ color: variant.color, size: size.size });
      } else {
        combinations.set(key, { color: variant.color, size: size.size });
      }
    }
  }

  return duplicates;
}

/**
 * Check if any variant has stock available
 */
export function hasStockAvailable(
  variants: Array<{ sizes: Array<{ stock: number }> }>,
): boolean {
  return variants.some((variant) =>
    variant.sizes.some((size) => size.stock > 0),
  );
}

/**
 * Flatten variants from form structure to database structure
 */
export function flattenVariants(
  variants: Array<{
    id?: string;
    color: string;
    color_code?: string;
    sizes: Array<{ size: string; stock: number; sku?: string }>;
  }>,
): VariantData[] {
  const flattened: VariantData[] = [];

  for (const variant of variants) {
    for (const size of variant.sizes) {
      flattened.push({
        id: variant.id,
        color: variant.color,
        color_code: variant.color_code,
        size: size.size,
        stock: size.stock,
        sku: size.sku,
      });
    }
  }

  return flattened;
}

/**
 * Detect changes between original and updated variants
 * Returns categorized variants: created, updated, deleted
 */
export function detectVariantChanges(
  originalVariants: Array<{ id: string; color: string | null; size: string | null; stock: number; sku?: string | null; color_code?: string | null }>,
  updatedVariants: Array<{
    id?: string;
    color: string;
    color_code?: string;
    sizes: Array<{ size: string; stock: number; sku?: string }>;
  }>,
) {
  const flattened = flattenVariants(updatedVariants);
  
  // Variants to create (no ID)
  const toCreate = flattened.filter((v) => !v.id);

  // Variants to update (has ID and exists in original)
  const toUpdate = flattened.filter((v) => {
    if (!v.id) return false;
    
    const original = originalVariants.find((o) => o.id === v.id);
    if (!original) return false;

    // Check if anything changed (handle nullable fields)
    return (
      (original.color || "") !== v.color ||
      (original.size || "") !== v.size ||
      original.stock !== v.stock ||
      (original.sku || "") !== (v.sku || "") ||
      (original.color_code || "") !== (v.color_code || "")
    );
  });

  // Variants to delete (in original but not in updated)
  const updatedIds = flattened.map((v) => v.id).filter(Boolean) as string[];
  const toDelete = originalVariants.filter((v) => !updatedIds.includes(v.id));

  return {
    toCreate,
    toUpdate,
    toDelete,
  };
}

/**
 * Validate SKU uniqueness within a product
 */
export function hasUniqueSKUs(
  variants: Array<{ sizes: Array<{ sku?: string }> }>,
): boolean {
  const skus = new Set<string>();

  for (const variant of variants) {
    for (const size of variant.sizes) {
      if (size.sku) {
        const normalizedSKU = size.sku.toUpperCase();
        if (skus.has(normalizedSKU)) {
          return false;
        }
        skus.add(normalizedSKU);
      }
    }
  }

  return true;
}

/**
 * Get duplicate SKUs for error messages
 */
export function getDuplicateSKUs(
  variants: Array<{ sizes: Array<{ sku?: string }> }>,
): string[] {
  const skus = new Map<string, number>();
  const duplicates: string[] = [];

  for (const variant of variants) {
    for (const size of variant.sizes) {
      if (size.sku) {
        const normalizedSKU = size.sku.toUpperCase();
        const count = skus.get(normalizedSKU) || 0;
        skus.set(normalizedSKU, count + 1);
      }
    }
  }

  for (const [sku, count] of skus.entries()) {
    if (count > 1) {
      duplicates.push(sku);
    }
  }

  return duplicates;
}
