"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getProducts(
  productType?: "clothes" | "shoes" | "accessories",
) {
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select(
      `
        *,
        categories(*),
        product_variants(*),
        product_images(*)
      `,
    )
    .order("created_at", { ascending: false });

  if (productType) {
    query = query.eq("product_type", productType);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching products:", error);
    return { data: null, error };
  }

  return { data, error: null };
}

export async function getProductsPaginated(
  productType?: "clothes" | "shoes" | "accessories",
  page: number = 1,
  pageSize: number = 8,
) {
  const supabase = await createClient();

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("products")
    .select(
      `
      *,
      categories(*),
      product_variants(*),
      product_images(*)
    `,
      { count: "exact" },
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (productType) {
    query = query.eq("product_type", productType);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching products:", error);
    return { data: null, error, totalCount: 0, totalPages: 0 };
  }

  const totalPages = count ? Math.ceil(count / pageSize) : 0;

  return { data, error: null, totalCount: count || 0, totalPages };
}

export async function getProductById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select(
      `
      *,
      categories(*),
      product_variants(*),
      product_images(*)
    `,
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching product:", error);
    return { data: null, error };
  }

  return { data, error: null };
}

export async function getCategories() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching categories:", error);
    return { data: null, error };
  }

  return { data, error: null };
}

export async function createProduct(formData: {
  name: string;
  slug: string;
  description?: string;
  price: number;
  compare_at_price?: number;
  category_id?: string;
  product_type: "clothes" | "shoes" | "accessories";
  brand?: string;
  material?: string;
  is_featured?: boolean;
  is_active?: boolean;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .insert([formData])
    .select()
    .single();

  if (error) {
    console.error("Error creating product:", error);
    return { data: null, error };
  }

  revalidatePath("/admin");
  return { data, error: null };
}

export async function updateProduct(
  id: string,
  formData: {
    name?: string;
    slug?: string;
    description?: string;
    price?: number;
    compare_at_price?: number;
    category_id?: string;
    product_type?: "clothes" | "shoes" | "accessories";
    brand?: string;
    material?: string;
    is_featured?: boolean;
    is_active?: boolean;
  },
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .update(formData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating product:", error);
    return { data: null, error };
  }

  revalidatePath("/admin");
  return { data, error: null };
}

export async function deleteProduct(id: string) {
  const supabase = await createClient();

  // Delete related variants and images first (cascade should handle this, but being explicit)
  await supabase.from("product_variants").delete().eq("product_id", id);
  await supabase.from("product_images").delete().eq("product_id", id);

  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) {
    console.error("Error deleting product:", error);
    return { error };
  }

  revalidatePath("/admin");
  return { error: null };
}

export async function deleteAllProducts() {
  const supabase = await createClient();

  // Get all product IDs first
  const { data: products, error: fetchError } = await supabase
    .from("products")
    .select("id");

  if (fetchError) {
    console.error("Error fetching products:", fetchError);
    return { error: fetchError };
  }

  if (!products || products.length === 0) {
    return { error: null, deletedCount: 0 };
  }

  // Delete all variants and images (cascade should handle this, but being explicit)
  // Using a more reliable approach: delete all rows
  const { error: variantsError } = await supabase
    .from("product_variants")
    .delete()
    .neq("product_id", "00000000-0000-0000-0000-000000000000");
  
  if (variantsError) {
    console.error("Error deleting variants:", variantsError);
  }

  const { error: imagesError } = await supabase
    .from("product_images")
    .delete()
    .neq("product_id", "00000000-0000-0000-0000-000000000000");
  
  if (imagesError) {
    console.error("Error deleting images:", imagesError);
  }

  // Delete all products
  const { error } = await supabase
    .from("products")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (error) {
    console.error("Error deleting all products:", error);
    return { error };
  }

  revalidatePath("/admin");
  return { error: null, deletedCount: products.length };
}

export async function createProductVariant(variant: {
  product_id: string;
  size?: string;
  color?: string;
  color_code?: string;
  stock: number;
  sku?: string;
  price_override?: number;
  weight?: number;
  is_available?: boolean;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("product_variants")
    .insert([variant])
    .select()
    .single();

  if (error) {
    console.error("Error creating variant:", error);
    return { data: null, error };
  }

  revalidatePath("/admin");
  return { data, error: null };
}

export async function deleteProductVariant(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("product_variants")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting variant:", error);
    return { error };
  }

  revalidatePath("/admin");
  return { error: null };
}

export async function createProductImage(image: {
  product_id: string;
  variant_id?: string | null;
  image_url: string;
  alt_text?: string;
  is_primary?: boolean;
  display_order?: number;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("product_images")
    .insert([image])
    .select()
    .single();

  if (error) {
    console.error("Error creating image:", error);
    return { data: null, error };
  }

  revalidatePath("/admin");
  return { data, error: null };
}

export async function deleteProductImage(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("product_images").delete().eq("id", id);

  if (error) {
    console.error("Error deleting image:", error);
    return { error };
  }

  revalidatePath("/admin");
  return { error: null };
}

export async function updateProductVariant(
  id: string,
  variant: {
    product_id?: string;
    size?: string;
    color?: string;
    color_code?: string;
    stock?: number;
    sku?: string;
    price_override?: number;
    weight?: number;
    is_available?: boolean;
  }
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("product_variants")
    .update(variant)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating variant:", error);
    return { data: null, error };
  }

  revalidatePath("/admin");
  return { data, error: null };
}
